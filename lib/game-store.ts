import { create } from 'zustand';
import type { GameState, MahjongTile, ClearResult, GameBoard, TileSuit, TileNumber, HonorType } from './mahjong-types';
import {
  createEmptyBoard,
  generateRandomTile,
  generateRandomIndicator,
  findClearableGroups,
  clearTiles,
  removeClearedTiles,
  applyGravity,
  placeTile,
  isGameOver,
  addGarbageTiles,
  calculateScore,
  calculateGarbage,
  calculateLevel,
} from './game-engine';
import { audio } from './audio-manager';

// Animation duration for tile clear (must match CSS animation)
const CLEAR_ANIMATION_MS = 400;

interface GameStore {
  // Game state
  gameState: GameState;
  // Whether a clear animation is in progress (blocks next tick)
  isAnimating: boolean;
  // Yakuman visual freeze state
  isYakumanAnimating: boolean;
  isYakumanDissolving: boolean;
  yakumanName: string | null;
  countdown: number | null; // 3, 2, 1, or null

  // Actions
  startGame: () => void;
  moveTile: (direction: 'left' | 'right') => void;
  dropTile: () => void;
  hardDrop: () => void;
  tick: () => void;
  togglePause: () => void;
  reset: () => void;
  receiveGarbage: (amount: number) => void;

  // Multiplayer
  onGarbageSent?: (amount: number) => void;
  setGarbageCallback: (callback: (amount: number) => void) => void;
}

function createInitialState(): GameState {
  const board = createEmptyBoard();
  
  // Debug Yakuman injector via environment variable
  // 100: Thirteen Orphans (国士無双), 101: Nine Gates (九蓮宝燈), 102: All Honors (字一色)
  const debugYakuman = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEBUG_YAKUMAN : null;
  
  let currentTile = null;
  let nextTile = null;
  let debugTileIndex = 0;

  if (debugYakuman) {
    currentTile = generateRandomTile(Math.floor(board.width / 2), 0, debugTileIndex++);
    nextTile = generateRandomTile(0, 0, debugTileIndex++);
  } else {
    currentTile = generateRandomTile(Math.floor(board.width / 2), 0);
    nextTile = generateRandomTile(0, 0);
  }

  return {
    board,
    currentTile,
    nextTile,
    doraIndicator: generateRandomIndicator(),
    uraDoraIndicator: generateRandomIndicator(),
    score: 0,
    level: 1,
    combo: 0,
    maxCombo: 0,
    garbageQueue: 0,
    isGameOver: false,
    isPaused: false,
    lastYaku: null,
    clearHistory: [],
    debugTileIndex: debugYakuman ? debugTileIndex : undefined,
  };
}

