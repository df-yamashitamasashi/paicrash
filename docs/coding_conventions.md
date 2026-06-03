# コーディング規約

本ドキュメントは `.cursor/rules/` と整合する開発規約です。詳細は各ルールファイルを参照してください。

## 言語・ツール

- **TypeScript** `strict: true`
- **パッケージマネージャ**: pnpm（`npm` / `yarn` は使わない）
- **パスエイリアス**: `@/*` → リポジトリルート
- **Lint**: `pnpm lint`
- **型チェック**: `pnpm exec tsc --noEmit`

## ファイル・命名

| 種別 | 規約 | 例 |
|------|------|-----|
| コンポーネント | PascalCase、1 ファイル 1 コンポーネント | `game-board.tsx` → `GameBoard` |
| フック | `use-` プレフィックス | `use-multiplayer.ts` |
| ストア | `*-store.ts` | `game-store.ts` |
| 型・定数 | `mahjong-types.ts`, `yaku-data.ts` | ドメイン型は lib に集約 |

## TypeScript

- `any` および不要な型アサーションを避ける
- 共有型は `lib/mahjong-types.ts` に定義
- 牌の同一性は `areTilesEqual` / `getTileKey` を使用（独自比較を書かない）

## React / Next.js

- クライアントコンポーネントはファイル先頭に `'use client'`（必要なファイルのみ）
- ゲームロジックを UI に直書きしない → `lib/game-engine.ts` へ
- Zustand はセレクタで必要なスライスのみ購読:

```typescript
const status = useMultiplayerStore((s) => s.status);
```

- `components/ui/` は shadcn 系 — 依頼がない限り一括変更しない

## スタイル

- Tailwind CSS 4
- レスポンシブ: `md:` 等の既存ブレークポイントに合わせる
- ゲーム画面: タッチ領域・文字サイズをモバイル向けに確保

## ゲームドメイン

- ボード定数変更時は UI（`game-board.tsx`）との整合を確認
- 役追加・変更: `yaku-data.ts` + `game-engine.ts` + `yaku-guide.tsx`
- ランダム ID: 既存パターン `Date.now()` + random を踏襲

## マルチプレイ

- 本番想定: 固定モックルーム・常に成功する偽同期は作らない
- 未接続時は明示的エラー・再接続 UI
- 秘密情報（トークン）をクライアントにハードコードしない
- シングル（`game-store`）とマルチ（`multiplayer-store`）の状態混線に注意

## Git・PR

- Conventional Commits 推奨（`feat:`, `fix:`, `docs:` 等）
- PR 前: `pnpm lint`、該当範囲の手動テスト、`@self-review` 参照
- 仕様変更時は `docs/` を同 PR で更新

## 作業レベル

- 指示がない限り MVP / PoC / ダミーデータ実装を避ける
- 依頼範囲外のリファクタ・依存追加はしない
- ユーザー向け文言・コミット案は日本語

## 参照

- `.cursor/rules/00-core.mdc`
- `.cursor/rules/typescript-react.mdc`
- `.cursor/rules/mahjong-game.mdc`
- `.cursor/rules/multiplayer.mdc`
- `.cursor/rules/self-review.mdc`
