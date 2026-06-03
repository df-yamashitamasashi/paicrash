import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  sanitizeDisplayName,
  sanitizeRoomName,
  sanitizeChatMessage,
  RateLimiter,
  generateSessionToken,
  parseAllowedOrigins,
} from '../server/security';

// Feature: online-multiplayer

describe('SecurityModule Property-Based Tests', () => {
  // Property 1: sanitizeDisplayName の双方向性
  // 有効な入力（2〜16文字、制御文字・禁止記号なし）のみ非 null を返す
  test('Property 1: sanitizeDisplayName accepts valid names and rejects invalid ones', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 30 }), (s) => {
        const result = sanitizeDisplayName(s);
        const trimmed = s.trim().replace(/[\u0000-\u001F\u007F]/g, '');
        const hasInvalidChars = /[<>{}[\]\\]/.test(trimmed);
        const validLength = trimmed.length >= 2 && trimmed.length <= 16;

        if (validLength && !hasInvalidChars) {
          expect(result).not.toBeNull();
          expect(result).toBe(trimmed);
        } else {
          expect(result).toBeNull();
        }
      }),
      { numRuns: 1000 },
    );
  });

  // Property 2: sanitizeRoomName の双方向性
  // 有効な入力（2〜32文字、制御文字・禁止記号なし）のみ非 null を返す
  test('Property 2: sanitizeRoomName accepts valid names and rejects invalid ones', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 40 }), (s) => {
        const result = sanitizeRoomName(s);
        const trimmed = s.trim().replace(/[\u0000-\u001F\u007F]/g, '');
        const hasInvalidChars = /[<>{}[\]\\]/.test(trimmed);
        const validLength = trimmed.length >= 2 && trimmed.length <= 32;

        if (validLength && !hasInvalidChars) {
          expect(result).not.toBeNull();
        } else {
          expect(result).toBeNull();
        }
      }),
      { numRuns: 1000 },
    );
  });

  // Property 3: sanitizeChatMessage の双方向性
  // 有効な入力（1〜200文字、制御文字なし）のみ非 null を返す
  test('Property 3: sanitizeChatMessage accepts valid messages and rejects invalid ones', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 210 }), (s) => {
        const result = sanitizeChatMessage(s);
        const trimmed = s.trim().replace(/[\u0000-\u001F\u007F]/g, '');
        const validLength = trimmed.length >= 1 && trimmed.length <= 200;

        if (validLength) {
          expect(result).not.toBeNull();
        } else {
          expect(result).toBeNull();
        }
      }),
      { numRuns: 1000 },
    );
  });

  // Property 4: RateLimiter のウィンドウ内許可・超過拒否
  // maxEvents 回まで true、maxEvents+1 回目は false
  test('Property 4: RateLimiter allows up to maxEvents and blocks on maxEvents+1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1000, max: 60000 }),
        (maxEvents, windowMs) => {
          const limiter = new RateLimiter(maxEvents, windowMs);
          const key = 'test-key';

          for (let i = 0; i < maxEvents; i++) {
            expect(limiter.allow(key)).toBe(true);
          }
          expect(limiter.allow(key)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Property 5: generateSessionToken の一意性と形式
  // 64 文字小文字 16 進数、N 回生成で全て異なる
  test('Property 5: generateSessionToken produces unique 64-char hex strings', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 20 }), (n) => {
        const tokens = Array.from({ length: n }, () => generateSessionToken());

        // 全て 64 文字の小文字 16 進数
        for (const token of tokens) {
          expect(token).toMatch(/^[0-9a-f]{64}$/);
        }

        // 全て異なる（一意性）
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(n);
      }),
      { numRuns: 100 },
    );
  });

  // Property 13: parseAllowedOrigins の正確性
  // カンマ区切り解析・空文字除去・未定義時のデフォルト値
  test('Property 13: parseAllowedOrigins correctly parses comma-separated origins', () => {
    // 未定義・空文字列の場合はデフォルト値
    expect(parseAllowedOrigins(undefined)).toEqual(['http://localhost:3000', /^https:\/\/.*\.amplifyapp\.com$/]);
    expect(parseAllowedOrigins('')).toEqual(['http://localhost:3000', /^https:\/\/.*\.amplifyapp\.com$/]);
    expect(parseAllowedOrigins('   ')).toEqual(['http://localhost:3000', /^https:\/\/.*\.amplifyapp\.com$/]);

    fc.assert(
      fc.property(
        fc.array(
          fc.stringMatching(/^https?:\/\/[a-z0-9.-]+(:\d+)?$/),
          { minLength: 1, maxLength: 5 },
        ),
        (origins) => {
          const raw = origins.join(',');
          const result = parseAllowedOrigins(raw);

          // 空文字列の要素を含まない
          expect(result.every((o) => typeof o === 'string' ? o.length > 0 : true)).toBe(true);

          // 各オリジンがトリムされて含まれる
          for (const origin of origins) {
            expect(result).toContain(origin.trim());
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
