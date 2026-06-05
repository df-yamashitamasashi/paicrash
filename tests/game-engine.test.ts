import { describe, it, expect } from 'vitest';
import {
  getDoraTile,
  isDora,
  isUraDora,
  createEmptyBoard,
  applyGravity,
  placeTile,
  isGameOver,
  addGarbageTiles,
  calculateScore,
  calculateGarbage,
  calculateLevel,
  getTickIntervalMs
} from '../lib/game-engine';
import type { MahjongTile } from '../lib/mahjong-types';

describe('game-engine basic utilities', () => {
  describe('Dora mapping (getDoraTile)', () => {
    it('should map numbered tiles correctly (1-8 increment, 9 wraps to 1)', () => {
      const tile1m: MahjongTile = { id: '1', suit: 'manzu', number: 1, x: 0, y: 0 };
      expect(getDoraTile(tile1m).number).toBe(2);
      expect(getDoraTile(tile1m).suit).toBe('manzu');

      const tile8p: MahjongTile = { id: '2', suit: 'pinzu', number: 8, x: 0, y: 0 };
      expect(getDoraTile(tile8p).number).toBe(9);

      const tile9s: MahjongTile = { id: '3', suit: 'souzu', number: 9, x: 0, y: 0 };
      expect(getDoraTile(tile9s).number).toBe(1);
    });

    it('should map wind tiles correctly (East -> South -> West -> North -> White)', () => {
      const east: MahjongTile = { id: 'e', suit: 'honor', honor: 'east', x: 0, y: 0 };
      expect(getDoraTile(east).honor).toBe('south');

      const south: MahjongTile = { id: 's', suit: 'honor', honor: 'south', x: 0, y: 0 };
      expect(getDoraTile(south).honor).toBe('west');

      const west: MahjongTile = { id: 'w', suit: 'honor', honor: 'west', x: 0, y: 0 };
      expect(getDoraTile(west).honor).toBe('north');

      const north: MahjongTile = { id: 'n', suit: 'honor', honor: 'north', x: 0, y: 0 };
      expect(getDoraTile(north).honor).toBe('white');
    });

    it('should map dragon tiles correctly (White -> Green -> Red -> East)', () => {
      const white: MahjongTile = { id: 'dw', suit: 'honor', honor: 'white', x: 0, y: 0 };
      expect(getDoraTile(white).honor).toBe('green');

      const green: MahjongTile = { id: 'dg', suit: 'honor', honor: 'green', x: 0, y: 0 };
      expect(getDoraTile(green).honor).toBe('red');

      const red: MahjongTile = { id: 'dr', suit: 'honor', honor: 'red', x: 0, y: 0 };
      expect(getDoraTile(red).honor).toBe('east');
    });
  });

  describe('Dora checks (isDora, isUraDora)', () => {
    it('should correctly identify dora and uradora tiles', () => {
      const indicator: MahjongTile = { id: 'ind', suit: 'manzu', number: 5, x: 0, y: 0 };
      const tileDora: MahjongTile = { id: 't1', suit: 'manzu', number: 6, x: 0, y: 0 };
      const tileNonDora: MahjongTile = { id: 't2', suit: 'manzu', number: 5, x: 0, y: 0 };

      expect(isDora(tileDora, indicator)).toBe(true);
      expect(isDora(tileNonDora, indicator)).toBe(false);
      expect(isDora(tileDora, null)).toBe(false);

      expect(isUraDora(tileDora, indicator)).toBe(true);
      expect(isUraDora(tileNonDora, indicator)).toBe(false);
      expect(isUraDora(tileDora, null)).toBe(false);
    });
  });

  describe('Board dimensions and operations', () => {
    it('should create an empty board with correct size', () => {
      const board = createEmptyBoard();
      expect(board.width).toBe(7);
      expect(board.height).toBe(14);
      expect(board.tiles.length).toBe(14);
      expect(board.tiles[0].length).toBe(7);
      for (let y = 0; y < 14; y++) {
        for (let x = 0; x < 7; x++) {
          expect(board.tiles[y][x]).toBeNull();
        }
      }
    });

    it('should place tile at the lowest empty position in a column', () => {
      const board = createEmptyBoard();
      const tile1: MahjongTile = { id: 't1', suit: 'manzu', number: 1, x: 0, y: 0 };
      const tile2: MahjongTile = { id: 't2', suit: 'manzu', number: 2, x: 0, y: 0 };

      const placed1 = placeTile(board, tile1, 3);
      expect(placed1).toBe(true);
      expect(board.tiles[13][3]).toEqual({ ...tile1, x: 3, y: 13 });

      const placed2 = placeTile(board, tile2, 3);
      expect(placed2).toBe(true);
      expect(board.tiles[12][3]).toEqual({ ...tile2, x: 3, y: 12 });
    });

    it('should return false if trying to place a tile in a full column', () => {
      const board = createEmptyBoard();
      for (let y = 0; y < 14; y++) {
        board.tiles[y][2] = { id: `fill-${y}`, suit: 'manzu', number: 1, x: 2, y };
      }

      const tile: MahjongTile = { id: 'extra', suit: 'pinzu', number: 5, x: 0, y: 0 };
      const placed = placeTile(board, tile, 2);
      expect(placed).toBe(false);
    });
  });

  describe('applyGravity', () => {
    it('should apply gravity and return true if tiles moved down', () => {
      const board = createEmptyBoard();
      // Place a floating tile at row 5, col 1
      const tile: MahjongTile = { id: 'float', suit: 'manzu', number: 1, x: 1, y: 5 };
      board.tiles[5][1] = tile;

      const moved = applyGravity(board);
      expect(moved).toBe(true);
      expect(board.tiles[5][1]).toBeNull();
      expect(board.tiles[13][1]).toEqual({ ...tile, y: 13, isDropping: true });
    });

    it('should return false if no tiles moved', () => {
      const board = createEmptyBoard();
      const tile: MahjongTile = { id: 'bottom', suit: 'manzu', number: 1, x: 1, y: 13 };
      board.tiles[13][1] = tile;

      const moved = applyGravity(board);
      expect(moved).toBe(false);
      expect(board.tiles[13][1]).toEqual(tile);
    });
  });

  describe('isGameOver', () => {
    it('should return true if any tile is in the top row', () => {
      const board = createEmptyBoard();
      expect(isGameOver(board)).toBe(false);

      board.tiles[0][3] = { id: 'top', suit: 'manzu', number: 1, x: 3, y: 0 };
      expect(isGameOver(board)).toBe(true);
    });
  });

  describe('addGarbageTiles', () => {
    it('should add the correct number of ojama tiles', () => {
      const board = createEmptyBoard();
      addGarbageTiles(board, 5);

      let ojamaCount = 0;
      for (let y = 0; y < board.height; y++) {
        for (let x = 0; x < board.width; x++) {
          if (board.tiles[y][x]?.suit === 'ojama') {
            ojamaCount++;
          }
        }
      }
      expect(ojamaCount).toBe(5);
    });
  });

  describe('Calculations', () => {
    it('should sum up clear scores correctly', () => {
      const results = [
        { tiles: [], yaku: null, score: 1000, isChain: false, chainCount: 0, timestamp: 0 },
        { tiles: [], yaku: null, score: 2000, isChain: true, chainCount: 1, timestamp: 0 }
      ];
      expect(calculateScore(results)).toBe(3000);
    });

    it('should calculate garbage to send based on yaku han count', () => {
      const results1 = [
        { tiles: [], yaku: null, score: 1000, isChain: false, chainCount: 0, timestamp: 0 }
      ];
      // no yaku -> 0 garbage
      expect(calculateGarbage(results1)).toBe(0);

      const results2 = [
        {
          tiles: [],
          score: 8000,
          isChain: false,
          chainCount: 0,
          timestamp: 0,
          yaku: { name: 'Mangan', japaneseName: '満貫', description: 'Mangan', han: 4, tiles: [] }
        }
      ];
      expect(calculateGarbage(results2)).toBe(4);
    });

    it('should compute levels based on score thresholds correctly', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(999)).toBe(1);
      expect(calculateLevel(1000)).toBe(2);
      expect(calculateLevel(3999)).toBe(2);
      expect(calculateLevel(4000)).toBe(3);
      expect(calculateLevel(32000)).toBe(6); // Math.floor(Math.sqrt(32)) + 1 = 5 + 1 = 6
    });

    it('should compute correct tick intervals based on level', () => {
      expect(getTickIntervalMs(1)).toBe(800);
      expect(getTickIntervalMs(2)).toBe(740);
      expect(getTickIntervalMs(10)).toBe(260);
      expect(getTickIntervalMs(20)).toBe(150); // capped at 150ms
    });
  });
});
