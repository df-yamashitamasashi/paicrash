import { create } from 'zustand';
import type {
  ChatMessagePayload,
  GameOverPayload,
  MatchSnapshot,
  PublicRoom,
  PublicRoomListItem,
  RoomMemberRole,
} from './multiplayer-protocol';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'in-room'
  | 'playing'
  | 'spectating'
  | 'reconnecting';

export type { PublicRoom as Room, PublicRoomListItem, ChatMessagePayload as ChatMessage, RoomMemberRole };

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  score: number;
  isConnected: boolean;
}

interface MultiplayerState {
  status: ConnectionStatus;
  playerId: string | null;
  playerName: string;
  sessionToken: string | null;
  role: RoomMemberRole | null;
  error: string | null;
  isServerConnected: boolean;

  currentRoom: PublicRoom | null;
  availableRooms: PublicRoomListItem[];

  messages: ChatMessagePayload[];
  matchSnapshot: MatchSnapshot | null;
  lastGameOver: GameOverPayload | null;
  countdown: number | null;

  setPlayerName: (name: string) => void;
  setStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  setPlayerId: (id: string | null) => void;
  setSessionToken: (token: string | null) => void;
  setRole: (role: RoomMemberRole | null) => void;
  setServerConnected: (connected: boolean) => void;
  setCurrentRoom: (room: PublicRoom | null) => void;
  setAvailableRooms: (rooms: PublicRoomListItem[]) => void;
  addMessage: (message: ChatMessagePayload) => void;
  clearMessages: () => void;
  setMatchSnapshot: (snapshot: MatchSnapshot | null) => void;
  setLastGameOver: (payload: GameOverPayload | null) => void;
  setCountdown: (countdown: number | null) => void;
  reset: () => void;
}

const initialState = {
  status: 'disconnected' as ConnectionStatus,
  playerId: null,
  playerName: '',
  sessionToken: null,
  role: null as RoomMemberRole | null,
  error: null,
  isServerConnected: false,
  currentRoom: null,
  availableRooms: [] as PublicRoomListItem[],
  messages: [] as ChatMessagePayload[],
  matchSnapshot: null as MatchSnapshot | null,
  lastGameOver: null as GameOverPayload | null,
  countdown: null as number | null,
};

export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  ...initialState,

  setPlayerName: (name) => set({ playerName: name }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setPlayerId: (id) => set({ playerId: id }),
  setSessionToken: (token) => set({ sessionToken: token }),
  setRole: (role) => set({ role }),
  setServerConnected: (connected) => set({ isServerConnected: connected }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setAvailableRooms: (rooms) => set({ availableRooms: rooms }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-49), message],
    })),
  clearMessages: () => set({ messages: [] }),
  setMatchSnapshot: (snapshot) => set({ matchSnapshot: snapshot }),
  setLastGameOver: (payload) => set({ lastGameOver: payload }),
  setCountdown: (countdown) => set({ countdown }),
  reset: () => set(initialState),
}));

export const SESSION_STORAGE_KEY = 'paicrash.sessionToken';
