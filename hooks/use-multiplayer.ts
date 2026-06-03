'use client';

import { useCallback, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { GameInputAction, MatchSnapshot } from '@/lib/multiplayer-protocol';
import {
  ClientEvents,
  ServerEvents,
} from '@/lib/multiplayer-protocol';
import {
  SESSION_STORAGE_KEY,
  useMultiplayerStore,
} from '@/lib/multiplayer-store';
import { audio } from '@/lib/audio-manager';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

function emitWithAck<T>(socket: Socket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.timeout(10_000).emit(event, payload, (err: Error | null, response: T) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(response);
    });
  });
}

function attachSocketListeners(socket: Socket): void {
  const store = () => useMultiplayerStore.getState();

  socket.on('connect', () => {
    store().setServerConnected(true);
    store().setError(null);
    
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null;
    if (savedToken && store().status !== 'reconnecting') {
      socket.emit(ClientEvents.SESSION_RESUME, { sessionToken: savedToken }, (res: any) => {
        if (!res?.ok) {
           store().setStatus('disconnected');
           if (typeof window !== 'undefined') localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      });
    }
  });

  socket.on('disconnect', () => {
    store().setServerConnected(false);
  });

  socket.on('connect_error', () => {
    store().setError('ゲームサーバーに接続できません。しばらくしてから再度お試しください。');
    if (store().status === 'connecting' || store().status === 'reconnecting') {
      store().setStatus('disconnected');
    }
  });

  socket.on(ServerEvents.SESSION_CREATED, (info) => {
    store().setPlayerId(info.playerId);
    store().setPlayerName(info.playerName);
    store().setSessionToken(info.sessionToken);
  });

  socket.on(ServerEvents.SESSION_RESUMED, (info) => {
    store().setPlayerId(info.playerId);
    store().setPlayerName(info.playerName);
    store().setSessionToken(info.sessionToken);
    store().setRole(info.role);
    
    const room = store().currentRoom;
    if (info.role === 'spectator') {
      store().setStatus('spectating');
    } else if (info.roomId) {
      if (room?.id === info.roomId && room?.isStarted) {
        store().setStatus('playing');
      } else {
        store().setStatus('in-room');
      }
    } else {
      store().setStatus('connected');
    }
  });

  socket.on(ServerEvents.ROOM_LIST, (rooms) => {
    store().setAvailableRooms(rooms);
  });

  socket.on(ServerEvents.ROOM_UPDATED, (room) => {
    store().setCurrentRoom(room);
    if (store().role === 'spectator') {
      store().setStatus(room.isStarted && store().matchSnapshot ? 'spectating' : 'in-room');
    }
  });

  socket.on(ServerEvents.CHAT_MESSAGE, (message) => {
    store().addMessage(message);
  });

  socket.on(ServerEvents.MATCH_STARTED, (match) => {
    store().setMatchSnapshot(match);
    store().setLastGameOver(null);
    audio.enable();
    audio.startBgm();
    if (store().role === 'spectator') {
      store().setStatus('spectating');
    } else {
      store().setStatus('playing');
    }
  });

  socket.on(ServerEvents.MATCH_STATE, (match: MatchSnapshot) => {
    const prevMatch = store().matchSnapshot;
    store().setMatchSnapshot(match);

    // Audio SFX for local player events in multiplayer
    const myId = store().playerId;
    const prevMe = prevMatch?.players.find((p) => p.playerId === myId)?.gameState;
    const currentMe = match.players.find((p) => p.playerId === myId)?.gameState;

    if (currentMe && prevMe) {
      // If score increased, a match was cleared
      if (currentMe.score > prevMe.score) {
        const hasNewYaku = currentMe.lastYaku && currentMe.lastYaku !== prevMe.lastYaku;
        if (hasNewYaku) {
          audio.playYaku();
        } else {
          audio.playClear(currentMe.combo);
        }
      } else if (!currentMe.currentTile || currentMe.currentTile.id !== prevMe.currentTile?.id) {
        // Tile was placed
        audio.playPlace();
      }
      
      // If position changed, play move
      if (currentMe.currentTile && prevMe.currentTile && 
         (currentMe.currentTile.x !== prevMe.currentTile.x || currentMe.currentTile.y !== prevMe.currentTile.y)) {
        if (currentMe.currentTile.x !== prevMe.currentTile.x) {
          audio.playMove();
        }
      }
    }
  });

  socket.on(ServerEvents.MATCH_ENDED, (gameOver) => {
    store().setLastGameOver(gameOver);
    audio.playGameOver();
    audio.stopBgm();
    if (store().role === 'spectator') {
      store().setStatus('spectating');
    } else {
      store().setStatus('in-room');
    }
  });

  socket.on(ServerEvents.ERROR, (payload: { code: string; message: string }) => {
    store().setError(payload.message);
  });
}

let globalSocket: Socket | null = null;

export function useMultiplayer() {
  const store = useMultiplayerStore();

  const getSocket = useCallback(() => {
    if (globalSocket) {
      return globalSocket;
    }

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });

    attachSocketListeners(socket);
    globalSocket = socket;
    return socket;
  }, []);

  const connectSocket = useCallback(async () => {
    const socket = getSocket();
    if (socket.connected) return socket;

    socket.connect();
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('connect_error', (err) => reject(err));
    });
    return socket;
  }, [getSocket]);

  const connect = useCallback(async (playerName: string) => {
    store.setStatus('connecting');
    store.setError(null);
    store.setPlayerName(playerName);

    try {
      const socket = await connectSocket();
      const response = await emitWithAck<{
        ok: boolean;
        session?: { playerId: string; playerName: string; sessionToken: string };
        error?: { message: string };
      }>(socket, ClientEvents.SESSION_CREATE, { playerName });

      if (!response.ok || !response.session) {
        store.setError(response.error?.message ?? '接続に失敗しました。');
        store.setStatus('disconnected');
        return false;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, response.session.sessionToken);
      }
      store.setStatus('connected');
      return true;
    } catch {
      store.setError('ゲームサーバーに接続できません。');
      store.setStatus('disconnected');
      return false;
    }
  }, [connectSocket, store]);

  const resumeSession = useCallback(async () => {
    if (typeof window === 'undefined') return false;
    const savedToken = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!savedToken) return false;

    store.setStatus('reconnecting');

    try {
      const socket = await connectSocket();
      const response = await emitWithAck<{ ok: boolean }>(
        socket,
        ClientEvents.SESSION_RESUME,
        { sessionToken: savedToken },
      );

      if (!response.ok) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        store.setStatus('disconnected');
        return false;
      }

      store.setSessionToken(savedToken);
      return true;
    } catch {
      store.setStatus('disconnected');
      return false;
    }
  }, [connectSocket, store]);

  const disconnect = useCallback(() => {
    globalSocket?.disconnect();
    globalSocket = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    store.reset();
  }, [store]);

  const createRoom = useCallback(async (roomName: string) => {
    const token = store.sessionToken;
    if (!token) return false;

    const response = await emitWithAck<{ ok: boolean; error?: { message: string } }>(
      getSocket(),
      ClientEvents.ROOM_CREATE,
      { sessionToken: token, roomName },
    );

    if (!response.ok) {
      store.setError(response.error?.message ?? '部屋を作成できませんでした。');
      return false;
    }

    store.setRole('player');
    store.setStatus('in-room');
    return true;
  }, [getSocket, store]);

  const joinRoom = useCallback(async (roomId: string) => {
    const token = store.sessionToken;
    if (!token) return false;

    const response = await emitWithAck<{ ok: boolean; error?: { message: string } }>(
      getSocket(),
      ClientEvents.ROOM_JOIN,
      { sessionToken: token, roomId },
    );

    if (!response.ok) {
      store.setError(response.error?.message ?? '部屋に参加できませんでした。');
      return false;
    }

    store.setRole('player');
    store.setStatus('in-room');
    store.clearMessages();
    return true;
  }, [getSocket, store]);

  const spectateRoom = useCallback(async (roomId: string) => {
    const token = store.sessionToken;
    if (!token) return false;

    const response = await emitWithAck<{ ok: boolean; error?: { message: string } }>(
      getSocket(),
      ClientEvents.ROOM_SPECTATE,
      { sessionToken: token, roomId },
    );

    if (!response.ok) {
      store.setError(response.error?.message ?? '観戦できませんでした。');
      return false;
    }

    store.setRole('spectator');
    store.clearMessages();
    return true;
  }, [getSocket, store]);

  const leaveRoom = useCallback(async () => {
    const token = store.sessionToken;
    if (!token) return;

    await emitWithAck(getSocket(), ClientEvents.ROOM_LEAVE, { sessionToken: token });
    audio.stopBgm();
    store.setCurrentRoom(null);
    store.setRole(null);
    store.setMatchSnapshot(null);
    store.setLastGameOver(null);
    store.setStatus('connected');
    store.clearMessages();
  }, [getSocket, store]);

  const toggleReady = useCallback(async () => {
    const token = store.sessionToken;
    const room = store.currentRoom;
    const playerId = store.playerId;
    if (!token || !room || !playerId) return;

    const me = room.players.find((p) => p.id === playerId);
    const nextReady = !me?.isReady;

    await emitWithAck(getSocket(), ClientEvents.ROOM_READY, {
      sessionToken: token,
      isReady: nextReady,
    });
  }, [getSocket, store]);

  const startGame = useCallback(async () => {
    const token = store.sessionToken;
    if (!token) return;

    const response = await emitWithAck<{ ok: boolean; error?: { message: string } }>(
      getSocket(),
      ClientEvents.ROOM_START,
      { sessionToken: token },
    );

    if (!response.ok) {
      store.setError(response.error?.message ?? 'ゲームを開始できませんでした。');
    }
  }, [getSocket, store]);

  const sendMessage = useCallback(async (text: string) => {
    const token = store.sessionToken;
    if (!token || !text.trim()) return;

    await emitWithAck(getSocket(), ClientEvents.CHAT_SEND, {
      sessionToken: token,
      text: text.trim(),
    });
  }, [getSocket, store]);

  const sendGameInput = useCallback(async (action: GameInputAction) => {
    const current = useMultiplayerStore.getState();
    if (!current.sessionToken || current.role !== 'player' || current.status !== 'playing') return;

    await emitWithAck(getSocket(), ClientEvents.GAME_INPUT, {
      sessionToken: current.sessionToken,
      action,
    });
  }, [getSocket]);

  // Removed unmount cleanup to prevent socket disconnect on route/component change

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
