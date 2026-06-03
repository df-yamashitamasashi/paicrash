# 麻雀パズル — ドキュメント

本ディレクトリは `GEMINI.md.base` のドキュメント・ファースト方針に基づくプロジェクト仕様・設計・運用資料です。実装前に該当ドキュメントを確認し、仕様変更時は関連ファイルを更新してください。

## ドキュメント一覧

| ファイル | 内容 |
|----------|------|
| [project_definition.md](./project_definition.md) | サービス概要・価値仮説・ターゲット |
| [requirements.md](./requirements.md) | 機能要件・非機能要件・実装状況・バックログ |
| [system_architecture.md](./system_architecture.md) | システム構成・レイヤー・AWS インフラ・Socket.IO イベント一覧 |
| [basic_design.md](./basic_design.md) | 画面遷移・状態管理・ゲームルール・マルチプレイ設計・戦績レポート |
| [coding_conventions.md](./coding_conventions.md) | コーディング規約（`.cursor/rules/` と整合） |
| [development_progress.md](./development_progress.md) | 作業ログ（変更履歴・次アクション・バックログ） |
| [runbook.md](./runbook.md) | ローカル開発・AWS デプロイ・障害対応・監視手順 |

## スペック（詳細設計）

| パス | 内容 |
|------|------|
| [.kiro/specs/online-multiplayer/requirements.md](../.kiro/specs/online-multiplayer/requirements.md) | オンライン対戦機能の詳細要件（12 要件） |
| [.kiro/specs/online-multiplayer/design.md](../.kiro/specs/online-multiplayer/design.md) | AWS CDK 設計・WebSocket フロー・PBT プロパティ |
| [.kiro/specs/online-multiplayer/tasks.md](../.kiro/specs/online-multiplayer/tasks.md) | 実装タスク一覧（16 タスク） |

## 関連リソース

- ルート `GEMINI.md` — クイックリファレンス・主要ファイル
- `AGENTS.md` / `.cursor/rules/` — AI エージェント向け開発ルール
- `.cursor/rules/self-review.mdc` — 12 項目セルフレビュー・PR ゲート

## 更新ルール

1. **仕様変更** → `requirements.md` / `basic_design.md` を先に更新してから実装
2. **アーキテクチャ変更** → `system_architecture.md` を更新
3. **作業完了** → `development_progress.md` にログを追記
4. **大きな PR** → セルフレビュー結果をログに記録
5. **スペック変更** → `.kiro/specs/` と `docs/` の両方を更新
