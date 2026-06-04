import type { MahjongTile, GameBoard, ClearResult, Yaku, TileSuit, TileNumber, HonorType } from './mahjong-types';
import { areTilesEqual, getTileKey } from './mahjong-types';
import { YAKU_DEFINITIONS, createYaku } from './yaku-data';

const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 14;

// Generate a random tile using the full mahjong tile set
export function generateRandomTile(x: number = 0, y: number = 0, debugIndex?: number): MahjongTile {
  // Check debug Yakuman setup to drop only required tiles
  const debugYakuman = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEBUG_YAKUMAN : null;
  if (debugYakuman) {
    const val = parseInt(debugYakuman, 10);
    if (val === 100) {
      // Thirteen Orphans required sequence (14 tiles in total)
      const orphans: Array<{ suit: TileSuit; number?: TileNumber; honor?: HonorType }> = [
        { suit: 'manzu', number: 1 }, { suit: 'manzu', number: 9 },
        { suit: 'pinzu', number: 1 }, { suit: 'pinzu', number: 9 },
        { suit: 'souzu', number: 1 }, { suit: 'souzu', number: 9 },
        { suit: 'honor', honor: 'east' }, { suit: 'honor', honor: 'south' },
        { suit: 'honor', honor: 'west' }, { suit: 'honor', honor: 'north' },
        { suit: 'honor', honor: 'white' }, { suit: 'honor', honor: 'green' },
        { suit: 'honor', honor: 'red' },
        { suit: 'manzu', number: 1 } // duplicate to make 14
      ];
      
      const selected = debugIndex !== undefined
        ? orphans[debugIndex % orphans.length]
        : orphans[Math.floor(Math.random() * orphans.length)];

      const tile: MahjongTile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        suit: selected.suit,
        x,
        y,
      };
      if (selected.number !== undefined) tile.number = selected.number;
      if (selected.honor !== undefined) tile.honor = selected.honor;
      return tile;
    } else if (val === 101) {
      // Nine Gates required sequence (14 tiles in total)
      const pinzu: Array<{ suit: TileSuit; number?: TileNumber; honor?: HonorType }> = [
        { suit: 'pinzu', number: 1 }, { suit: 'pinzu', number: 1 }, { suit: 'pinzu', number: 1 },
        { suit: 'pinzu', number: 2 }, { suit: 'pinzu', number: 3 }, { suit: 'pinzu', number: 4 },
        { suit: 'pinzu', number: 5 }, { suit: 'pinzu', number: 6 }, { suit: 'pinzu', number: 7 },
        { suit: 'pinzu', number: 8 }, { suit: 'pinzu', number: 9 }, { suit: 'pinzu', number: 9 },
        { suit: 'pinzu', number: 9 },
        { suit: 'pinzu', number: 1 } // duplicate
      ];
      
      const selected = debugIndex !== undefined
        ? pinzu[debugIndex % pinzu.length]
        : pinzu[Math.floor(Math.random() * pinzu.length)];

      const tile: MahjongTile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        suit: selected.suit,
        x,
        y,
      };
      if (selected.number !== undefined) tile.number = selected.number;
      if (selected.honor !== undefined) tile.honor = selected.honor;
      return tile;
    } else if (val === 102) {
      // All Honors required sequence (14 tiles in total)
      const honors: Array<{ suit: TileSuit; number?: TileNumber; honor?: HonorType }> = [
        { suit: 'honor', honor: 'east' }, { suit: 'honor', honor: 'east' },
        { suit: 'honor', honor: 'south' }, { suit: 'honor', honor: 'south' },
        { suit: 'honor', honor: 'west' }, { suit: 'honor', honor: 'west' },
        { suit: 'honor', honor: 'north' }, { suit: 'honor', honor: 'north' },
        { suit: 'honor', honor: 'white' }, { suit: 'honor', honor: 'white' },
        { suit: 'honor', honor: 'green' }, { suit: 'honor', honor: 'green' },
        { suit: 'honor', honor: 'red' }, { suit: 'honor', honor: 'red' }
      ];
      
      const selected = debugIndex !== undefined
        ? honors[debugIndex % honors.length]
        : honors[Math.floor(Math.random() * honors.length)];

      const tile: MahjongTile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        suit: selected.suit,
        x,
        y,
      };
      if (selected.number !== undefined) tile.number = selected.number;
      if (selected.honor !== undefined) tile.honor = selected.honor;
      return tile;
    }
  }

  const rand = Math.random();
  
  // 70% numbered tiles (1-9) and 30% honor tiles (winds + dragons)
  if (rand < 0.7) {
    const suits: TileSuit[] = ['manzu', 'pinzu', 'souzu'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const number = (Math.floor(Math.random() * 9) + 1) as TileNumber;
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      suit,
      number,
      x,
      y,
    };
  } else {
    // All honor tiles (winds + dragons)
    const honors: HonorType[] = ['east', 'south', 'west', 'north', 'white', 'green', 'red'];
    const honor = honors[Math.floor(Math.random() * honors.length)];
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      suit: 'honor',
      honor,
      x,
      y,
    };
  }
}