export const useGameStore = create<GameStore>((set, get) => {
  let activeCountdownInterval: NodeJS.Timeout | null = null;

  const startCountdownSequence = (set: any, get: any) => {
    if (activeCountdownInterval) {
      clearInterval(activeCountdownInterval);
    }
    audio.stopBgm();
    set({ countdown: 3 });
    audio.playCountdownBeep();

    activeCountdownInterval = setInterval(() => {
      const { countdown } = get();
      if (countdown === null) {
        if (activeCountdownInterval) clearInterval(activeCountdownInterval);
        return;
      }
      if (countdown > 1) {
        set({ countdown: countdown - 1 });
        audio.playCountdownBeep();
      } else {
        set({ countdown: null });
        audio.playStartFanfare();
        audio.startBgm();
        if (activeCountdownInterval) clearInterval(activeCountdownInterval);
        activeCountdownInterval = null;
      }
    }, 1000);
  };

  return {
    gameState: createInitialState(),
    isAnimating: false,
    isYakumanAnimating: false,
    isYakumanDissolving: false,
    yakumanName: null,
    countdown: null,

    startGame: () => {
      audio.enable();
      const initialState = createInitialState();
      set({ 
        gameState: initialState, 
        isAnimating: false, 
        isYakumanAnimating: false, 
        isYakumanDissolving: false,
        yakumanName: null,
        countdown: null 
      });
      startCountdownSequence(set, get);
    },

  moveTile: (direction) => {
    const { gameState, isYakumanAnimating, countdown } = get();
    if (gameState.isGameOver || gameState.isPaused || !gameState.currentTile || isYakumanAnimating || countdown !== null) return;

    const newX = gameState.currentTile.x + (direction === 'left' ? -1 : 1);
    if (newX >= 0 && newX < gameState.board.width) {
      audio.playMove();
      set({
        gameState: {
          ...gameState,
          currentTile: { ...gameState.currentTile, x: newX },
        },
      });
    }
  },

  dropTile: () => {
    const { gameState, isAnimating, isYakumanAnimating, countdown } = get();
    if (gameState.isGameOver || gameState.isPaused || !gameState.currentTile || countdown !== null) return;
    // Block new drops while clear animation or Yakuman banner is playing
    if (isAnimating || isYakumanAnimating) return;

    const newY = gameState.currentTile.y + 1;
    const x = gameState.currentTile.x;

    // Find the landing position
    let landingY = gameState.board.height - 1;
    for (let y = 0; y < gameState.board.height; y++) {
      if (gameState.board.tiles[y][x] !== null) {
        landingY = y - 1;
        break;
      }
    }

    if (newY > landingY) {
      // ── Phase 1: place tile ──────────────────────────────────────────────
      const newBoard = JSON.parse(JSON.stringify(gameState.board)) as GameBoard;
      const placed = placeTile(newBoard, gameState.currentTile, x);

      if (!placed) {
        audio.playGameOver();
        audio.stopBgm();
        set({ gameState: { ...gameState, isGameOver: true } });
        return;
      }

      audio.playPlace();

      // Check for clearable groups
      const groups = findClearableGroups(newBoard);

      if (groups.length === 0) {
        // Nothing to clear — just advance to next tile
        const gameOver = isGameOver(newBoard);
        if (gameOver) {
          audio.playGameOver();
          audio.stopBgm();
        }
        const isDebug = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEBUG_YAKUMAN : null;
        let nextIdx = gameState.debugTileIndex ?? 0;
        
        const isEmpty = newBoard.tiles.every(row => row.every(t => t === null));
        
        let newCurrentTile;
        let newNextTile;

        if (isEmpty && isDebug) {
          nextIdx = 0;
          newCurrentTile = generateRandomTile(Math.floor(newBoard.width / 2), 0, nextIdx++);
          newNextTile = generateRandomTile(0, 0, nextIdx++);
        } else {
          newCurrentTile = gameState.nextTile
            ? { ...gameState.nextTile, x: Math.floor(newBoard.width / 2), y: 0 }
            : (isDebug ? generateRandomTile(Math.floor(newBoard.width / 2), 0, nextIdx++) : generateRandomTile(Math.floor(newBoard.width / 2), 0));
            
          newNextTile = isDebug
            ? generateRandomTile(0, 0, nextIdx++)
            : generateRandomTile(0, 0);
        }

        set({
          gameState: {
            ...gameState,
            board: newBoard,
            currentTile: newCurrentTile,
            nextTile: newNextTile,
            combo: 0,
            isGameOver: gameOver,
            debugTileIndex: isDebug ? nextIdx : undefined,
          },
        });
        return;
      }

      // ── Phase 2: mark tiles as clearing, show animation ──────────────────
      // clearTiles now only sets isClearing=true, does NOT remove tiles
      const results = clearTiles(
        newBoard,
        groups,
        0,
        gameState.doraIndicator,
        gameState.uraDoraIndicator,
        gameState.clearHistory
      );
      const totalScore = calculateScore(results);
      let lastYaku = gameState.lastYaku;
      let hasYaku = false;
      let detectedYakumanName: string | null = null;

      for (const r of results) {
        if (r.yaku) {
          lastYaku = r.yaku;
          hasYaku = true;
          // Check if it is a board-state Yakuman
          if (r.yaku.name === 'Thirteen Orphans' || r.yaku.name === 'All Honors' || r.yaku.name === 'Nine Gates') {
            detectedYakumanName = r.yaku.japaneseName;
          }
        }
      }

      if (detectedYakumanName) {
        audio.playYakuman();
        set({
          isYakumanAnimating: true,
          yakumanName: detectedYakumanName,
        });
      } else if (hasYaku) {
        audio.playYaku();
      } else {
        audio.playClear(0);
      }

      // Show the board with isClearing tiles (animation plays)
      set({
        isAnimating: true,
        gameState: {
          ...gameState,
          board: newBoard,
          // Keep current tile hidden during animation (move off-screen)
          currentTile: null,
          score: gameState.score + totalScore,
          level: calculateLevel(gameState.score + totalScore),
          lastYaku,
          clearHistory: [
            ...gameState.clearHistory,
            ...results,
          ],
        },
      });

      // ── Phase 3: after animation, remove tiles, apply gravity, chain ─────
      const executeChainAndGravity = () => {
        const state = get().gameState;
        const board = JSON.parse(JSON.stringify(state.board)) as GameBoard;

        removeClearedTiles(board);
        applyGravity(board);

        // Chain processing (synchronous — no animation for chains for now)
        let chainCount = 1;
        let chainScore = 0;
        let chainResults: ClearResult[] = [];
        let chainLastYaku = state.lastYaku;
        let maxDepth = 0;

        const processChain = () => {
          if (maxDepth++ > 20) {
            console.error('Infinite loop detected in processChain', { chainGroups: findClearableGroups(board), board });
            return;
          }
          const chainGroups = findClearableGroups(board);
          if (chainGroups.length > 0) {
            const currentHistory = get().gameState.clearHistory;
            const cr = clearTiles(
              board,
              chainGroups,
              chainCount,
              state.doraIndicator,
              state.uraDoraIndicator,
              currentHistory
            );
            chainResults = chainResults.concat(cr);
            chainScore += calculateScore(cr);
            let chainHasYaku = false;
            for (const r of cr) {
              if (r.yaku) {
                chainLastYaku = r.yaku;
                chainHasYaku = true;
              }
            }
            if (chainHasYaku) {
              audio.playYaku();
            } else {
              audio.playClear(chainCount);
            }
            chainCount++;
            removeClearedTiles(board);
            applyGravity(board);
            processChain();
          }
        };
        processChain();

        // Send garbage to opponent
        const allResults = [...results, ...chainResults];
        if (allResults.length > 0 && get().onGarbageSent) {
          const garbage = calculateGarbage(allResults);
          get().onGarbageSent!(garbage);
        }

        const gameOver = isGameOver(board);
        if (gameOver) {
          audio.playGameOver();
          audio.stopBgm();
        }
        const isDebug = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEBUG_YAKUMAN : null;
        let nextIdx = state.debugTileIndex ?? 0;
        
        const isEmpty = board.tiles.every(row => row.every(t => t === null));
        
        let newCurrentTile;
        let newNextTile;

        if (isEmpty && isDebug) {
          nextIdx = 0;
          newCurrentTile = generateRandomTile(Math.floor(board.width / 2), 0, nextIdx++);
          newNextTile = generateRandomTile(0, 0, nextIdx++);
        } else {
          newCurrentTile = state.nextTile
            ? { ...state.nextTile, x: Math.floor(board.width / 2), y: 0 }
            : (isDebug ? generateRandomTile(Math.floor(board.width / 2), 0, nextIdx++) : generateRandomTile(Math.floor(board.width / 2), 0));
            
          newNextTile = isDebug
            ? generateRandomTile(0, 0, nextIdx++)
            : generateRandomTile(0, 0);
        }

        set({
          isAnimating: false,
          isYakumanAnimating: false,
          isYakumanDissolving: false,
          yakumanName: null,
          gameState: {
            ...state,
            board,
            currentTile: newCurrentTile,
            nextTile: newNextTile,
            score: state.score + chainScore,
            level: calculateLevel(state.score + chainScore),
            combo: chainCount > 1 ? chainCount - 1 : 0,
            maxCombo: Math.max(state.maxCombo, chainCount - 1),
            isGameOver: gameOver,
            lastYaku: chainLastYaku,
            clearHistory: [
              ...state.clearHistory,
              ...chainResults,
            ],
            debugTileIndex: isDebug ? nextIdx : undefined,
          },
        });
      };

      if (detectedYakumanName) {
        setTimeout(() => {
          // End freeze, start dissolve
          set({ isYakumanDissolving: true, isYakumanAnimating: false, yakumanName: null });
          setTimeout(executeChainAndGravity, 2000); // 2 second dissolve animation
        }, 9000); // 9 second glow/freeze
      } else {
        setTimeout(executeChainAndGravity, CLEAR_ANIMATION_MS);
      }
    } else {
      set({
        gameState: {
          ...gameState,
          currentTile: { ...gameState.currentTile, y: newY },
        },
      });
    }
  },

  hardDrop: () => {
    const { gameState, dropTile, countdown } = get();
    if (gameState.isGameOver || gameState.isPaused || !gameState.currentTile || countdown !== null) return;

    const x = gameState.currentTile.x;
    let landingY = gameState.board.height - 1;

    for (let y = 0; y < gameState.board.height; y++) {
      if (gameState.board.tiles[y][x] !== null) {
        landingY = y - 1;
        break;
      }
    }

    set({
      gameState: {
        ...gameState,
        currentTile: { ...gameState.currentTile, y: landingY },
      },
    });

    setTimeout(() => dropTile(), 0);
  },

  tick: () => {
    const { dropTile, gameState, countdown } = get();
    if (!gameState.isGameOver && !gameState.isPaused && countdown === null) {
      dropTile();
    }
  },

  togglePause: () => {
    const { gameState } = get();
    audio.playClick();
    if (gameState.isPaused) {
      audio.startBgm();
    } else {
      audio.stopBgm();
    }
    set({
      gameState: {
        ...gameState,
        isPaused: !gameState.isPaused,
      },
    });
  },

  reset: () => {
    audio.playClick();
    audio.enable();
    set({ 
      gameState: createInitialState(), 
      isAnimating: false, 
      isYakumanAnimating: false, 
      isYakumanDissolving: false,
      yakumanName: null,
      countdown: null 
    });
    startCountdownSequence(set, get);
  },

  receiveGarbage: (amount) => {
    const { gameState } = get();
    if (gameState.isGameOver) return;

    const newBoard = JSON.parse(JSON.stringify(gameState.board)) as GameBoard;
    addGarbageTiles(newBoard, Math.min(amount, 28));

    const gameOver = isGameOver(newBoard);
    if (gameOver) {
      audio.playGameOver();
      audio.stopBgm();
    }

    set({
      gameState: {
        ...gameState,
        board: newBoard,
        isGameOver: gameOver,
      },
    });
  },

  setGarbageCallback: (callback) => {
    set({ onGarbageSent: callback });
  },
  onGarbageSent: undefined,
  };
});
