# 麻雀パズル — ドキュメント

本ディレクトリは `GEMINI.md.base` のドキュメント・ファースト方針に基づくプロジェクト仕様・設計・運用資料です。実装前に該当ドキュメントを確認し、仕様変更時は関連ファイルを更新してください。

## ドキュメント一覧

| ファイル | 内容 |
|----------|------|
| [project_definition.md](./project_definition.md) | サービス概要・価値仮説・ターゲット |
| [requirements.md](./requirements.md) | 機能要件・非機能要件・実装状況・バックログ |
| [system_architecture.md](./system_architecture.md) | システム構成・レイヤー・GCP インフラ・Firebase データフロー |
| [requirements.md](./requirements.md) | 機能 / 非機能要件・制約・優先バックログ |
| [basic_design.md](./basic_design.md) | UI 設計・コンポーネント構造・ドメインモデル |
| [coding_conventions.md](./coding_conventions.md) | Next.js / TypeScript 実装ルール・状態管理ルール |
| [runbook.md](./runbook.md) | ローカル開発・GCP デプロイ・障害対応・監視手順 |
| [development_progress.md](./development_progress.md) | 作業ログ・タスク進捗（AI へのコンテキスト引き継ぎ用） |

## 過去の仕様書（アーカイブ）

Socket.IO によるサーバー権威型マルチプレイに関する詳細仕様。

| ファイル | 説明 |
|---------|------|
| [.kiro/specs/online-multiplayer/requirements.md](../.kiro/specs/online-multiplayer/requirements.md) | オンライン対戦機能の詳細要件（12 要件） |
| [.kiro/specs/online-multiplayer/design.md](../.kiro/specs/online-multiplayer/design.md) | AWS CDK 設計・WebSocket フロー・PBT プロパティ (アーカイブ) |
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