export function generateRandomIndicator(): MahjongTile {
  const suits: TileSuit[] = ['manzu', 'pinzu', 'souzu'];
  const honorTiles: HonorType[] = ['east', 'south', 'west', 'north', 'white', 'green', 'red'];
  const isHonor = Math.random() < 0.25;
  if (isHonor) {
    const honor = honorTiles[Math.floor(Math.random() * honorTiles.length)];
    return {
      id: `indicator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      suit: 'honor',
      honor,
      x: 0,
      y: 0,
    };
  }

  const suit = suits[Math.floor(Math.random() * suits.length)];
  const number = (Math.floor(Math.random() * 9) + 1) as TileNumber;
  return {
    id: `indicator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    suit,
    number,
    x: 0,
    y: 0,
  };
}

export function getDoraTile(indicator: MahjongTile): MahjongTile {
  if (indicator.suit === 'honor') {
    const honorOrder: HonorType[] = ['east', 'south', 'west', 'north', 'white', 'green', 'red'];
    const nextIndex = (honorOrder.indexOf(indicator.honor!) + 1) % honorOrder.length;
    return {
      ...indicator,
      honor: honorOrder[nextIndex],
    };
  }

  const number = indicator.number! < 9 ? (indicator.number! + 1) as TileNumber : 1;
  return {
    ...indicator,
    number,
  };
}

export function isDora(tile: MahjongTile, doraIndicator: MahjongTile | null): boolean {
  if (!doraIndicator) return false;
  const dora = getDoraTile(doraIndicator);
  return areTilesEqual(tile, dora);
}

export function isUraDora(tile: MahjongTile, uraDoraIndicator: MahjongTile | null): boolean {
  if (!uraDoraIndicator) return false;
  const ura = getDoraTile(uraDoraIndicator);
  return areTilesEqual(tile, ura);
}

// Initialize empty game board
export function createEmptyBoard(): GameBoard {
  const tiles: (MahjongTile | null)[][] = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      tiles[y][x] = null;
    }
  }
  return { width: BOARD_WIDTH, height: BOARD_HEIGHT, tiles };
}

// Check if a position is valid on the board
function isValidPosition(board: GameBoard, x: number, y: number): boolean {
  return x >= 0 && x < board.width && y >= 0 && y < board.height;
}

// Check for triplets (3 same tiles) in a direction
function findTriplets(
  board: GameBoard,
  startX: number,
  startY: number,
  dx: number,
  dy: number
): MahjongTile[] | null {
  const tiles: MahjongTile[] = [];
  let x = startX;
  let y = startY;
  
  for (let i = 0; i < 3; i++) {
    if (!isValidPosition(board, x, y)) return null;
    const tile = board.tiles[y][x];
    if (!tile || tile.suit === 'ojama') return null;
    tiles.push(tile);
    x += dx;
    y += dy;
  }
  
  // Check if all three tiles are the same
  if (areTilesEqual(tiles[0], tiles[1]) && areTilesEqual(tiles[1], tiles[2])) {
    return tiles;
  }
  return null;
}

// Check for sequences (3 consecutive numbered tiles)
function findSequences(
  board: GameBoard,
  startX: number,
  startY: number,
  dx: number,
  dy: number
): MahjongTile[] | null {
  const tiles: MahjongTile[] = [];
  let x = startX;
  let y = startY;
  
  for (let i = 0; i < 3; i++) {
    if (!isValidPosition(board, x, y)) return null;
    const tile = board.tiles[y][x];
    if (!tile || tile.suit === 'honor' || !tile.number) return null;
    tiles.push(tile);
    x += dx;
    y += dy;
  }
  
  // Sort by number
  tiles.sort((a, b) => (a.number || 0) - (b.number || 0));
  
  // Check if same suit and consecutive
  if (
    tiles[0].suit === tiles[1].suit &&
    tiles[1].suit === tiles[2].suit &&
    tiles[0].number &&
    tiles[1].number &&
    tiles[2].number &&
    tiles[1].number === tiles[0].number + 1 &&
    tiles[2].number === tiles[1].number + 1
  ) {
    return tiles;
  }
  return null;
}

