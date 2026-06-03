// Mahjong tile types
export type TileSuit = 'manzu' | 'pinzu' | 'souzu' | 'honor' | 'ojama';
export type TileNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type HonorType = 'east' | 'south' | 'west' | 'north' | 'white' | 'green' | 'red';

export interface MahjongTile {
  id: string;
  suit: TileSuit;
  number?: TileNumber;
  honor?: HonorType;
  x: number;
  y: number;
  isClearing?: boolean;
  isDropping?: boolean;
}

export interface GameBoard {
  width: number;
  height: number;
  tiles: (MahjongTile | null)[][];
}

export interface ClearResult {
  tiles: MahjongTile[];
  yaku: Yaku | null;
  score: number;
  isChain: boolean;
  chainCount: number;
  timestamp: number;
}

export interface Yaku {
  name: string;
  japaneseName: string;
  description: string;
  han: number;
  tiles: MahjongTile[];
}

export interface GameState {
  board: GameBoard;
  currentTile: MahjongTile | null;
  nextTile: MahjongTile | null;
  doraIndicator: MahjongTile | null;
  uraDoraIndicator: MahjongTile | null;
  score: number;
  level: number;
  combo: number;
  maxCombo: number;
  garbageQueue: number;
  isGameOver: boolean;
  isPaused: boolean;
  lastYaku: Yaku | null;
  clearHistory: ClearResult[];
  debugTileIndex?: number;
}

export interface PlayerState {
  id: string;
  name: string;
  gameState: GameState;
  isReady: boolean;
  isConnected: boolean;
}

export interface MultiplayerRoom {
  id: string;
  players: PlayerState[];
  isStarted: boolean;
  winner: string | null;
}

// Tile display mapping
export const TILE_DISPLAY: Record<string, string> = {
  // Manzu (characters)
  'manzu-1': '一萬', 'manzu-2': '二萬', 'manzu-3': '三萬',
  'manzu-4': '四萬', 'manzu-5': '五萬', 'manzu-6': '六萬',
  'manzu-7': '七萬', 'manzu-8': '八萬', 'manzu-9': '九萬',
  // Pinzu (dots)
  'pinzu-1': '一筒', 'pinzu-2': '二筒', 'pinzu-3': '三筒',
  'pinzu-4': '四筒', 'pinzu-5': '五筒', 'pinzu-6': '六筒',
  'pinzu-7': '七筒', 'pinzu-8': '八筒', 'pinzu-9': '九筒',
  // Souzu (bamboo)
  'souzu-1': '一索', 'souzu-2': '二索', 'souzu-3': '三索',
  'souzu-4': '四索', 'souzu-5': '五索', 'souzu-6': '六索',
  'souzu-7': '七索', 'souzu-8': '八索', 'souzu-9': '九索',
  // Honors
  'honor-east': '東', 'honor-south': '南', 'honor-west': '西', 'honor-north': '北',
  'honor-white': '白', 'honor-green': '發', 'honor-red': '中',
  // Ojama
  'ojama': '✕',
};

export const TILE_EMOJI: Record<string, string> = {
  // Manzu
  'manzu-1': '🀇', 'manzu-2': '🀈', 'manzu-3': '🀉',
  'manzu-4': '🀊', 'manzu-5': '🀋', 'manzu-6': '🀌',
  'manzu-7': '🀍', 'manzu-8': '🀎', 'manzu-9': '🀏',
  // Pinzu
  'pinzu-1': '🀙', 'pinzu-2': '🀚', 'pinzu-3': '🀛',
  'pinzu-4': '🀜', 'pinzu-5': '🀝', 'pinzu-6': '🀞',
  'pinzu-7': '🀟', 'pinzu-8': '🀠', 'pinzu-9': '🀡',
  // Souzu
  'souzu-1': '🀐', 'souzu-2': '🀑', 'souzu-3': '🀒',
  'souzu-4': '🀓', 'souzu-5': '🀔', 'souzu-6': '🀕',
  'souzu-7': '🀖', 'souzu-8': '🀗', 'souzu-9': '🀘',
  // Honors
  'honor-east': '🀀', 'honor-south': '🀁', 'honor-west': '🀂', 'honor-north': '🀃',
  'honor-white': '🀆', 'honor-green': '🀅', 'honor-red': '🀄',
  // Ojama
  'ojama': '⬛',
};

export function getTileKey(tile: MahjongTile): string {
  if (tile.suit === 'ojama') return 'ojama';
  if (tile.suit === 'honor') {
    return `honor-${tile.honor}`;
  }
  return `${tile.suit}-${tile.number}`;
}

export function getTileDisplay(tile: MahjongTile): string {
  return TILE_DISPLAY[getTileKey(tile)] || '?';
}

export function areTilesEqual(a: MahjongTile, b: MahjongTile): boolean {
  if (a.suit !== b.suit) return false;
  if (a.suit === 'honor') return a.honor === b.honor;
  // For numbered tiles, same suit AND same number must match
  return a.suit === b.suit && a.number === b.number;
}
