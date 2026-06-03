import { describe, it, expect } from 'vitest';
import { createEmptyBoard, findClearableGroups } from '../lib/game-engine';
import type { MahjongTile, GameBoard } from '../lib/mahjong-types';

function makeTile(suit: string, number: number, x: number, y: number): MahjongTile {
  return {
    id: `test-${suit}-${number}-${x}-${y}`,
    suit: suit as any,
    number: number as any,
    x,
    y,
  };
}

describe('Sequence detection for manzu 4-5-6', () => {
  it('should detect vertical sequence 4m-5m-6m (stacked top to bottom)', () => {
    const board = createEmptyBoard();
    // Place tiles vertically: 6m on top, 5m middle, 4m bottom
    const tile6 = makeTile('manzu', 6, 3, 11);
    const tile5 = makeTile('manzu', 5, 3, 12);
    const tile4 = makeTile('manzu', 4, 3, 13);
    board.tiles[11][3] = tile6;
    board.tiles[12][3] = tile5;
    board.tiles[13][3] = tile4;

    const groups = findClearableGroups(board);
    console.log('Vertical 6-5-4 (top to bottom):', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));
    expect(groups.length).toBeGreaterThanOrEqual(1);
    expect(groups.some(g => g.length >= 3)).toBe(true);
  });

  it('should detect vertical sequence 4m-5m-6m (stacked bottom to top)', () => {
    const board = createEmptyBoard();
    // Place tiles vertically: 4m on top, 5m middle, 6m bottom
    const tile4 = makeTile('manzu', 4, 3, 11);
    const tile5 = makeTile('manzu', 5, 3, 12);
    const tile6 = makeTile('manzu', 6, 3, 13);
    board.tiles[11][3] = tile4;
    board.tiles[12][3] = tile5;
    board.tiles[13][3] = tile6;

    const groups = findClearableGroups(board);
    console.log('Vertical 4-5-6 (top to bottom):', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));
    expect(groups.length).toBeGreaterThanOrEqual(1);
    expect(groups.some(g => g.length >= 3)).toBe(true);
  });

  it('should detect horizontal sequence 4m-5m-6m', () => {
    const board = createEmptyBoard();
    const tile4 = makeTile('manzu', 4, 0, 13);
    const tile5 = makeTile('manzu', 5, 1, 13);
    const tile6 = makeTile('manzu', 6, 2, 13);
    board.tiles[13][0] = tile4;
    board.tiles[13][1] = tile5;
    board.tiles[13][2] = tile6;

    const groups = findClearableGroups(board);
    console.log('Horizontal 4-5-6:', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));
    expect(groups.length).toBeGreaterThanOrEqual(1);
    expect(groups.some(g => g.length >= 3)).toBe(true);
  });

  it('should detect diagonal sequence 4m-5m-6m', () => {
    const board = createEmptyBoard();
    const tile4 = makeTile('manzu', 4, 0, 13);
    const tile5 = makeTile('manzu', 5, 1, 12);
    const tile6 = makeTile('manzu', 6, 2, 11);
    board.tiles[13][0] = tile4;
    board.tiles[12][1] = tile5;
    board.tiles[11][2] = tile6;

    const groups = findClearableGroups(board);
    console.log('Diagonal 4-5-6:', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));
    expect(groups.length).toBeGreaterThanOrEqual(1);
    expect(groups.some(g => g.length >= 3)).toBe(true);
  });

  it('should detect L-shaped sequence 4m-5m-6m-7m', () => {
    const board = createEmptyBoard();
    // L-shape: 4m and 5m horizontal, then 6m and 7m go up
    const tile4 = makeTile('manzu', 4, 0, 13);
    const tile5 = makeTile('manzu', 5, 1, 13);
    const tile6 = makeTile('manzu', 6, 1, 12);
    const tile7 = makeTile('manzu', 7, 1, 11);
    board.tiles[13][0] = tile4;
    board.tiles[13][1] = tile5;
    board.tiles[12][1] = tile6;
    board.tiles[11][1] = tile7;

    const groups = findClearableGroups(board);
    console.log('L-shape 4-5-6-7:', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));
    expect(groups.length).toBeGreaterThanOrEqual(1);
    expect(groups.some(g => g.length >= 3)).toBe(true);
  });

  it('should NOT detect sequence when tiles are non-adjacent', () => {
    const board = createEmptyBoard();
    // Place tiles with a gap between them
    const tile4 = makeTile('manzu', 4, 0, 13);
    const tile5 = makeTile('manzu', 5, 3, 13); // gap!
    const tile6 = makeTile('manzu', 6, 6, 13);
    board.tiles[13][0] = tile4;
    board.tiles[13][3] = tile5;
    board.tiles[13][6] = tile6;

    const groups = findClearableGroups(board);
    console.log('Non-adjacent 4-5-6:', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));
    expect(groups.length).toBe(0);
  });

  it('should detect sequence even with other tiles between (column scenario)', () => {
    const board = createEmptyBoard();
    // Scenario: a column with mixed tiles, but 4m, 5m, 6m are vertically adjacent
    // Other tile in between different column
    const tile4 = makeTile('manzu', 4, 3, 13);
    const tileOther = makeTile('pinzu', 2, 3, 12); // different tile between!
    const tile5 = makeTile('manzu', 5, 3, 11);
    const tile6 = makeTile('manzu', 6, 3, 10);
    board.tiles[13][3] = tile4;
    board.tiles[12][3] = tileOther;
    board.tiles[11][3] = tile5;
    board.tiles[10][3] = tile6;

    const groups = findClearableGroups(board);
    console.log('With other tile between:', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));
    // 4m at (3,13) and 5m at (3,11) are NOT adjacent (distance is 2), so this should NOT match
    expect(groups.length).toBe(0);
  });

  // ─── User-reported bug: 四萬・五萬・六萬 hub pattern ───────────────────────
  it('should detect 4m-5m-6m arranged in hub pattern (user screenshot)', () => {
    const board = createEmptyBoard();
    // Exact layout from user screenshot:
    //   col5   col6
    //   八萬   五萬    ← row 10
    //   四萬            ← row 11
    //   六萬            ← row 12
    //
    // 四萬 is diagonally adjacent to 五萬, and vertically adjacent to 六萬.
    // 五萬 is NOT adjacent to 六萬 (distance = 2).
    // But all three are connected through 四萬 as the hub.
    const tile8 = makeTile('manzu', 8, 5, 10);
    const tile5 = makeTile('manzu', 5, 6, 10);
    const tile4 = makeTile('manzu', 4, 5, 11);
    const tile6 = makeTile('manzu', 6, 5, 12);

    board.tiles[10][5] = tile8;
    board.tiles[10][6] = tile5;
    board.tiles[11][5] = tile4;
    board.tiles[12][5] = tile6;

    const groups = findClearableGroups(board);
    console.log('Hub pattern 4-5-6:', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));

    // 四萬, 五萬, 六萬 should be detected as a clearable sequence group
    const sequenceGroup = groups.find(g =>
      g.length >= 3 &&
      g.some(t => t.number === 4) &&
      g.some(t => t.number === 5) &&
      g.some(t => t.number === 6)
    );
    expect(sequenceGroup).toBeDefined();
  });

  it('should NOT clear scattered tiles of same suit with gaps in numbers', () => {
    const board = createEmptyBoard();
    // 1m, 3m, 5m adjacent but numbers not contiguous
    const tile1 = makeTile('manzu', 1, 3, 13);
    const tile3 = makeTile('manzu', 3, 3, 12);
    const tile5 = makeTile('manzu', 5, 3, 11);
    board.tiles[13][3] = tile1;
    board.tiles[12][3] = tile3;
    board.tiles[11][3] = tile5;

    const groups = findClearableGroups(board);
    console.log('Gapped numbers 1-3-5:', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));
    expect(groups.length).toBe(0);
  });

  // ── 網羅的テスト：重複や長連番の処理 ───────────────────────
  it('should detect 1m-2m-3m-4m-5m as a single 5-tile group, not multiple 3-tile groups', () => {
    const board = createEmptyBoard();
    const t1 = makeTile('manzu', 1, 0, 13);
    const t2 = makeTile('manzu', 2, 1, 13);
    const t3 = makeTile('manzu', 3, 2, 13);
    const t4 = makeTile('manzu', 4, 3, 13);
    const t5 = makeTile('manzu', 5, 4, 13);
    board.tiles[13][0] = t1;
    board.tiles[13][1] = t2;
    board.tiles[13][2] = t3;
    board.tiles[13][3] = t4;
    board.tiles[13][4] = t5;

    const groups = findClearableGroups(board);
    console.log('5-tile sequence 1-5:', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number}`))));
    
    expect(groups.length).toBe(1);
    expect(groups[0].length).toBe(5);
  });

  it('should not double-clear overlapping sequences sharing tiles (e.g. 1-2-3 and 2-3-4)', () => {
    // If we only have 1, 2, 3, 4, it should just be one group of 4.
    const board = createEmptyBoard();
    board.tiles[13][0] = makeTile('manzu', 1, 0, 13);
    board.tiles[13][1] = makeTile('manzu', 2, 1, 13);
    board.tiles[13][2] = makeTile('manzu', 3, 2, 13);
    board.tiles[13][3] = makeTile('manzu', 4, 3, 13);

    const groups = findClearableGroups(board);
    expect(groups.length).toBe(1);
    expect(groups[0].length).toBe(4);
  });

  it('should clear intersecting sequences with duplicates properly (T-shape)', () => {
    const board = createEmptyBoard();
    // Layout:
    //      1m(0,11)
    //      2m(0,12)
    // 3m(0,13) 3m(1,13) 4m(2,13) 5m(3,13)
    // Here we have duplicates of 3m. 
    // It should find the maximal length sequence [1,2,3,4,5] using one of the 3ms,
    // and the other 3m is left alone because it overlaps / cannot form a 3-sequence.
    board.tiles[11][0] = makeTile('manzu', 1, 0, 11);
    board.tiles[12][0] = makeTile('manzu', 2, 0, 12);
    board.tiles[13][0] = makeTile('manzu', 3, 0, 13);
    board.tiles[13][1] = makeTile('manzu', 3, 1, 13);
    board.tiles[13][2] = makeTile('manzu', 4, 2, 13);
    board.tiles[13][3] = makeTile('manzu', 5, 3, 13);

    const groups = findClearableGroups(board);
    console.log('T-shape with duplicate 3m:', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));
    
    // Should extract exactly one group of size 5
    expect(groups.length).toBe(1);
    expect(groups[0].length).toBe(5);
    
    // Verify that the duplicate is ignored and no tile is double-claimed
    const claimedTiles = new Set(groups[0].map(t => t.id));
    expect(claimedTiles.size).toBe(5);
  });

  it('should clear disjoint connected components independently (1-2-3 and 3-4-5 with distinct 3s)', () => {
    const board = createEmptyBoard();
    // Layout:
    // 1m(0,11) 2m(1,11) 3m(2,11)
    //                   3m(2,13) 4m(3,13) 5m(4,13)
    // These are distinct 3s. The components touch each other? No, distance between (2,11) and (2,13) is 2, not connected.
    // Wait, the components must be connected to each other, but the unique numbers subset must NOT be connected.
    // Actually, if they are not connected at all, they are 2 different components and handled separately!
    // So this is perfectly fine.
    board.tiles[11][0] = makeTile('manzu', 1, 0, 11);
    board.tiles[11][1] = makeTile('manzu', 2, 1, 11);
    board.tiles[11][2] = makeTile('manzu', 3, 2, 11);
    board.tiles[13][2] = makeTile('manzu', 3, 2, 13);
    board.tiles[13][3] = makeTile('manzu', 4, 3, 13);
    board.tiles[13][4] = makeTile('manzu', 5, 4, 13);

    const groups = findClearableGroups(board);
    console.log('Disjoint distinct 3s:', JSON.stringify(groups.map(g => g.map(t => `${t.suit}-${t.number} @(${t.x},${t.y})`))));
    
    expect(groups.length).toBe(2);
    expect(groups[0].length).toBe(3);
    expect(groups[1].length).toBe(3);
    
    // Ensure all 6 tiles are cleared without overlaps
    const totalCleared = groups[0].length + groups[1].length;
    expect(totalCleared).toBe(6);
  });
});

