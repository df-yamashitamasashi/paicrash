import type { ClearResult, GameBoard, GameState } from './mahjong-types';
import {
  addGarbageTiles,
  applyGravity,
  calculateGarbage,
  calculateScore,
  clearTiles,
  removeClearedTiles,
  createEmptyBoard,
  findClearableGroups,
  generateRandomIndicator,
  generateRandomTile,
  isGameOver,
  placeTile,
  calculateLevel,
} from './game-engine';
import type { GameInputAction } from './multiplayer-protocol';

export interface ApplyInputResult {
  state: GameState;
  garbageSent: number;
  changed: boolean;
}

function cloneBoard(board: GameBoard): GameBoard {
  return JSON.parse(JSON.stringify(board)) as GameBoard;
}

export function createInitialMultiplayerGameState(isDebugPlayer = false): GameState {
  const board = createEmptyBoard();
  const isDebug = isDebugPlayer && typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEBUG_YAKUMAN : null;
  
  return {
    board,
    currentTile: isDebug ? generateRandomTile(Math.floor(board.width / 2), 0, 0) : generateRandomTile(Math.floor(board.width / 2), 0),
    nextTile: isDebug ? generateRandomTile(0, 0, 1) : generateRandomTile(0, 0),
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
    debugTileIndex: isDebug ? 2 : undefined,
  };
}

function processClearsOnBoard(
  board: GameBoard,
  state: GameState,
): { totalScore: number; chainCount: number; allResults: ClearResult[]; lastYaku: GameState['lastYaku'] } {
  let chainCount = 0;
  let totalScore = 0;
  let allResults: ClearResult[] = [];
  let lastYaku = state.lastYaku;

  let maxDepth = 0;
  const processClear = () => {
    if (maxDepth++ > 20) {
      console.error('Infinite loop detected in processClear', { groups: findClearableGroups(board), board });
      return;
    }
    const groups = findClearableGroups(board);
    if (groups.length > 0) {
      const results = clearTiles(
        board,
        groups,
        chainCount,
        state.doraIndicator,
        state.uraDoraIndicator,
        [...(state.clearHistory || []), ...allResults]
      );
      allResults = allResults.concat(results);
      totalScore += calculateScore(results);

      for (const result of results) {
        if (result.yaku) {
          lastYaku = result.yaku;
        }
      }

      chainCount++;
      removeClearedTiles(board);
      applyGravity(board);
      processClear();
    }
  };

  processClear();
  return { totalScore, chainCount, allResults, lastYaku };
}

function placeCurrentTile(state: GameState): ApplyInputResult {
  if (!state.currentTile || state.isGameOver || state.isPaused) {
    return { state, garbageSent: 0, changed: false };
  }

  const newBoard = cloneBoard(state.board);
  const x = state.currentTile.x;
  const placed = placeTile(newBoard, state.currentTile, x);

  if (!placed) {
    return {
      state: { ...state, isGameOver: true },
      garbageSent: 0,
      changed: true,
    };
  }

  const { totalScore, chainCount, allResults, lastYaku } = processClearsOnBoard(newBoard, state);
  let garbageSent = allResults.length > 0 ? calculateGarbage(allResults) : 0;
  let newGarbageQueue = state.garbageQueue;

  if (garbageSent > 0) {
    if (newGarbageQueue >= garbageSent) {
      newGarbageQueue -= garbageSent;
      garbageSent = 0;
    } else {
      garbageSent -= newGarbageQueue;
      newGarbageQueue = 0;
    }
  }

  // If there's still garbage in the queue, drop up to 28 tiles (4 lines equivalent)
  if (newGarbageQueue > 0) {
    const amountToDrop = Math.min(newGarbageQueue, 28);
    addGarbageTiles(newBoard, amountToDrop);
    applyGravity(newBoard);
    newGarbageQueue -= amountToDrop;
  }

  const gameOver = isGameOver(newBoard);
  
  const isDebug = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEBUG_YAKUMAN : null;
  let nextIdx = state.debugTileIndex ?? 0;
  
  const isEmpty = newBoard.tiles.every(row => row.every(t => t === null));
  
  let newCurrentTile;
  let newNextTile;

  if (isEmpty && isDebug && state.debugTileIndex !== undefined) {
    nextIdx = 0;
    newCurrentTile = generateRandomTile(Math.floor(newBoard.width / 2), 0, nextIdx++);
    newNextTile = generateRandomTile(0, 0, nextIdx++);
  } else {
    newCurrentTile = state.nextTile
      ? { ...state.nextTile, x: Math.floor(newBoard.width / 2), y: 0 }
      : ((isDebug && state.debugTileIndex !== undefined) ? generateRandomTile(Math.floor(newBoard.width / 2), 0, nextIdx++) : generateRandomTile(Math.floor(newBoard.width / 2), 0));
      
    newNextTile = (isDebug && state.debugTileIndex !== undefined)
      ? generateRandomTile(0, 0, nextIdx++)
      : generateRandomTile(0, 0);
  }

  return {
    state: {
      ...state,
      board: newBoard,
      currentTile: newCurrentTile,
      nextTile: newNextTile,
      score: state.score + totalScore,
      level: calculateLevel(state.score + totalScore),
      combo: chainCount > 0 ? chainCount : 0,
      maxCombo: Math.max(state.maxCombo, chainCount),
      garbageQueue: newGarbageQueue,
      isGameOver: gameOver,
      lastYaku,
      clearHistory: [...(state.clearHistory || []), ...allResults].slice(-10),
      debugTileIndex: (isDebug && state.debugTileIndex !== undefined) ? nextIdx : undefined,
    },
    garbageSent,
    changed: true,
  };
}

