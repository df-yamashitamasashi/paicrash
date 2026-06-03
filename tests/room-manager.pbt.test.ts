import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { RoomManager } from '../server/room-manager';
import { ErrorCodes } from '../lib/multiplayer-protocol';

describe('RoomManager Property-Based Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  // Property 6: セッション TTL クリーンアップの正確性
  test('Property 6: Session TTL cleanup correctly removes only stale and disconnected sessions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 * 24 * 60 * 60 * 1000 }), // Elapsed time
        fc.boolean(), // Is the socket connected?
        (elapsedMs, isConnected) => {
          const manager = new RoomManager();
          const session = manager.createSession('test-player');

          if (isConnected) {
            manager.bindSocket(session.sessionToken, 'socket-1');
          }

          // Advance time
          vi.advanceTimersByTime(elapsedMs);

          // Run cleanup
          manager.cleanupStaleSessions();

          const TTL_MS = 24 * 60 * 60 * 1000;
          const isStale = elapsedMs > TTL_MS;

          // Retrieve without updating lastSeenAt
          // We can't access private members, so we'll check via getSessionByToken.
          // Note: getSessionByToken updates lastSeenAt! But that's okay for testing existence.
          const retrieved = manager.getSessionByToken(session.sessionToken);

          if (isStale && !isConnected) {
            // Should be cleaned up
            expect(retrieved).toBeNull();
          } else {
            // Should NOT be cleaned up
            expect(retrieved).not.toBeNull();
            if (retrieved) {
              expect(retrieved.sessionToken).toBe(session.sessionToken);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 7: ルームプレイヤー上限の強制
  test('Property 7: Room player limit enforcement (max 2 players)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // Extra players trying to join
        (extraPlayers) => {
          const manager = new RoomManager();
          const hostSession = manager.createSession('host');
          const roomRes = manager.createRoom(hostSession.sessionToken, 'Test Room');
          
          if ('error' in roomRes) throw new Error('Failed to create room');
          const roomId = roomRes.room.id;

          const player2Session = manager.createSession('p2');
          manager.joinRoomAsPlayer(player2Session.sessionToken, roomId);

          // Now the room is full (2 players).

          for (let i = 0; i < extraPlayers; i++) {
            const extraSession = manager.createSession(`extra-${i}`);
            const result = manager.joinRoomAsPlayer(extraSession.sessionToken, roomId);
            expect(result).toHaveProperty('error', ErrorCodes.ROOM_FULL);
          }

          const room = manager.getRoom(roomId);
          expect(room?.players.size).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 8: 観戦者上限の強制
  test('Property 8: Spectator limit enforcement (max 20 spectators)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }), // Extra spectators trying to join
        (extraSpectators) => {
          const manager = new RoomManager();
          const hostSession = manager.createSession('host');
          const roomRes = manager.createRoom(hostSession.sessionToken, 'Test Room');
          
          if ('error' in roomRes) throw new Error('Failed to create room');
          const roomId = roomRes.room.id;

          // Fill up to maxSpectators (20 by default)
          const MAX_SPECTATORS = 20;
          for (let i = 0; i < MAX_SPECTATORS; i++) {
            const specSession = manager.createSession(`spec-${i}`);
            manager.joinRoomAsSpectator(specSession.sessionToken, roomId);
          }

          for (let i = 0; i < extraSpectators; i++) {
            const extraSession = manager.createSession(`extra-spec-${i}`);
            const result = manager.joinRoomAsSpectator(extraSession.sessionToken, roomId);
            expect(result).toHaveProperty('error', ErrorCodes.SPECTATORS_FULL);
          }

          const room = manager.getRoom(roomId);
          expect(room?.spectators.size).toBe(MAX_SPECTATORS);
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property 9: 権限なしプレイヤーからのゲーム入力拒否
  test('Property 9: Game input rejected from unauthorized players or unstarted states', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // true if actor is spectator, false if actor is player
        fc.boolean(), // true if trying to apply input when game is unstarted
        (isSpectator, attemptBeforeStart) => {
          fc.pre(isSpectator || attemptBeforeStart);

          const manager = new RoomManager();
          const hostSession = manager.createSession('host');
          const roomRes = manager.createRoom(hostSession.sessionToken, 'Test Room');
          
          if ('error' in roomRes) throw new Error('Failed to create room');
          const roomId = roomRes.room.id;

          let actorSessionToken = hostSession.sessionToken;

          if (isSpectator) {
            const specSession = manager.createSession('spectator');
            manager.joinRoomAsSpectator(specSession.sessionToken, roomId);
            actorSessionToken = specSession.sessionToken;
          }

          // Try to apply input
          const result = manager.applyPlayerInput(actorSessionToken, 'move-left');
          
          expect(result).toHaveProperty('error', ErrorCodes.UNAUTHORIZED);

          // Verify state did not change to started
          const room = manager.getRoom(roomId);
          expect(room?.isStarted).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
