'use client';

import { useCallback, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, update, push, onDisconnect, get, serverTimestamp, runTransaction, remove } from 'firebase/database';
import type { GameInputAction, MatchSnapshot, PublicRoom, RoomMemberRole, ChatMessagePayload, GameOverPayload, PlayerMatchSnapshot } from '@/lib/multiplayer-protocol';
import { SESSION_STORAGE_KEY, useMultiplayerStore } from '@/lib/multiplayer-store';
import { audio } from '@/lib/audio-manager';
import { applyGameInput, createInitialMultiplayerGameState, flushGarbageQueue, getTickIntervalMs } from '@/lib/multiplayer-game-logic';

const sharedLocalGameStateRef = { current: null as any };
const sharedGameLoopRef = { current: null as NodeJS.Timeout | null };
const sharedListenersRef = { current: [] as Array<() => void> };

export function useMultiplayer() {
  const store = useMultiplayerStore();
  
  const localGameStateRef = sharedLocalGameStateRef;
  const gameLoopRef = sharedGameLoopRef;
  const listenersRef = sharedListenersRef;

  const cleanupListeners = useCallback(() => {
    listenersRef.current.forEach(unsub => unsub());
    listenersRef.current = [];
  }, []);

  const setupRoomListeners = useCallback((roomId: string) => {
    cleanupListeners();
    const joinedAt = Date.now();
    
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubRoom = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        store.setCurrentRoom(null);
        store.setStatus('connected');
        return;
      }
      
      const data = snapshot.val();
      const playersList = data.players ? Object.values(data.players) as any[] : [];
      const spectatorsList = data.spectators ? Object.values(data.spectators) as any[] : [];
      
      const formattedRoom: PublicRoom = {
        ...data,
        players: playersList,
        spectators: spectatorsList,
        spectatorCount: spectatorsList.length
      };
      
      store.setCurrentRoom(formattedRoom);
      
      const current = useMultiplayerStore.getState();
      if (current.role === 'spectator') {
        store.setStatus(data.isStarted ? 'spectating' : 'in-room');
      } else if (current.role === 'player') {
        if (data.isStarted && current.status === 'in-room') {
          store.setStatus('playing');
        } else if (!data.isStarted && current.status === 'playing') {
          store.setStatus('in-room');
        }
      }
    });
    listenersRef.current.push(() => unsubRoom());

    const chatRef = ref(db, `rooms/${roomId}/chat`);
    const unsubChat = onValue(chatRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const msgs = Object.values(snapshot.val()) as ChatMessagePayload[];
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      store.clearMessages(); // Reset and add all
      msgs.forEach(m => store.addMessage(m));
    });
    listenersRef.current.push(() => unsubChat());

    const matchRef = ref(db, `rooms/${roomId}/match`);
    const unsubMatch = onValue(matchRef, (snapshot) => {
      if (!snapshot.exists()) {
        store.setMatchSnapshot(null);
        return;
      }
      const data = snapshot.val();
      const playersList = data.players ? Object.values(data.players) as PlayerMatchSnapshot[] : [];
      
      // Reconstruct sparse arrays/objects from Firebase into real dense 2D arrays of nulls
      playersList.forEach(p => {
        if (p.gameState?.board) {
          const oldTiles: any = p.gameState.board.tiles || [];
          const newTiles: any[][] = [];
          for (let y = 0; y < p.gameState.board.height; y++) {
            const newRow: any[] = [];
            const oldRow = oldTiles[y];
            for (let x = 0; x < p.gameState.board.width; x++) {
              const cell = oldRow ? oldRow[x] : null;
              newRow.push(cell === undefined ? null : cell);
            }
            newTiles.push(newRow);
          }
          p.gameState.board.tiles = newTiles;
        }
      });
      
      const matchSnapshotObj: MatchSnapshot = {
        roomId,
        startedAt: data.startedAt,
        winnerId: data.winnerId || null,
        players: playersList
      };
      
      const stateSnapshot = useMultiplayerStore.getState();
      const prevMatch = stateSnapshot.matchSnapshot;
      store.setMatchSnapshot(matchSnapshotObj);
      
      const myId = stateSnapshot.playerId;
      if (myId) {
        const prevMe = prevMatch?.players.find(p => p.playerId === myId)?.gameState;
        const currentMe = playersList.find(p => p.playerId === myId)?.gameState;
        
        if (currentMe && prevMe) {
          if (currentMe.score > prevMe.score) {
            const hasNewYaku = currentMe.lastYaku && currentMe.lastYaku !== prevMe.lastYaku;
            if (hasNewYaku) {
              audio.playYaku();
            } else {
              audio.playClear(currentMe.combo);
            }
          } else if (!currentMe.currentTile || currentMe.currentTile.id !== prevMe.currentTile?.id) {
            audio.playPlace();
          }
          if (currentMe.currentTile && prevMe.currentTile && 
             (currentMe.currentTile.x !== prevMe.currentTile.x || currentMe.currentTile.y !== prevMe.currentTile.y)) {
            if (currentMe.currentTile.x !== prevMe.currentTile.x) {
              audio.playMove();
            }
          }
        }
      }
      
      const current = useMultiplayerStore.getState();
      const isMatchOver = playersList.some(p => p.gameState?.isGameOver);
      
      if (!prevMatch && matchSnapshotObj && !isMatchOver) {
        // Match started
        store.setLastGameOver(null);
        audio.enable();
        audio.startBgm();
        
        if (current.role === 'player') {
          store.setStatus('playing');
          // Initialize local game state
          const myPlayer = matchSnapshotObj.players.find(p => p.playerId === myId);
          if (myPlayer && myId) {
            localGameStateRef.current = myPlayer.gameState;
            startGameLoop(roomId, myId);
          }
        }
      }
    });
    listenersRef.current.push(() => unsubMatch());

    const gameOverRef = ref(db, `rooms/${roomId}/gameOver`);
    const unsubGameOver = onValue(gameOverRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val() as GameOverPayload;
      
      if (data.endedAt < joinedAt) return;
      
      const prevGameOver = store.lastGameOver;
      if (!prevGameOver || prevGameOver.endedAt !== data.endedAt) {
        store.setLastGameOver(data);
        audio.playGameOver();
        audio.stopBgm();
        stopGameLoop();
        
        const current = useMultiplayerStore.getState();
        if (current.role === 'player') {
          store.setStatus('in-room');
        }
      }
    });
    listenersRef.current.push(() => unsubGameOver());
    
  }, [cleanupListeners, store]);

  const startGameLoop = useCallback((roomId: string, playerId: string) => {
    stopGameLoop();
    
    const runTick = () => {
      if (!localGameStateRef.current || localGameStateRef.current.isGameOver) return;
      
      let state = localGameStateRef.current;
      
      // Flush garbage
      const { state: flushedState } = flushGarbageQueue(state);
      state = flushedState;
      
      const { state: newState, garbageSent, changed } = applyGameInput(state, 'soft-drop');
      
      if (changed || state !== flushedState) {
        localGameStateRef.current = newState;
        
        // Sync to firebase (strip undefined)
        update(ref(db, `rooms/${roomId}/match/players/${playerId}`), {
          gameState: JSON.parse(JSON.stringify(newState))
        });
        
        // Send garbage to opponent
        if (garbageSent > 0) {
          const matchSnapshot = useMultiplayerStore.getState().matchSnapshot;
          const opponent = matchSnapshot?.players.find(p => p.playerId !== playerId);
          if (opponent) {
            const oppRef = ref(db, `rooms/${roomId}/match/players/${opponent.playerId}/gameState/garbageQueue`);
            runTransaction(oppRef, (currentVal) => {
              return (currentVal || 0) + garbageSent;
            });
          }
        }
        
        // Check game over
        if (newState.isGameOver) {
          handleGameOver(roomId, playerId);
        }
      }
      
      const ms = getTickIntervalMs(newState.level);
      gameLoopRef.current = setTimeout(runTick, ms);
    };
    
    gameLoopRef.current = setTimeout(runTick, getTickIntervalMs(1));
  }, []);

  const stopGameLoop = useCallback(() => {
    if (gameLoopRef.current) {
      clearTimeout(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const handleGameOver = useCallback(async (roomId: string, loserId: string) => {
    const matchSnapshot = useMultiplayerStore.getState().matchSnapshot;
    if (!matchSnapshot) return;
    
    const opponent = matchSnapshot.players.find(p => p.playerId !== loserId);
    const winnerId = opponent ? opponent.playerId : loserId;
    const winnerName = opponent ? opponent.playerName : 'Unknown';
    
    const payload: GameOverPayload = {
      roomId,
      winnerId,
      winnerName,
      scores: matchSnapshot.players.map(p => ({
        playerId: p.playerId,
        playerName: p.playerName,
        score: p.gameState.score
      })),
      startedAt: matchSnapshot.startedAt,
      endedAt: Date.now(),
      roomName: useMultiplayerStore.getState().currentRoom?.name || 'Room'
    };
    
    await update(ref(db, `rooms/${roomId}`), {
      isStarted: false,
      gameOver: payload
    });
  }, []);

  // Use effects for global room list
  useEffect(() => {
    const roomsRef = ref(db, 'rooms');
    const unsub = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        store.setAvailableRooms([]);
        return;
      }
      const rooms = Object.values(data) as any[];
      const available = rooms.map(r => ({
        id: r.id,
        name: r.name,
        playerCount: r.players ? Object.keys(r.players).length : 0,
        maxPlayers: r.maxPlayers,
        spectatorCount: r.spectators ? Object.keys(r.spectators).length : 0,
        maxSpectators: r.maxSpectators,
        isStarted: r.isStarted,
        createdAt: r.createdAt
      }));
      store.setAvailableRooms(available);
    });
    
    // Listen to connection state
    const unsubConnected = onValue(ref(db, '.info/connected'), (snap) => {
      store.setServerConnected(snap.val() === true);
    });
    
    return () => {
      unsub();
      unsubConnected();
    };
  }, []);

  const connect = useCallback(async (playerName: string) => {
    store.setStatus('connecting');
    store.setError(null);
    store.setPlayerName(playerName);

    try {
      const playerId = Math.random().toString(36).slice(2, 10);
      const sessionToken = playerId + '-' + Date.now();
      
      store.setPlayerId(playerId);
      store.setSessionToken(sessionToken);
      store.setStatus('connected');
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionToken);
      }
      return true;
    } catch (err) {
      console.error('Connect error:', err);
      store.setError(`Firebase接続エラー: ${err}`);
      store.setStatus('disconnected');
      return false;
    }
  }, [store]);

  const resumeSession = useCallback(async () => {
    if (typeof window === 'undefined') return false;
    const savedToken = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!savedToken) return false;

    store.setStatus('reconnecting');
    const playerId = savedToken.split('-')[0];

    store.setSessionToken(savedToken);
    store.setPlayerId(playerId);
    store.setStatus('connected');
    return true;
  }, [store]);

  const disconnect = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    store.reset();
    cleanupListeners();
    stopGameLoop();
  }, [store, cleanupListeners, stopGameLoop]);

  const createRoom = useCallback(async (roomName: string) => {
    const { playerId, playerName } = store;
    if (!playerId) return false;

    const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
    const roomRef = ref(db, `rooms/${roomId}`);
    
    const newRoom = {
      id: roomId,
      name: roomName,
      maxPlayers: 2,
      maxSpectators: 10,
      isStarted: false,
      createdAt: Date.now(),
      players: {
        [playerId]: {
          id: playerId,
          name: playerName,
          isReady: false,
          isHost: true,
          score: 0,
          isConnected: true
        }
      }
    };

    await set(roomRef, newRoom);
    
    // Setup onDisconnect
    onDisconnect(ref(db, `rooms/${roomId}/players/${playerId}`)).remove();

    store.setRole('player');
    store.setStatus('in-room');
    setupRoomListeners(roomId);
    return true;
  }, [store, setupRoomListeners]);

  const joinRoom = useCallback(async (roomId: string) => {
    const { playerId, playerName } = store;
    if (!playerId) return false;

    const playerRef = ref(db, `rooms/${roomId}/players/${playerId}`);
    await set(playerRef, {
      id: playerId,
      name: playerName,
      isReady: false,
      isHost: false,
      score: 0,
      isConnected: true
    });
    
    onDisconnect(playerRef).remove();

    store.setRole('player');
    store.setStatus('in-room');
    store.clearMessages();
    setupRoomListeners(roomId);
    return true;
  }, [store, setupRoomListeners]);

  const spectateRoom = useCallback(async (roomId: string) => {
    const { playerId, playerName } = store;
    if (!playerId) return false;

    const specRef = ref(db, `rooms/${roomId}/spectators/${playerId}`);
    await set(specRef, {
      id: playerId,
      name: playerName,
      isConnected: true
    });
    
    onDisconnect(specRef).remove();

    store.setRole('spectator');
    store.clearMessages();
    setupRoomListeners(roomId);
    return true;
  }, [store, setupRoomListeners]);

  const leaveRoom = useCallback(async () => {
    const { playerId, currentRoom, role } = store;
    if (!playerId || !currentRoom) return;

    if (role === 'player') {
      await remove(ref(db, `rooms/${currentRoom.id}/players/${playerId}`));
    } else {
      await remove(ref(db, `rooms/${currentRoom.id}/spectators/${playerId}`));
    }

    audio.stopBgm();
    stopGameLoop();
    cleanupListeners();
    
    store.setCurrentRoom(null);
    store.setRole(null);
    store.setMatchSnapshot(null);
    store.setLastGameOver(null);
    store.setStatus('connected');
    store.clearMessages();
  }, [store, cleanupListeners, stopGameLoop]);

  const toggleReady = useCallback(async () => {
    const { playerId, currentRoom } = store;
    if (!playerId || !currentRoom) return;

    const me = currentRoom.players.find(p => p.id === playerId);
    const nextReady = !me?.isReady;

    await update(ref(db, `rooms/${currentRoom.id}/players/${playerId}`), {
      isReady: nextReady
    });
  }, [store]);

  const startGame = useCallback(async () => {
    const { currentRoom } = store;
    if (!currentRoom) return;
    
    // Ensure all are ready
    if (!currentRoom.players.every(p => p.isReady)) {
      store.setError('全員が準備完了になっていません');
      return;
    }

    const roomId = currentRoom.id;
    const players: Record<string, PlayerMatchSnapshot> = {};
    
    for (const p of currentRoom.players) {
      players[p.id] = {
        playerId: p.id,
        playerName: p.name,
        gameState: JSON.parse(JSON.stringify(createInitialMultiplayerGameState()))
      };
    }

    const matchData = {
      startedAt: Date.now(),
      winnerId: null,
      players
    };

    const updates: any = {};
    updates[`rooms/${roomId}/match`] = matchData;
    updates[`rooms/${roomId}/isStarted`] = true;
    updates[`rooms/${roomId}/gameOver`] = null;

    await update(ref(db), updates);
  }, [store]);

  const sendMessage = useCallback(async (text: string) => {
    const { playerId, playerName, currentRoom, role } = store;
    if (!playerId || !currentRoom || !text.trim()) return;

    const newMsgRef = push(ref(db, `rooms/${currentRoom.id}/chat`));
    await set(newMsgRef, {
      id: newMsgRef.key,
      playerId,
      playerName,
      text: text.trim(),
      timestamp: Date.now(),
      role: role || 'system'
    });
  }, [store]);

  const sendGameInput = useCallback(async (action: GameInputAction) => {
    const { playerId, currentRoom, role, status, matchSnapshot } = useMultiplayerStore.getState();
    if (role !== 'player' || status !== 'playing' || !currentRoom || !playerId || !localGameStateRef.current) return;

    const { state: newState, garbageSent, changed } = applyGameInput(localGameStateRef.current, action);
    
    if (changed) {
      localGameStateRef.current = newState;
      
      update(ref(db, `rooms/${currentRoom.id}/match/players/${playerId}`), {
        gameState: JSON.parse(JSON.stringify(newState))
      });

      if (garbageSent > 0) {
        const opponent = matchSnapshot?.players.find(p => p.playerId !== playerId);
        if (opponent) {
          const oppRef = ref(db, `rooms/${currentRoom.id}/match/players/${opponent.playerId}/gameState/garbageQueue`);
          runTransaction(oppRef, (currentVal) => {
            return (currentVal || 0) + garbageSent;
          });
        }
      }

      if (newState.isGameOver) {
        handleGameOver(currentRoom.id, playerId);
      }
    }
  }, [handleGameOver]);

  return {
    status: store.status,
    role: store.role,
    playerId: store.playerId,
    playerName: store.playerName,
    currentRoom: store.currentRoom,
    availableRooms: store.availableRooms,
    messages: store.messages,
    matchSnapshot: store.matchSnapshot,
    lastGameOver: store.lastGameOver,
    error: store.error,
    isServerConnected: store.isServerConnected,

    connect,
    resumeSession,
    disconnect,
    createRoom,
    joinRoom,
    spectateRoom,
    leaveRoom,
    toggleReady,
    startGame,
    sendMessage,
    sendGameInput,
  };
}