// Detect yaku based on cleared tiles and history
function detectYaku(clearedTiles: MahjongTile[], board: GameBoard, history: ClearResult[] = []): Yaku | null {
  // Check for Thirteen Orphans (国士無双)
  if (clearedTiles.length === 14) {
    const isOrphans = clearedTiles.every(t => t.suit === 'honor' || t.number === 1 || t.number === 9);
    if (isOrphans) {
      const def = YAKU_DEFINITIONS.find(y => y.name === 'Thirteen Orphans')!;
      return createYaku(def, clearedTiles);
    }
  }

  // Check for All Honors (字一色)
  if (clearedTiles.length === 14) {
    const isAllHonors = clearedTiles.every(t => t.suit === 'honor');
    if (isAllHonors) {
      const def = YAKU_DEFINITIONS.find(y => y.name === 'All Honors')!;
      return createYaku(def, clearedTiles);
    }
  }

  // Check for Nine Gates (九蓮宝燈)
  if (clearedTiles.length === 14) {
    const firstSuit = clearedTiles[0].suit;
    if (firstSuit !== 'honor' && clearedTiles.every(t => t.suit === firstSuit)) {
      const counts = new Array(10).fill(0);
      for (const t of clearedTiles) {
        if (t.number) counts[t.number]++;
      }
      let isNineGates = counts[1] >= 3 && counts[9] >= 3;
      for (let i = 2; i <= 8; i++) {
        if (counts[i] < 1) isNineGates = false;
      }
      if (isNineGates) {
        const def = YAKU_DEFINITIONS.find(y => y.name === 'Nine Gates')!;
        return createYaku(def, clearedTiles);
      }
    }
  }

  const allGroups = [...history.map(h => h.tiles), clearedTiles];
  const dragons = ['white', 'green', 'red'];
  const winds = ['east', 'south', 'west', 'north'];

  // Check for Big Three Dragons (大三元) in history + current
  const isDragon = clearedTiles.length >= 3 && clearedTiles[0].suit === 'honor' && dragons.includes(clearedTiles[0].honor!);
  if (isDragon) {
    const hasAllDragons = dragons.every(d => 
      allGroups.some(g => g.length >= 3 && g[0].suit === 'honor' && g[0].honor === d)
    );
    if (hasAllDragons) {
      // Collect all dragon triplets from history and current
      const fullTiles = allGroups.filter(g => 
        g.length >= 3 && g[0].suit === 'honor' && dragons.includes(g[0].honor!)
      ).flat();
      const def = YAKU_DEFINITIONS.find(y => y.name === 'Big Three Dragons')!;
      return createYaku(def, fullTiles);
    }
  }

  // Check for Four Winds (四喜和) in history + current
  const isWind = clearedTiles.length >= 3 && clearedTiles[0].suit === 'honor' && winds.includes(clearedTiles[0].honor!);
  if (isWind) {
    const hasAllWinds = winds.every(w =>
      allGroups.some(g => g.length >= 3 && g[0].suit === 'honor' && g[0].honor === w)
    );
    if (hasAllWinds) {
      const fullTiles = allGroups.filter(g =>
        g.length >= 3 && g[0].suit === 'honor' && winds.includes(g[0].honor!)
      ).flat();
      const def = YAKU_DEFINITIONS.find(y => y.name === 'Four Winds')!;
      return createYaku(def, fullTiles);
    }
  }

  // Check for Pure Straight (一気通貫) in history + current
  const isNumbered = clearedTiles.length >= 3 && clearedTiles[0].suit !== 'honor' && clearedTiles[0].number !== undefined;
  if (isNumbered) {
    const suit = clearedTiles[0].suit;
    const numbersOfSuit = new Set<number>();
    for (const group of allGroups) {
      for (const t of group) {
        if (t.suit === suit && t.number !== undefined) {
          numbersOfSuit.add(t.number);
        }
      }
    }
    let hasAll = true;
    for (let i = 1; i <= 9; i++) {
      if (!numbersOfSuit.has(i)) {
        hasAll = false;
        break;
      }
    }
    if (hasAll) {
      // Collect all tiles of the suit to form the straight
      const fullTiles = allGroups.filter(g => g.some(t => t.suit === suit && t.number !== undefined)).flat();
      const def = YAKU_DEFINITIONS.find(y => y.name === 'Pure Straight')!;
      return createYaku(def, fullTiles);
    }
  }

  // Check for Nine Gates (九蓮宝燈) in history + current
  // Requires at least three 1s, one 2-8, and three 9s of the same suit
  if (isNumbered) {
    const suit = clearedTiles[0].suit;
    const numCounts = new Array(10).fill(0);
    for (const group of allGroups) {
      for (const t of group) {
        if (t.suit === suit && t.number !== undefined) {
          numCounts[t.number]++;
        }
      }
    }
    
    let isNineGates = true;
    for (let i = 1; i <= 9; i++) {
      if (i === 1 || i === 9) {
        if (numCounts[i] < 3) isNineGates = false;
      } else {
        if (numCounts[i] < 1) isNineGates = false;
      }
    }
    
    if (isNineGates) {
      const fullTiles = allGroups.filter(g => g.some(t => t.suit === suit)).flat();
      const def = YAKU_DEFINITIONS.find(y => y.name === 'Nine Gates')!;
      return createYaku(def, fullTiles);
    }
  }

  // Check for Thirteen Orphans (国士無双) in history + current
  // Requires 1, 9 of all suits, and all 7 honors
  const hasOrphan = (suit: string, num?: number, honor?: string) => {
    return allGroups.some(g => g.some(t => 
      t.suit === suit && 
      (num !== undefined ? t.number === num : true) && 
      (honor !== undefined ? t.honor === honor : true)
    ));
  };

  const isThirteenOrphans = 
    hasOrphan('manzu', 1) && hasOrphan('manzu', 9) &&
    hasOrphan('pinzu', 1) && hasOrphan('pinzu', 9) &&
    hasOrphan('souzu', 1) && hasOrphan('souzu', 9) &&
    hasOrphan('honor', undefined, 'east') &&
    hasOrphan('honor', undefined, 'south') &&
    hasOrphan('honor', undefined, 'west') &&
    hasOrphan('honor', undefined, 'north') &&
    hasOrphan('honor', undefined, 'white') &&
    hasOrphan('honor', undefined, 'green') &&
    hasOrphan('honor', undefined, 'red');

  if (isThirteenOrphans && (
    (clearedTiles[0].suit === 'honor') || 
    (clearedTiles[0].number === 1 || clearedTiles[0].number === 9)
  )) {
    // Return Thirteen Orphans only when the triggering clear is a terminal/honor
    // Collect all terminals and honors from history
    const fullTiles = allGroups.filter(g => g.some(t => t.suit === 'honor' || t.number === 1 || t.number === 9)).flat();
    const def = YAKU_DEFINITIONS.find(y => y.name === 'Thirteen Orphans')!;
    return createYaku(def, fullTiles);
  }

  // Check for dragon triplet
  if (isDragon) {
    const def = YAKU_DEFINITIONS.find(y => y.name === 'Dragon Triplet')!;
    return createYaku(def, clearedTiles);
  }
  
  // Check for wind triplet
  if (isWind) {
    const def = YAKU_DEFINITIONS.find(y => y.name === 'Wind Triplet')!;
    return createYaku(def, clearedTiles);
  }
  
  // Check for terminal triplet (1 or 9)
  if (
    clearedTiles.length >= 3 &&
    clearedTiles[0].suit !== 'honor' &&
    (clearedTiles[0].number === 1 || clearedTiles[0].number === 9)
  ) {
    const def = YAKU_DEFINITIONS.find(y => y.name === 'Terminal Triple')!;
    return createYaku(def, clearedTiles);
  }
  
  // Check for all simples (2-8)
  if (
    clearedTiles.length >= 3 &&
    clearedTiles.every(t => 
      t.suit !== 'honor' && 
      t.number && 
      t.number >= 2 && 
      t.number <= 8
    )
  ) {
    const def = YAKU_DEFINITIONS.find(y => y.name === 'All Simples')!;
    return createYaku(def, clearedTiles);
  }
  
  return null;
}

