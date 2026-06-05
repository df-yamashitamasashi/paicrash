import { describe, it, expect } from 'vitest';
import {
  createInitialMultiplayerGameState,
  applyGameInput,
  applyGarbageToState,
  flushGarbageQueue
} from '../lib/multiplayer-game-logic';

describe('Multiplayer Game Logic (State Transitions)', () => {
  it('should initialize game state with default values', () => {
    const state = createInitialMultiplayerGameState();
    expect(state.score).toBe(0);
    expect(state.level).toBe(1);
    expect(state.combo).toBe(0);
    expect(state.garbageQueue).toBe(0);
    expect(state.isGameOver).toBe(false);
    expect(state.board.width).toBe(7);
    expect(state.board.height).toBe(14);
    expect(state.currentTile).toBeDefined();
    expect(state.nextTile).toBeDefined();
  });

  describe('applyGameInput', () => {
    it('should move current tile left within boundaries', () => {
      const state = createInitialMultiplayerGameState();
      state.currentTile = { id: 't', suit: 'manzu', number: 1, x: 3, y: 0 };

      // Move left
      const result1 = applyGameInput(state, 'move-left');
      expect(result1.changed).toBe(true);
      expect(result1.state.currentTile?.x).toBe(2);

      // Move left to edge
      let cur = result1.state;
      cur = applyGameInput(cur, 'move-left').state; // x = 1
      cur = applyGameInput(cur, 'move-left').state; // x = 0

      // Try moving left beyond boundary
      const resultEdge = applyGameInput(cur, 'move-left');
      expect(resultEdge.changed).toBe(false);
      expect(resultEdge.state.currentTile?.x).toBe(0);
    });

    it('should move current tile right within boundaries', () => {
      const state = createInitialMultiplayerGameState();
      state.currentTile = { id: 't', suit: 'manzu', number: 1, x: 5, y: 0 };

      // Move right
      const result1 = applyGameInput(state, 'move-right');
      expect(result1.changed).toBe(true);
      expect(result1.state.currentTile?.x).toBe(6);

      // Try moving right beyond boundary (width is 7, max index is 6)
      const resultEdge = applyGameInput(result1.state, 'move-right');
      expect(resultEdge.changed).toBe(false);
      expect(resultEdge.state.currentTile?.x).toBe(6);
    });

    it('should soft drop the tile and increment y', () => {
      const state = createInitialMultiplayerGameState();
      state.currentTile = { id: 't', suit: 'manzu', number: 1, x: 3, y: 0 };

      const result = applyGameInput(state, 'soft-drop');
      expect(result.changed).toBe(true);
      expect(result.state.currentTile?.y).toBe(1);
    });

    it('should place current tile when soft drop hits landing position', () => {
      const state = createInitialMultiplayerGameState();
      // landing Y is 13 (bottom of column 3)
      state.currentTile = { id: 't', suit: 'manzu', number: 1, x: 3, y: 13 };

      const result = applyGameInput(state, 'soft-drop');
      expect(result.changed).toBe(true);
      // It should be placed on board, and currentTile is replaced by nextTile
      expect(result.state.board.tiles[13][3]).toEqual({ id: 't', suit: 'manzu', number: 1, x: 3, y: 13 });
      expect(result.state.currentTile).toBeDefined();
      expect(result.state.currentTile?.y).toBe(0);
    });

    it('should place tile immediately on hard drop', () => {
      const state = createInitialMultiplayerGameState();
      state.currentTile = { id: 't', suit: 'manzu', number: 1, x: 3, y: 0 };

      const result = applyGameInput(state, 'hard-drop');
      expect(result.changed).toBe(true);
      expect(result.state.board.tiles[13][3]).toEqual({ id: 't', suit: 'manzu', number: 1, x: 3, y: 13 });
    });
  });

  describe('Ojama and Garbage functions', () => {
    it('should apply garbage tiles directly to board state', () => {
      const state = createInitialMultiplayerGameState();
      const updated = applyGarbageToState(state, 5);

      let count = 0;
      for (let y = 0; y < updated.board.height; y++) {
        for (let x = 0; x < updated.board.width; x++) {
          if (updated.board.tiles[y][x]?.suit === 'ojama') count++;
        }
      }
      expect(count).toBe(5);
    });

    it('should flush garbage queue and update queue size', () => {
      const state = createInitialMultiplayerGameState();
      state.garbageQueue = 10;

      const { state: flushed, applied } = flushGarbageQueue(state);
      expect(applied).toBe(10);
      expect(flushed.garbageQueue).toBe(0);

      let count = 0;
      for (let y = 0; y < flushed.board.height; y++) {
        for (let x = 0; x < flushed.board.width; x++) {
          if (flushed.board.tiles[y][x]?.suit === 'ojama') count++;
        }
      }
      expect(count).toBe(10);
    });
  });

  describe('Immutability checks', () => {
    it('should not mutate the original state object', () => {
      const state = createInitialMultiplayerGameState();
      state.currentTile = { id: 't', suit: 'manzu', number: 1, x: 3, y: 0 };

      const originalJson = JSON.stringify(state);
      applyGameInput(state, 'move-left');
      expect(JSON.stringify(state)).toBe(originalJson);

      applyGarbageToState(state, 3);
      expect(JSON.stringify(state)).toBe(originalJson);

      flushGarbageQueue(state);
      expect(JSON.stringify(state)).toBe(originalJson);
    });
  });
});
