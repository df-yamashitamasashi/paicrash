import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  createInitialMultiplayerGameState, 
  applyGameInput, 
  flushGarbageQueue, 
  getTickIntervalMs 
} from '@/lib/multiplayer-game-logic';
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
  const [countdown, setCountdown] = useState<number | null>(null);
  
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

  const sendPlayerInput = useCallback((action: GameInputAction) => {
    if (countdown !== null || isPlayerAnimatingRef.current) return;
    
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

    if (result.garbageSent > 0 && nextCpu) {
      nextCpu = { ...nextCpu, garbageQueue: nextCpu.garbageQueue + result.garbageSent };
    }
    
    const newState = { player: nextPlayer, cpu: nextCpu };
    gameStateRef.current = newState;
    setGameState(newState);
  }, [isGameOver, countdown]);

  // Player Tick Loop
  useEffect(() => {
    if (!gameState.player || isGameOver || countdown !== null) return;
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

        if (res.garbageSent > 0 && nextCpu) {
          nextCpu = { ...nextCpu, garbageQueue: nextCpu.garbageQueue + res.garbageSent };
        }
      }
      
      const newState = { player: nextPlayer, cpu: nextCpu };
      gameStateRef.current = newState;
      setGameState(newState);
    }, speed);

    return () => clearInterval(interval);
  }, [gameState.player?.level, isGameOver, countdown]);

  // CPU Tick Loop & AI (Speed depends on cpuSpeed setting)
  useEffect(() => {
    if (!gameState.cpu || isGameOver || countdown !== null) return;
    
    let aiSpeed = 150;
    if (cpuSpeed === 'slow') aiSpeed = 300;
    else if (cpuSpeed === 'normal') aiSpeed = 150;
    else if (cpuSpeed === 'fast') aiSpeed = 80;
    else if (cpuSpeed === 'insane') aiSpeed = 40;
    
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
          
          for (let x = 0; x < nextCpu.board.width; x++) {
            let topTile = null;
            let topY = nextCpu.board.height;
            for (let y = 0; y < nextCpu.board.height; y++) {
              if (nextCpu.board.tiles[y][x]) {
                topTile = nextCpu.board.tiles[y][x];
                topY = y;
                break;
              }
            }
            
            if (topY <= 0) continue; 
            
            let score = topY * 2; 
            
            if (topTile) {
              if (topTile.number === nextCpu.currentTile.number && topTile.honor === nextCpu.currentTile.honor) {
                score += 100;
              } else if (!topTile.honor && !nextCpu.currentTile.honor && topTile.suit === nextCpu.currentTile.suit) {
                if (topTile.number != null && nextCpu.currentTile.number != null && Math.abs(topTile.number - nextCpu.currentTile.number) === 1) {
                  score += 50; 
                }
              }
            }
            
            if (x > 0) {
              const leftTile = nextCpu.board.tiles[topY - 1]?.[x - 1];
              if (leftTile) {
                if (!leftTile.honor && !nextCpu.currentTile.honor && leftTile.suit === nextCpu.currentTile.suit) {
                  if (leftTile.number != null && nextCpu.currentTile.number != null && Math.abs(leftTile.number - nextCpu.currentTile.number) === 1) {
                    score += 25;
                  }
                  if (leftTile.number === nextCpu.currentTile.number && leftTile.honor === nextCpu.currentTile.honor) {
                    score += 50;
                  }
                }
              }
            }
            if (x < nextCpu.board.width - 1) {
              const rightTile = nextCpu.board.tiles[topY - 1]?.[x + 1];
              if (rightTile) {
                if (!rightTile.honor && !nextCpu.currentTile.honor && rightTile.suit === nextCpu.currentTile.suit) {
                  if (rightTile.number != null && nextCpu.currentTile.number != null && Math.abs(rightTile.number - nextCpu.currentTile.number) === 1) {
                    score += 25;
                  }
                  if (rightTile.number === nextCpu.currentTile.number && rightTile.honor === nextCpu.currentTile.honor) {
                    score += 50;
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

          if (res.garbageSent > 0) {
            nextPlayer = { ...nextPlayer, garbageQueue: nextPlayer.garbageQueue + res.garbageSent };
          }
        }
      }
      
      const newState = { player: nextPlayer, cpu: nextCpu };
      gameStateRef.current = newState;
      setGameState(newState);
    }, aiSpeed);

    return () => clearInterval(interval);
  }, [gameState.cpu?.level, isGameOver, cpuSpeed, countdown]);

  // Check Game Over
  useEffect(() => {
    if (isGameOver) return;
    if (gameState.player?.isGameOver) {
      audio.playGameOver();
      audio.stopBgm();
      setIsGameOver(true);
      setWinner('cpu');
    } else if (gameState.cpu?.isGameOver) {
      audio.playGameOver();
      audio.stopBgm();
      setIsGameOver(true);
      setWinner('player');
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
    cpuSpeed,
    setCpuSpeed,
    countdown
  };
}
