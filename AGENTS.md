# AI エージェント向けガイド（paijang / 麻雀パズル）

Cursor は `.cursor/rules/*.mdc` を優先して読み込みます。詳細は各ルールファイルを参照してください。

## クイックリファレンス

| ルール | 適用 |
|--------|------|
| `00-core.mdc` | 常時（プロジェクト概要・品質・pnpm・振る舞い） |
| `typescript-react.mdc` | `app/`, `components/`, `hooks/`, `lib/` の TS/TSX |
| `mahjong-game.mdc` | ゲームエンジン・牌・役・`components/game/` |
| `multiplayer.mdc` | マルチプレイ関連 |
| `self-review.mdc` | `@self-review` または大きな変更の完了前 |

## 人間向けドキュメント

- `GEMINI.md` — プロジェクト概要・主要ファイル・実行方法
- `GEMINI.md.base` — 高品質開発のテンプレート（12項目レビュー等）
- `GEMINI.cursor.instructions.md` — Cursor 向け補足（レガシー参照用）

## 開発

```bash
pnpm install && pnpm dev
```
