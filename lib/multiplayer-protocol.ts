import type { GameState } from './mahjong-types';

/** クライアントが保持するセッション（sessionToken は localStorage に保存可） */
export interface SessionInfo {
  playerId: string;
  playerName: string;
  sessionToken: string;
}

export type RoomMemberRole = 'player' | 'spectator';

export interface PublicPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  score: number;
  isConnected: boolean;
}

export interface PublicSpectator {
  id: string;
  name: string;
  isConnected: boolean;
}

export interface PublicRoom {
  id: string;
  name: string;
  players: PublicPlayer[];
  spectators: PublicSpectator[];
  maxPlayers: number;
  maxSpectators: number;
  isStarted: boolean;
  createdAt: number;
  spectatorCount: number;
}

export interface PublicRoomListItem {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  spectatorCount: number;
  maxSpectators: number;
  isStarted: boolean;
  createdAt: number;
}

export interface ChatMessagePayload {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
  role: RoomMemberRole | 'system';
}

export interface PlayerMatchSnapshot {
  playerId: string;
  playerName: string;
  gameState: GameState;
}

export interface MatchSnapshot {
  roomId: string;
  players: PlayerMatchSnapshot[];
  winnerId: string | null;
  startedAt: number;
}

export interface GameOverPayload {
  roomId: string;
  winnerId: string;
  winnerName: string;
  scores: Array<{ playerId: string; playerName: string; score: number }>;
  startedAt: number;   // Unix ms（対戦開始時刻）
  endedAt: number;     // Unix ms（対戦終了時刻）
  roomName: string;    // ルーム名
}

export type GameInputAction = 'move-left' | 'move-right' | 'soft-drop' | 'hard-drop';

export interface ServerErrorPayload {
  code: string;
  message: string;
}

/** Socket.IO イベント名（クライアント ↔ サーバー） */
export const ServerEvents = {
  SESSION_CREATED: 'session:created',
  SESSION_RESUMED: 'session:resumed',
  ROOM_LIST: 'room:list',
  ROOM_UPDATED: 'room:updated',
  CHAT_MESSAGE: 'chat:message',
  MATCH_STATE: 'match:state',
  MATCH_STARTED: 'match:started',
  MATCH_ENDED: 'match:ended',
  ERROR: 'error',
} as const;

export const ClientEvents = {
  SESSION_CREATE: 'session:create',
  SESSION_RESUME: 'session:resume',
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_SPECTATE: 'room:spectate',
  ROOM_LEAVE: 'room:leave',
  ROOM_READY: 'room:ready',
  ROOM_START: 'room:start',
  CHAT_SEND: 'chat:send',
  GAME_INPUT: 'game:input',
} as const;

export const ErrorCodes = {
  INVALID_NAME: 'INVALID_NAME',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  SPECTATORS_FULL: 'SPECTATORS_FULL',
  ALREADY_IN_ROOM: 'ALREADY_IN_ROOM',
  NOT_HOST: 'NOT_HOST',
  NOT_READY: 'NOT_READY',
  GAME_IN_PROGRESS: 'GAME_IN_PROGRESS',
  INVALID_INPUT: 'INVALID_INPUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const;

/** 対戦結果レポート（個人識別情報を含まない） */
export interface BattleReport {
  schemaVersion: '1.0';
  roomId: string;
  roomName: string;
  startedAt: string;   // ISO 8601
  endedAt: string;     // ISO 8601
  winnerName: string;
  players: Array<{
    playerName: string;
    score: number;
    isWinner: boolean;
  }>;
}
