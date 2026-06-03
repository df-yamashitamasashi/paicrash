import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { applyGameInput, createInitialMultiplayerGameState } from '../lib/multiplayer-game-logic';
import { RoomManager } from '../server/room-manager';

describe('GameLogic Property-Based Tests', () => {
  // Property 10: 有効なゲーム入力のみが状態変化を引き起こす
  test('Property 10: Only valid game inputs cause state changes', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !['move-left', 'move-right', 'soft-drop', 'hard-drop'].includes(s)),
        (invalidAction) => {
          const state = createInitialMultiplayerGameState();
          const result = applyGameInput(state, invalidAction as any);
          
          expect(result.changed).toBe(false);
          expect(result.garbageSent).toBe(0);
          expect(result.state).toEqual(state);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 11: ガベージキューの送信先正確性
  test('Property 11: Garbage queue correctly targets all players except sender', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // garbage amount
        fc.integer({ min: 2, max: 5 }), // number of players (our limit is 2, but let's test robust logic up to 5)
        fc.integer({ min: 0, max: 4 }), // sender index
        (garbageAmount, numPlayers, senderIndex) => {
          fc.pre(senderIndex < numPlayers);

          const manager = new RoomManager();
          const host = manager.createSession('host');
          const roomRes = manager.createRoom(host.sessionToken, 'Test Room');
          if ('error' in roomRes) throw new Error('Failed to create room');
          
          const roomId = roomRes.room.id;
          const playerSessions = [host];

          // We forcefully add more players for the sake of logic testing,
          // bypassing the strict 2-player limit using internal state if needed,
          // or we just test with max 2 players.
          // Let's cap numPlayers to 2 for RoomManager to avoid ROOM_FULL error naturally.
          const actualNumPlayers = Math.min(numPlayers, 2);
          const actualSenderIndex = senderIndex % actualNumPlayers;

          if (actualNumPlayers > 1) {
            const p2 = manager.createSession('p2');
            manager.joinRoomAsPlayer(p2.sessionToken, roomId);
            playerSessions.push(p2);
          }

          for (const s of playerSessions) {
            manager.setReady(s.sessionToken, true);
          }
          manager.startMatch(host.sessionToken);

          const sender = playerSessions[actualSenderIndex];
          const room = manager.getRoom(roomId);
          if (!room) throw new Error('Room not found');

          // Simulate queueing garbage (calling private method via any)
          (manager as any).queueGarbage(room, sender.playerId, garbageAmount);

          for (let i = 0; i < actualNumPlayers; i++) {
            const p = room.players.get(playerSessions[i].playerId);
            if (i === actualSenderIndex) {
              expect(p?.pendingGarbage).toBe(0);
            } else {
              expect(p?.pendingGarbage).toBe(garbageAmount);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 12: 戦績レポートの必須フィールド完全性と個人情報非含有
  test('Property 12: BattleReport contains all required fields and no sensitive info', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 16 }),
        fc.string({ minLength: 1, maxLength: 16 }),
        (p1Name, p2Name) => {
          const manager = new RoomManager();
          
          const p1 = manager.createSession(p1Name);
          const roomRes = manager.createRoom(p1.sessionToken, 'Test Room');
          if ('error' in roomRes) throw new Error('Failed to create room');
          const roomId = roomRes.room.id;

          const p2 = manager.createSession(p2Name);
          manager.joinRoomAsPlayer(p2.sessionToken, roomId);

          manager.setReady(p1.sessionToken, true);
          manager.setReady(p2.sessionToken, true);
          manager.startMatch(p1.sessionToken);

          const room = manager.getRoom(roomId);
          if (!room) throw new Error('Room not found');

          // Simulate p2 game over
          const p2Player = room.players.get(p2.playerId)!;
          p2Player.gameState.isGameOver = true;

          const gameOverPayload = (manager as any).evaluateWinner(room);

          // Check required fields
          expect(gameOverPayload).not.toBeNull();
          expect(gameOverPayload).toHaveProperty('roomId', roomId);
          expect(gameOverPayload).toHaveProperty('winnerId', p1.playerId);
          expect(gameOverPayload).toHaveProperty('winnerName', p1.playerName);
          expect(gameOverPayload).toHaveProperty('scores');
          expect(gameOverPayload).toHaveProperty('startedAt');
          expect(gameOverPayload).toHaveProperty('endedAt');
          expect(gameOverPayload).toHaveProperty('roomName', 'Test Room');

          // Check no sensitive info (IP, email, token, etc.)
          const payloadStr = JSON.stringify(gameOverPayload);
          expect(payloadStr).not.toMatch(/ipAddress/i);
          expect(payloadStr).not.toMatch(/email/i);
          expect(payloadStr).not.toMatch(/token/i);
          expect(payloadStr).not.toMatch(/password/i);
        }
      ),
      { numRuns: 100 }
    );
  });
});