function getAllTilesOnBoard(board: GameBoard): MahjongTile[] {
  const tiles: MahjongTile[] = [];
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const tile = board.tiles[y][x];
      if (tile) tiles.push(tile);
    }
  }
  return tiles;
}

// Find connected same tiles using flood fill (for L-shapes, T-shapes, diagonals, etc.)
// Uses 8 directions: up, down, left, right, and 4 diagonals
function findConnectedSameTiles(
  board: GameBoard,
  startX: number,
  startY: number,
  globalVisited: Set<string>
): MahjongTile[] {
  const startTile = board.tiles[startY][startX];
  if (!startTile || startTile.suit === 'ojama') return [];
  
  const posKey = `${startX},${startY}`;
  if (globalVisited.has(posKey)) return [];
  
  const connected: MahjongTile[] = [];
  const localVisited = new Set<string>();
  const queue: [number, number][] = [[startX, startY]];
  
  // 8-directional (up, down, left, right + 4 diagonals)
  const directions = [
    [0, -1], [0, 1], [-1, 0], [1, 0],  // vertical & horizontal
    [-1, -1], [1, -1], [-1, 1], [1, 1]  // diagonals
  ];
  
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;
    
    if (localVisited.has(key)) continue;
    if (!isValidPosition(board, x, y)) continue;
    
    const tile = board.tiles[y][x];
    if (!tile) continue;
    if (!areTilesEqual(tile, startTile)) continue;
    
    localVisited.add(key);
    connected.push(tile);
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (!localVisited.has(`${nx},${ny}`)) {
        queue.push([nx, ny]);
      }
    }
  }
  
  // Mark all found positions as globally visited
  for (const tile of connected) {
    globalVisited.add(`${tile.x},${tile.y}`);
  }
  
  return connected;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sequence detection
