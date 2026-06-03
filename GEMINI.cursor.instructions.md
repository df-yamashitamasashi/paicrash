# GEMINI — Cursor エージェント指示

> **推奨**: ルールは `.cursor/rules/*.mdc` に移行済みです。Cursor Agent はこちらを自動読み込みします。
> 概要のみ必要な場合はルートの `AGENTS.md` を参照してください。

## ルール一覧

| ファイル | 種別 | 内容 |
|----------|------|------|
| `.cursor/rules/00-core.mdc` | 常時適用 | プロジェクト概要・本番品質・pnpm・エージェント振る舞い |
| `.cursor/rules/typescript-react.mdc` | ファイル自動 | TS/React/Next.js 規約 |
| `.cursor/rules/mahjong-game.mdc` | ファイル自動 | ゲームエンジン・牌・役 |
| `.cursor/rules/multiplayer.mdc` | ファイル自動 | マルチプレイ・同期 |
| `.cursor/rules/self-review.mdc` | 手動 / 智能 | 12項目レビュー・PR ゲート（`@self-review`） |

## 参照ドキュメント

- `GEMINI.md` — プロジェクト固有の概要・主要ファイル
- `GEMINI.md.base` — 高品質開発テンプレート（12項目・ドキュメントファースト等）

## このファイルの位置づけ

過去の Cursor 向け単一指示書です。内容は `.cursor/rules/00-core.mdc` に統合されています。編集は `.mdc` 側を優先してください。
