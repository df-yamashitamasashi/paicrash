import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  createInitialMultiplayerGameState, 
  applyGameInput, 
  flushGarbageQueue, 
} from '@/lib/multiplayer-game-logic';
import { getTickIntervalMs } from '@/lib/game-engine';
import type { GameState } from '@/lib/mahjong-types';
import type { GameInputAction } from '@/lib/multiplayer-protocol';
import { audio } from '@/lib/audio-manager';

import { useGameStore } from '@/lib/game-store';

interface CombinedState {
  player: GameState | null;
  cpu: GameState | null;
}

export function useCpuGame() {
  const [gameState, setGameState] = useState<CombinedState>({ player: null, cpu: null });
  const gameStateRef = useRef<CombinedState>({ player: null, cpu: null });
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'cpu' | null>(null);
  const [cpuSpeed, setCpuSpeed] = useState<'slow' | 'normal' | 'fast' | 'insane'>('normal');
  const [isOjamaEnabled, setIsOjamaEnabled] = useState(true);
  const isOjamaEnabledRef = useRef(true);
  useEffect(() => {
    isOjamaEnabledRef.current = isOjamaEnabled;
  }, [isOjamaEnabled]);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // CPUの思考用タイマー
  const cpuActionTimerRef = useRef(0);
  const cpuTargetXRef = useRef<number | null>(null);
  const currentCpuTileIdRef = useRef<string | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Yakuman visual animation states
  const [playerAnimBoard, setPlayerAnimBoard] = useState<any>(null);
  const isPlayerAnimatingRef = useRef(false);

  const startMatch = useCallback(() => {
    audio.enable();
    audio.stopBgm();
    
    const initialGameState = {
      player: createInitialMultiplayerGameState(true), // true = allow debug yakuman tiles
      cpu: createInitialMultiplayerGameState(false),
    };
    gameStateRef.current = initialGameState;
    setGameState(initialGameState);
    setIsGameOver(false);
    setWinner(null);
    cpuActionTimerRef.current = 0;
    cpuTargetXRef.current = null;
    currentCpuTileIdRef.current = null;
    isPlayerAnimatingRef.current = false;
    setPlayerAnimBoard(null);
    useGameStore.setState({ isYakumanAnimating: false, isYakumanDissolving: false });

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setCountdown(3);
    audio.playCountdownBeep();

    let count = 3;
    const intervalId = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(intervalId);
        setCountdown(null);
        audio.playStartFanfare();
        audio.startBgm();
      } else {
        setCountdown(count);
        audio.playCountdownBeep();
      }
    }, 1000);
    countdownIntervalRef.current = intervalId;
  }, []);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const handlePlayerYakumanAnimation = useCallback((nextPlayer: GameState) => {
    isPlayerAnimatingRef.current = true;
    
    // Reconstruct board for animation
    const animBoard = JSON.parse(JSON.stringify(nextPlayer.board));
    const yakumanClear = nextPlayer.clearHistory[nextPlayer.clearHistory.length - 1];
    if (yakumanClear) {
      yakumanClear.tiles.forEach(t => {
        if (t.y >= 0 && t.y < animBoard.height && t.x >= 0 && t.x < animBoard.width) {
          animBoard.tiles[t.y][t.x] = { ...t, isClearing: true };
        }
      });
    }
    setPlayerAnimBoard(animBoard);
    useGameStore.setState({ isYakumanAnimating: true, yakumanName: nextPlayer.lastYaku!.japaneseName });
    audio.playYakuman();
    
    setTimeout(() => {
      useGameStore.setState({ isYakumanDissolving: true });
      setTimeout(() => {
        setPlayerAnimBoard(null);
        isPlayerAnimatingRef.current = false;
        useGameStore.setState({ isYakumanAnimating: false, isYakumanDissolving: false });
      }, 2000);
    }, 9000);
  }, []);

  const togglePause = useCallback(() => {
    if (isGameOver || countdown !== null) return;
    setIsPaused(prev => {
      if (prev) {
        audio.startBgm();
      } else {
        audio.stopBgm();
      }
      return !prev;
    });
  }, [isGameOver, countdown]);

  const sendPlayerInput = useCallback((action: GameInputAction) => {
    if (countdown !== null || isPaused || isPlayerAnimatingRef.current) return;
    
    const prev = gameStateRef.current;
    if (!prev.player || prev.player.isGameOver || isGameOver) return;
    let nextPlayer = prev.player;
    let nextCpu = prev.cpu;

    const prevX = nextPlayer.currentTile?.x;
    const prevY = nextPlayer.currentTile?.y;

    const prevPlayerScore = nextPlayer.score;
    const prevPlayerYaku = nextPlayer.lastYaku;

    const result = applyGameInput(nextPlayer, action);
    nextPlayer = result.state;

    // Play local sound effects for player
    if (action === 'move-left' || action === 'move-right') {
      if (nextPlayer.currentTile && nextPlayer.currentTile.x !== prevX) {
        audio.playMove();
      }
    } else if (action === 'hard-drop') {
      audio.playPlace();
    }

    // Detect manual Yakuman drop
    if (nextPlayer.score > prevPlayerScore) {
      const hasNewYaku = nextPlayer.lastYaku && nextPlayer.lastYaku !== prevPlayerYaku;
      if (hasNewYaku) {
        const lastClearYakuName = nextPlayer.lastYaku!.name;
        if (lastClearYakuName === 'Thirteen Orphans' || lastClearYakuName === 'All Honors' || lastClearYakuName === 'Nine Gates') {
          handlePlayerYakumanAnimation(nextPlayer);
        } else {
          audio.playYaku();
        }
      } else {
        audio.playClear(nextPlayer.combo);
      }
    }

    if (result.garbageSent > 0 && nextCpu && isOjamaEnabledRef.current) {
      nextCpu = { ...nextCpu, garbageQueue: nextCpu.garbageQueue + result.garbageSent };
    }
    
    const newState = { player: nextPlayer, cpu: nextCpu };
    gameStateRef.current = newState;
    setGameState(newState);
  }, [isGameOver, countdown, isPaused]);

  // Player Tick Loop
  useEffect(() => {
    if (!gameState.player || isGameOver || countdown !== null || isPaused) return;
    const speed = getTickIntervalMs(gameState.player.level);
    
    const interval = setInterval(() => {
      if (isPlayerAnimatingRef.current) return; // Block gravity ticks during Yakuman animation

      const prev = gameStateRef.current;
      if (!prev.player) return;
      let nextPlayer = prev.player;
      let nextCpu = prev.cpu;

      const prevPlayerScore = nextPlayer.score;
      const prevPlayerCombo = nextPlayer.combo;
      const prevPlayerYaku = nextPlayer.lastYaku;
      
      if (nextPlayer.garbageQueue > 0) {
        nextPlayer = flushGarbageQueue(nextPlayer).state;
      }
      if (nextPlayer.currentTile) {
        const res = applyGameInput(nextPlayer, 'soft-drop');
        nextPlayer = res.state;

        // Sound triggers and Visual Yakuman for player clears and drops
        if (nextPlayer.score > prevPlayerScore) {
          const hasNewYaku = nextPlayer.lastYaku && nextPlayer.lastYaku !== prevPlayerYaku;
          if (hasNewYaku) {
            const lastClearYakuName = nextPlayer.lastYaku!.name;
            if (lastClearYakuName === 'Thirteen Orphans' || lastClearYakuName === 'All Honors' || lastClearYakuName === 'Nine Gates') {
              handlePlayerYakumanAnimation(nextPlayer);
            } else {
              audio.playYaku();
            }
          } else {
            audio.playClear(nextPlayer.combo);
          }
        } else if (!nextPlayer.currentTile || nextPlayer.currentTile.id !== prev.player?.currentTile?.id) {
          // New tile spawned, which means previous tile was placed
          audio.playPlace();
        }

        if (res.garbageSent > 0 && nextCpu && isOjamaEnabledRef.current) {
          nextCpu = { ...nextCpu, garbageQueue: nextCpu.garbageQueue + res.garbageSent };
        }
      }
      
      const newState = { player: nextPlayer, cpu: nextCpu };
      gameStateRef.current = newState;
      setGameState(newState);
    }, speed);

    return () => clearInterval(interval);
  }, [gameState.player?.level, isGameOver, countdown, isPaused]);

  // CPU Tick Loop & AI (Speed depends on cpuSpeed setting)
  useEffect(() => {
    if (!gameState.cpu || isGameOver || countdown !== null || isPaused) return;
    
    let aiSpeed = 600;
    if (cpuSpeed === 'slow') aiSpeed = 1000;
    else if (cpuSpeed === 'normal') aiSpeed = 600;
    else if (cpuSpeed === 'fast') aiSpeed = 300;
    else if (cpuSpeed === 'insane') aiSpeed = 150;
    
    const interval = setInterval(() => {
      if (isPlayerAnimatingRef.current) return; // Block CPU tick loop during player's Yakuman animation

      const prev = gameStateRef.current;
      if (!prev.cpu || !prev.player) return;
      let nextCpu = prev.cpu;
      let nextPlayer = prev.player;

      const prevCpuScore = nextCpu.score;
      const prevCpuYaku = nextCpu.lastYaku;
      
      // 1. おじゃまブロックの処理
      if (nextCpu.garbageQueue > 0) {
        nextCpu = flushGarbageQueue(nextCpu).state;
      }
      
      // 2. 現在のブロックの操作
      if (nextCpu.currentTile) {
        const tileId = nextCpu.currentTile.id;
        let targetX = cpuTargetXRef.current;

        // 新しいブロックになったか、ターゲットが未設定の場合は目標列を計算
        if (currentCpuTileIdRef.current !== tileId || targetX === null) {
          currentCpuTileIdRef.current = tileId;
          targetX = nextCpu.currentTile.x;
          let bestScore = -Infinity;
          const current = nextCpu.currentTile;
          
          for (let x = 0; x < nextCpu.board.width; x++) {
            let topY = nextCpu.board.height;
            for (let y = 0; y < nextCpu.board.height; y++) {
              if (nextCpu.board.tiles[y][x]) {
                topY = y;
                break;
              }
            }
            
            if (topY <= 0) continue; 
            
            let score = topY * 2; 
            
            const bottomTile = topY < nextCpu.board.height ? nextCpu.board.tiles[topY][x] : null;
            const leftTile = x > 0 && topY - 1 >= 0 ? nextCpu.board.tiles[topY - 1][x - 1] : null;
            const rightTile = x < nextCpu.board.width - 1 && topY - 1 >= 0 ? nextCpu.board.tiles[topY - 1][x + 1] : null;
            const bottomLeftTile = x > 0 && topY < nextCpu.board.height ? nextCpu.board.tiles[topY][x - 1] : null;
            const bottomRightTile = x < nextCpu.board.width - 1 && topY < nextCpu.board.height ? nextCpu.board.tiles[topY][x + 1] : null;
            
            const isSameTile = (t1: any, t2: any) => {
              if (!t1 || !t2) return false;
              if (t1.honor || t2.honor) return t1.honor === t2.honor;
              return t1.suit === t2.suit && t1.number === t2.number;
            };
            
            const isSeqTile = (t1: any, t2: any, diff: number) => {
              if (!t1 || !t2 || t1.honor || t2.honor || t1.suit !== t2.suit) return false;
              return t1.number != null && t2.number != null && Math.abs(t1.number - t2.number) === diff;
            };

            const adjacents = [bottomTile, leftTile, rightTile, bottomLeftTile, bottomRightTile].filter(t => t != null);

            let sameCount = 0;
            const seq1Tiles: any[] = [];
            const seq2Tiles: any[] = [];
            
            for (const adj of adjacents) {
              if (isSameTile(adj, current)) {
                score += 60;
                sameCount++;
              } else if (isSeqTile(adj, current, 1)) {
                score += 40;
                seq1Tiles.push(adj);
              } else if (isSeqTile(adj, current, 2)) {
                score += 20;
                seq2Tiles.push(adj);
              }
            }

            if (sameCount >= 2) {
              score += 800; // Complete Triplet in any direction
            }

            // Sequence of type: (current-1), current, (current+1) in any direction
            if (seq1Tiles.length >= 2) {
               const numbers = new Set(seq1Tiles.map(t => t.number));
               if (numbers.size >= 2) score += 600;
            }

            // Sequence of type: (current-2), (current-1), current OR current, (current+1), (current+2) in any direction
            if (seq1Tiles.length > 0 && seq2Tiles.length > 0) {
              let seqFound = false;
              for (const t1 of seq1Tiles) {
                for (const t2 of seq2Tiles) {
                  if (Math.abs(t1.number! - t2.number!) === 1) {
                    score += 600;
                    seqFound = true;
                    break;
                  }
                }
                if (seqFound) break;
              }
            }

            // Keep deep vertical check since dropping directly on top is easiest to set up
            if (bottomTile) {
              if (isSameTile(bottomTile, current)) {
                score += 40; // extra weight for vertical stacking
                const bottomBottomTile = topY + 1 < nextCpu.board.height ? nextCpu.board.tiles[topY + 1][x] : null;
                if (bottomBottomTile && isSameTile(bottomBottomTile, current)) score += 500;
              } else if (isSeqTile(bottomTile, current, 1)) {
                const bottomBottomTile = topY + 1 < nextCpu.board.height ? nextCpu.board.tiles[topY + 1][x] : null;
                if (bottomBottomTile && isSeqTile(bottomBottomTile, current, 2)) {
                  if (isSeqTile(bottomBottomTile, bottomTile, 1)) {
                    score += 400;
                  }
                }
              }
            }

            // Add tiny randomness to prevent completely deterministic robotic play (reduces stuttering)
            score += Math.random() * 5;
            
            if (score > bestScore) {
              bestScore = score;
              targetX = x;
            }
          }
          cpuTargetXRef.current = targetX;
        }

        if (nextCpu.currentTile.x < targetX) {
          nextCpu = applyGameInput(nextCpu, 'move-right').state;
        } else if (nextCpu.currentTile.x > targetX) {
          nextCpu = applyGameInput(nextCpu, 'move-left').state;
        } else {
          // High efficiency: Hard drop immediately when aligned, instead of waiting or choosing slow soft-drops
          const res = applyGameInput(nextCpu, 'hard-drop');
          nextCpu = res.state;

          // CPU drop sounds (usually slightly quieter or standard SFX)
          if (nextCpu.score > prevCpuScore) {
            const hasNewYaku = nextCpu.lastYaku && nextCpu.lastYaku !== prevCpuYaku;
            if (hasNewYaku) {
              audio.playYaku();
            } else {
              audio.playClear(nextCpu.combo);
            }
          } else if (!nextCpu.currentTile || nextCpu.currentTile.id !== prev.cpu?.currentTile?.id) {
            audio.playPlace();
          }

          if (res.garbageSent > 0 && isOjamaEnabledRef.current) {
            nextPlayer = { ...nextPlayer, garbageQueue: nextPlayer.garbageQueue + res.garbageSent };
          }
        }
      }
      
      const newState = { player: nextPlayer, cpu: nextCpu };
      gameStateRef.current = newState;
      setGameState(newState);
    }, aiSpeed);

    return () => clearInterval(interval);
  }, [gameState.cpu?.level, isGameOver, cpuSpeed, countdown, isPaused]);

  // Check Game Over — winner is determined by highest score, not survival
  useEffect(() => {
    if (isGameOver) return;
    const anyGameOver = gameState.player?.isGameOver || gameState.cpu?.isGameOver;
    if (!anyGameOver) return;
    
    audio.playGameOver();
    audio.stopBgm();
    setIsGameOver(true);
    
    const playerScore = gameState.player?.score ?? 0;
    const cpuScore = gameState.cpu?.score ?? 0;
    
    if (playerScore >= cpuScore) {
      setWinner('player');
    } else {
      setWinner('cpu');
    }
  }, [gameState.player?.isGameOver, gameState.cpu?.isGameOver, isGameOver]);

  return {
    playerState: gameState.player,
    cpuState: gameState.cpu,
    playerAnimBoard,
    isGameOver,
    winner,
    startMatch,
    sendPlayerInput,
    isPaused,
    togglePause,
    cpuSpeed,
    setCpuSpeed,
    countdown,
    isOjamaEnabled,
    setIsOjamaEnabled
  };
}