//
// Rules (as specified):
//   - Same suit, numbered tiles only (no honors)
//   - A valid sequence group = a set of tiles whose numbers are all distinct AND
//     form a contiguous range (no gaps), connected via 8-directional adjacency
//   - Order on the board does not matter (3,1,2 is valid)
//   - If duplicates exist, the largest valid sub-group is found instead
//     e.g. 3,1,2,3,1 → the first "3,1,2" cluster clears; the remaining 3,1 do not
//   - Minimum 3 tiles to clear
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a set of candidate tiles (same suit, all adjacent-consecutive),
 * find all maximal subsets that:
 *   1. Have no duplicate numbers
 *   2. Form a contiguous number range (no gaps)
 *   3. Are connected on the board (each tile is 8-directionally adjacent to
 *      at least one other tile in the subset with a consecutive number)
 *   4. Have at least 3 tiles
 *
 * Strategy:
 *   - Collect all tiles of this suit that are reachable via consecutive-number
 *     adjacency from any starting tile (connected component in the sequence graph).
 *   - Within each connected component, if numbers are all unique → valid group.
 *   - If duplicates exist, enumerate all maximal no-duplicate connected subsets
 *     by trying each possible contiguous number range [lo..hi] and checking
 *     connectivity.
 */
function findSequenceGroups(board: GameBoard, suit: TileSuit): MahjongTile[][] {
  const DIRS = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
    [-1, -1], [1, -1], [-1, 1], [1, 1],
  ] as const;

  // Collect all same-suit numbered tiles
  const allTiles: MahjongTile[] = [];
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const t = board.tiles[y][x];
      if (t && t.suit === suit && t.number) allTiles.push(t);
    }
  }
  if (allTiles.length < 3) return [];

  // Helper: are two tiles 8-directionally adjacent?
  function isAdjacent(a: MahjongTile, b: MahjongTile): boolean {
    return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1 && (a.x !== b.x || a.y !== b.y);
  }

  // Helper: is a set of tiles connected via spatial 8-directional adjacency?
  // Each tile must be reachable from the first via steps where tiles are
  // 8-directionally adjacent (no number constraint — the number check is
  // handled separately by ensuring the group forms a contiguous range).
  function isConnectedSequence(tiles: MahjongTile[]): boolean {
    if (tiles.length <= 1) return true;
    const visited = new Set<string>();
    const start = tiles[0];
    const queue = [start];
    visited.add(`${start.x},${start.y}`);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const other of tiles) {
        const key = `${other.x},${other.y}`;
        if (visited.has(key)) continue;
        if (isAdjacent(cur, other)) {
          visited.add(key);
          queue.push(other);
        }
      }
    }
    return visited.size === tiles.length;
  }

  // Step 1: find connected components of same-suit tiles via spatial adjacency
  // Any two same-suit numbered tiles that are 8-directionally adjacent belong
  // to the same component, regardless of their number difference.
  const visited = new Set<string>();
  const components: MahjongTile[][] = [];

  for (const startTile of allTiles) {
    const key = `${startTile.x},${startTile.y}`;
    if (visited.has(key)) continue;

    // BFS: collect all same-suit tiles reachable via 8-directional adjacency
    const component: MahjongTile[] = [];
    const queue: MahjongTile[] = [startTile];
    const localVisited = new Set<string>();
    localVisited.add(key);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      component.push(cur);
      visited.add(`${cur.x},${cur.y}`);

      for (const [dx, dy] of DIRS) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (!isValidPosition(board, nx, ny)) continue;
        const neighbor = board.tiles[ny][nx];
        if (!neighbor || neighbor.suit !== suit || !neighbor.number) continue;
        const nkey = `${nx},${ny}`;
        if (localVisited.has(nkey)) continue;
        localVisited.add(nkey);
        queue.push(neighbor);
      }
    }

    components.push(component);
  }

  // Step 2: for each component, extract valid sequence groups
  const results: MahjongTile[][] = [];
  const addedKeys = new Set<string>(); // prevent duplicate groups

  for (const component of components) {
    const numbers = component.map(t => t.number!);
    const uniqueNums = [...new Set(numbers)].sort((a, b) => a - b);

    // Check if the whole component is already a valid sequence (no duplicates, no gaps)
    const hasDuplicates = uniqueNums.length !== numbers.length;
    const hasGaps = uniqueNums.some((n, i) => i > 0 && n - uniqueNums[i - 1] !== 1);

    if (!hasDuplicates && !hasGaps && component.length >= 3) {
      // Whole component is valid
      const groupKey = component.map(t => t.id).sort().join(',');
      if (!addedKeys.has(groupKey)) {
        addedKeys.add(groupKey);
        results.push(component);
      }
      continue;
    }

    // Duplicates or gaps exist — enumerate all contiguous number ranges [lo..hi]
    // and find connected subsets of tiles with those exact numbers.
    // We try all ranges of length >= 3.
    const minNum = uniqueNums[0];
    const maxNum = uniqueNums[uniqueNums.length - 1];

    for (let lo = minNum; lo <= maxNum - 2; lo++) {
      for (let hi = lo + 2; hi <= maxNum; hi++) {
        // For each number in [lo..hi], collect all tiles with that number
        const byNumber = new Map<number, MahjongTile[]>();
        for (let n = lo; n <= hi; n++) {
          const tilesForN = component.filter(t => t.number === n);
          if (tilesForN.length === 0) break; // gap — skip this range
          byNumber.set(n, tilesForN);
        }
        if (byNumber.size !== hi - lo + 1) continue; // gap in range

        // If every number has exactly one tile, check connectivity directly
        const allSingle = [...byNumber.values()].every(arr => arr.length === 1);
        if (allSingle) {
          const candidates = [...byNumber.values()].map(arr => arr[0]);
          if (!isConnectedSequence(candidates)) continue;
          const groupKey = candidates.map(t => t.id).sort().join(',');
          if (!addedKeys.has(groupKey)) {
            addedKeys.add(groupKey);
            results.push(candidates);
          }
          continue;
        }

        // Some numbers have multiple tiles — try all combinations (one tile per number)
        // and find connected ones. Use backtracking.
        const numbers = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
        const chosen: MahjongTile[] = [];

        function backtrack(idx: number): void {
          if (idx === numbers.length) {
            if (isConnectedSequence(chosen)) {
              const groupKey = chosen.map(t => t.id).sort().join(',');
              if (!addedKeys.has(groupKey)) {
                addedKeys.add(groupKey);
                results.push([...chosen]);
              }
            }
            return;
          }
          const n = numbers[idx];
          for (const tile of byNumber.get(n)!) {
            chosen.push(tile);
            backtrack(idx + 1);
            chosen.pop();
          }
        }

        backtrack(0);
      }
    }
  }

  return results;
}