function getLandingY(state: GameState): number {
  if (!state.currentTile) return state.board.height - 1;
  const x = state.currentTile.x;
  let landingY = state.board.height - 1;
  for (let y = 0; y < state.board.height; y++) {
    if (state.board.tiles[y][x] !== null) {
      landingY = y - 1;
      break;
    }
  }
  return landingY;
}

export function applyGameInput(state: GameState, action: GameInputAction): ApplyInputResult {
  if (state.isGameOver || state.isPaused || !state.currentTile) {
    return { state, garbageSent: 0, changed: false };
  }

  switch (action) {
    case 'move-left': {
      const newX = state.currentTile.x - 1;
      if (newX < 0) return { state, garbageSent: 0, changed: false };
      return {
        state: {
          ...state,
          currentTile: { ...state.currentTile, x: newX },
        },
        garbageSent: 0,
        changed: true,
      };
    }
    case 'move-right': {
      const newX = state.currentTile.x + 1;
      if (newX >= state.board.width) return { state, garbageSent: 0, changed: false };
      return {
        state: {
          ...state,
          currentTile: { ...state.currentTile, x: newX },
        },
        garbageSent: 0,
        changed: true,
      };
    }
    case 'soft-drop': {
      const landingY = getLandingY(state);
      const newY = state.currentTile.y + 1;
      if (newY > landingY) {
        return placeCurrentTile(state);
      }
      return {
        state: {
          ...state,
          currentTile: { ...state.currentTile, y: newY },
        },
        garbageSent: 0,
        changed: true,
      };
    }
    case 'hard-drop': {
      const landingY = getLandingY(state);
      const droppedState: GameState = {
        ...state,
        currentTile: { ...state.currentTile, y: landingY },
      };
      return placeCurrentTile(droppedState);
    }
    default:
      return { state, garbageSent: 0, changed: false };
  }
}

export function applyGarbageToState(state: GameState, amount: number): GameState {
  if (state.isGameOver || amount <= 0) return state;

  const newBoard = cloneBoard(state.board);
  addGarbageTiles(newBoard, Math.min(amount, 28));
  applyGravity(newBoard);
  const gameOver = isGameOver(newBoard);

  return {
    ...state,
    board: newBoard,
    isGameOver: gameOver,
  };
}

export function flushGarbageQueue(state: GameState): { state: GameState; applied: number } {
  if (state.garbageQueue <= 0) {
    return { state, applied: 0 };
  }
  const amountToDrop = Math.min(state.garbageQueue, 28);
  const next = applyGarbageToState(state, amountToDrop);
  return {
    state: { ...next, garbageQueue: state.garbageQueue - amountToDrop },
    applied: amountToDrop,
  };
}

// Removed getTickIntervalMs as it is now in game-engine.ts