// Helper to check for strict board-state Yakumans
export function checkStrictYakuman(board: GameBoard): { name: string; tiles: MahjongTile[] } | null {
  // Collect all non-ojama tiles currently resting on the board
  const activeTiles: MahjongTile[] = [];
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const t = board.tiles[y][x];
      if (t && t.suit !== 'ojama') {
        activeTiles.push(t);
      }
    }
  }

  if (activeTiles.length === 0) return null;

  // 1. 国士無双 (Thirteen Orphans)
  // Requires exactly 14 non-ojama tiles, 13 distinct terminals & honors + 1 duplicate
  if (activeTiles.length === 14) {
    const requiredKeys = new Set([
      'manzu-1', 'manzu-9',
      'pinzu-1', 'pinzu-9',
      'souzu-1', 'souzu-9',
      'honor-east', 'honor-south', 'honor-west', 'honor-north',
      'honor-white', 'honor-green', 'honor-red'
    ]);

    const activeKeys = new Set(
      activeTiles.map(t => {
        if (t.suit === 'honor') return `honor-${t.honor}`;
        return `${t.suit}-${t.number}`;
      })
    );

    let isOrphans = true;
    for (const key of requiredKeys) {
      if (!activeKeys.has(key)) {
        isOrphans = false;
        break;
      }
    }
    if (isOrphans) {
      return { name: 'Thirteen Orphans', tiles: activeTiles };
    }
  }

  // 2. 字一色 (All Honors)
  // Requires exactly 14 non-ojama tiles, all of which must be wind or dragon honors
  if (activeTiles.length === 14) {
    const allHonors = activeTiles.every(t => t.suit === 'honor');
    if (allHonors) {
      return { name: 'All Honors', tiles: activeTiles };
    }
  }

  // 3. 九蓮宝燈 (Nine Gates)
  // Requires exactly 14 non-ojama tiles of the same suit.
  // Set must be exactly 1,1,1,2,3,4,5,6,7,8,9,9,9 plus one extra duplicate.
  if (activeTiles.length === 14) {
    const firstSuit = activeTiles[0].suit;
    if (firstSuit !== 'honor' && activeTiles.every(t => t.suit === firstSuit)) {
      const counts = new Array(10).fill(0);
      for (const t of activeTiles) {
        if (t.number) counts[t.number]++;
      }

      let isNineGates = counts[1] >= 3 && counts[9] >= 3;
      for (let i = 2; i <= 8; i++) {
        if (counts[i] < 1) isNineGates = false;
      }

      if (isNineGates) {
        return { name: 'Nine Gates', tiles: activeTiles };
      }
    }
  }

  return null;
}

// Find all clearable groups on the board
// Supports: vertical, horizontal, diagonal lines AND connected shapes (L, T, blobs)
//
// Deduplication guarantee:
//   Each tile position can belong to AT MOST ONE group in the returned list.
//   When multiple candidate groups overlap, the largest group wins.
//   Ties are broken by the order of detection (flood-fill > linear triplet > sequence).
export function findClearableGroups(board: GameBoard): MahjongTile[][] {
  // Check for strict full-board Yakumans first
  const yakuman = checkStrictYakuman(board);
  if (yakuman) {
    return [yakuman.tiles];
  }

  // Disable normal clears in debug/test mode so that tiles can stack up
  const debugYakuman = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEBUG_YAKUMAN : null;
  if (debugYakuman) {
    return [];
  }

  // ── Step 1: collect ALL candidate groups (may overlap) ──────────────────
  const candidates: MahjongTile[][] = [];
  const seenGroupKeys = new Set<string>();

  const addCandidate = (tiles: MahjongTile[] | null) => {
    if (!tiles || tiles.length < 3) return;
    const key = tiles.map(t => t.id).sort().join(',');
    if (!seenGroupKeys.has(key)) {
      seenGroupKeys.add(key);
      candidates.push(tiles);
    }
  };

  // 1a. Connected same tiles (flood-fill, 8-dir) — handles L/T/blob/diagonal
  const visitedConnected = new Set<string>();
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const connected = findConnectedSameTiles(board, x, y, visitedConnected);
      if (connected.length >= 3) addCandidate(connected);
    }
  }

  // 1b. Linear triplets (horizontal, vertical, diagonal ×2)
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x <= board.width - 3; x++) addCandidate(findTriplets(board, x, y, 1, 0));
  }
  for (let x = 0; x < board.width; x++) {
    for (let y = 0; y <= board.height - 3; y++) addCandidate(findTriplets(board, x, y, 0, 1));
  }
  for (let y = 0; y <= board.height - 3; y++) {
    for (let x = 0; x <= board.width - 3; x++) addCandidate(findTriplets(board, x, y, 1, 1));
  }
  for (let y = 0; y <= board.height - 3; y++) {
    for (let x = 2; x < board.width; x++) addCandidate(findTriplets(board, x, y, -1, 1));
  }

  // 1c. Connected sequences (flood-fill variant, handles L/T/blob/diagonal)
  const suits: TileSuit[] = ['manzu', 'pinzu', 'souzu'];
  for (const suit of suits) {
    for (const group of findSequenceGroups(board, suit)) addCandidate(group);
  }

  // 1d. Linear sequences (horizontal, vertical, diagonal ×2)
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x <= board.width - 3; x++) addCandidate(findSequences(board, x, y, 1, 0));
  }
  for (let x = 0; x < board.width; x++) {
    for (let y = 0; y <= board.height - 3; y++) addCandidate(findSequences(board, x, y, 0, 1));
  }
  for (let y = 0; y <= board.height - 3; y++) {
    for (let x = 0; x <= board.width - 3; x++) addCandidate(findSequences(board, x, y, 1, 1));
  }
  for (let y = 0; y <= board.height - 3; y++) {
    for (let x = 2; x < board.width; x++) addCandidate(findSequences(board, x, y, -1, 1));
  }

  // ── Step 2: resolve overlaps — each tile position belongs to at most one group ──
  // Sort candidates: larger groups first (greedy maximum coverage).
  candidates.sort((a, b) => b.length - a.length);

  const claimedPositions = new Set<string>();
  const finalGroups: MahjongTile[][] = [];

  for (const group of candidates) {
    // Check if any tile in this group is already claimed by a previously selected group
    const hasOverlap = group.some(t => claimedPositions.has(`${t.x},${t.y}`));
    if (hasOverlap) continue;

    // Claim all positions in this group
    for (const t of group) claimedPositions.add(`${t.x},${t.y}`);
    finalGroups.push(group);
  }

  return finalGroups;
}

// Clear tiles from the board and return results
// Phase 1: mark tiles as clearing (isClearing=true) but do NOT remove them yet.
// Phase 2: call removeClearedTiles() after the animation delay.
export function clearTiles(
  board: GameBoard,
  groups: MahjongTile[][],
  chainCount: number,
  doraIndicator: MahjongTile | null,
  uraDoraIndicator: MahjongTile | null,
  history: ClearResult[] = [],
): ClearResult[] {
  const results: ClearResult[] = [];
  const currentHistory = [...history];
  const now = Date.now();

  for (const group of groups) {
    const yaku = detectYaku(group, board, currentHistory);
    
    // Mahjong-based score calculation
    const han = yaku ? yaku.han : 1; // Default to 1 han for any basic clear
    
    const doraCount = group.reduce((count, tile) => {
      let c = 0;
      if (isDora(tile, doraIndicator)) c++;
      if (isUraDora(tile, uraDoraIndicator)) c++;
      return count + c;
    }, 0);
    
    const totalHan = han + doraCount;
    let baseScore = 0;
    
    // Determine base score by Han (like standard Mahjong points, roughly)
    if (totalHan >= 13) {
      baseScore = 32000; // Yakuman
    } else if (totalHan >= 11) {
      baseScore = 24000; // Sanbaiman
    } else if (totalHan >= 8) {
      baseScore = 16000; // Baiman
    } else if (totalHan >= 6) {
      baseScore = 12000; // Haneman
    } else if (totalHan >= 4) {
      baseScore = 8000;  // Mangan
    } else {
      // 1-3 han calculation (approximated child score, 30 fu)
      if (totalHan === 1) baseScore = 1000;
      else if (totalHan === 2) baseScore = 2000;
      else if (totalHan === 3) baseScore = 3900;
      else baseScore = 1000;
    }

    // Chain multiplier logic:
    // Base Mahjong scores are large enough, so we use (chainCount + 1) multiplier
    // to keep it somewhat sane but still rewarding chains.
    const chainMultiplier = chainCount + 1;
    const finalScore = baseScore * chainMultiplier;

    const result = {
      tiles: yaku ? yaku.tiles : group, // Use full yaku tiles if available, otherwise just the cleared group
      yaku,
      score: finalScore,
      isChain: chainCount > 0,
      chainCount,
      timestamp: now,
    };
    results.push(result);
    currentHistory.push(result);

    // Phase 1: mark tiles as clearing (animation plays in UI)
    for (const tile of group) {
      if (isValidPosition(board, tile.x, tile.y)) {
        board.tiles[tile.y][tile.x] = { ...tile, isClearing: true };
        
        // Find adjacent ojama tiles
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [dx, dy] of directions) {
          const nx = tile.x + dx;
          const ny = tile.y + dy;
          if (isValidPosition(board, nx, ny)) {
            const adjTile = board.tiles[ny][nx];
            if (adjTile && adjTile.suit === 'ojama') {
              board.tiles[ny][nx] = { ...adjTile, isClearing: true };
            }
          }
        }
      }
    }
  }

  return results;
}

// Phase 2: remove tiles that are marked as clearing from the board
export function removeClearedTiles(board: GameBoard): void {
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      if (board.tiles[y][x]?.isClearing) {
        board.tiles[y][x] = null;
      }
    }
  }
}

// Apply gravity - tiles fall down to fill gaps
export function applyGravity(board: GameBoard): boolean {
  let moved = false;
  
  for (let x = 0; x < board.width; x++) {
    // Start from the bottom, skip the last row
    for (let y = board.height - 2; y >= 0; y--) {
      const tile = board.tiles[y][x];
      if (tile) {
        // Find the lowest empty position
        let newY = y;
        for (let checkY = y + 1; checkY < board.height; checkY++) {
          if (board.tiles[checkY][x] === null) {
            newY = checkY;
          } else {
            break;
          }
        }
        
        if (newY !== y) {
          board.tiles[newY][x] = { ...tile, y: newY, isDropping: true };
          board.tiles[y][x] = null;
          moved = true;
        }
      }
    }
  }
  
  return moved;
}

// Place a tile on the board
export function placeTile(board: GameBoard, tile: MahjongTile, x: number): boolean {
  // Find the lowest empty position in the column
  for (let y = board.height - 1; y >= 0; y--) {
    if (board.tiles[y][x] === null) {
      board.tiles[y][x] = { ...tile, x, y };
      return true;
    }
  }
  return false; // Column is full
}

// Check if game is over (top row has tiles)
export function isGameOver(board: GameBoard): boolean {
  for (let x = 0; x < board.width; x++) {
    if (board.tiles[0][x] !== null) {
      return true;
    }
  }
  return false;
}

// Add garbage tiles from opponent
export function addGarbageTiles(board: GameBoard, count: number): void {
  const numOjama = count;
  for (let i = 0; i < numOjama; i++) {
    // Pick random column
    const x = Math.floor(Math.random() * board.width);
    // Find the topmost empty position in that column
    for (let y = 0; y < board.height; y++) {
      if (board.tiles[y][x] === null) {
        board.tiles[y][x] = {
          id: `ojama-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          suit: 'ojama',
          x,
          y,
        };
        break;
      }
    }
  }
}

// Calculate score for a clear
export function calculateScore(results: ClearResult[]): number {
  return results.reduce((sum, r) => sum + r.score, 0);
}

// Calculate garbage to send to opponent
export function calculateGarbage(results: ClearResult[]): number {
  let garbage = 0;
  for (const result of results) {
    if (result.yaku) {
      garbage += result.yaku.han;
    }
  }
  return garbage;
}

/**
 * Calculate player level based on score.
 * Uses a square root curve so that early scores level up quickly,
 * but huge yakuman scores don't instantly max out the level.
 * e.g. 1000pt -> Lv 2, 4000pt -> Lv 3, 9000pt -> Lv 4, 32000pt(Yakuman) -> Lv 6
 */
export function calculateLevel(score: number): number {
  return Math.floor(Math.sqrt(score / 1000)) + 1;
}

/**
 * Calculate the tile drop interval (tick speed) based on the level.
 */
export function getTickIntervalMs(level: number): number {
  const baseSpeed = 800;
  // Reduce 60ms per level, cap at 150ms
  return Math.max(150, baseSpeed - (level - 1) * 60);
}
