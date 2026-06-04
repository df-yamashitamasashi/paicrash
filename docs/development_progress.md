# 作業ログ（development_progress）

大きな変更・機能追加のたびにエントリを追記してください。セルフレビューは `.cursor/rules/self-review.mdc` の 12 項目に準拠します。

---

## テンプレート（コピー用）

```
### YYYY-MM-DD — <タスクタイトル>

- **担当**: <名前>
- **概要**: <目的とスコープ>
- **変更ファイル**:
  - <path>
- **セルフレビュー**: 1 pass, 2 pass, …（fail 項目はコメント）
- **次のアクション**: <TODO>
```

---

## ログ

### 2026-05-31 — Cursor 用開発ルール整備

- **担当**: AI エージェント
- **概要**: `GEMINI.md` / `GEMINI.md.base` を基に `.cursor/rules/` と `AGENTS.md` を整備。本番品質・pnpm・ディレクトリ責務・12 項目レビューをプロジェクト向けに反映。
- **変更ファイル**:
  - `.cursor/rules/00-core.mdc`
  - `.cursor/rules/typescript-react.mdc`
  - `.cursor/rules/mahjong-game.mdc`
  - `.cursor/rules/multiplayer.mdc`
  - `.cursor/rules/self-review.mdc`
  - `AGENTS.md`
  - `GEMINI.cursor.instructions.md`
- **セルフレビュー**: 6 pass（lint/tsc 対象外のドキュメント変更）
- **次のアクション**: `docs/` 整備、マルチプレイ本番化

---

### 2026-05-31 — docs/ ドキュメント整備

- **担当**: AI エージェント
- **概要**: `GEMINI.md.base` 必須ドキュメント構成に沿い、プロジェクト実態（シングル実装済・マルチモック・収益化未着手）を反映した `docs/` を新規作成。
- **変更ファイル**:
  - `docs/README.md`
  - `docs/project_definition.md`
  - `docs/requirements.md`
  - `docs/system_architecture.md`
  - `docs/basic_design.md`
  - `docs/coding_conventions.md`
  - `docs/development_progress.md`
  - `docs/runbook.md`
- **セルフレビュー**: 1 pass, 2 pass, 6 pass
- **次のアクション**: マルチプレイ Socket.IO サーバー設計・実装

---

### 2026-05-31 — マルチプレイ本番化（対戦・観戦・セキュリティ）

- **担当**: AI エージェント
- **概要**: Socket.IO サーバーを新設し、サーバー権威の対戦同期・観戦（最大20人）・セッション認証・レート制限を実装。クライアントのモック同期を撤去。
- **変更ファイル**:
  - `server/index.ts`, `server/room-manager.ts`, `server/security.ts`
  - `lib/multiplayer-protocol.ts`, `lib/multiplayer-game-logic.ts`
  - `lib/multiplayer-store.ts`, `hooks/use-multiplayer.ts`
  - `components/game/multiplayer-lobby.tsx`, `multiplayer-game.tsx`, `game-controls.tsx`
  - `app/page.tsx`, `package.json`, `.env.example`
- **セルフレビュー**: セキュリティ・サーバー権威・レート制限・CORS を確認
- **次のアクション**: AWS CDK インフラ、Dockerfile、CI/CD、戦績レポート UI、テスト

---

### 2026-06-01 — ゲームロジック改善（消去ルール・演出・履歴）

- **担当**: AI エージェント
- **概要**: 連番消去の重複バグ修正、消去演出（アニメーション2段階）、消去履歴UIの追加、レベルアップロジックの実装。
- **変更ファイル**:
  - `lib/game-engine.ts` — `findClearableGroups` 重複排除、`findSequenceGroups` 新設、`clearTiles` 2段階化、`removeClearedTiles` 追加
  - `lib/game-store.ts` — 2段階消去処理、レベルアップロジック
  - `lib/multiplayer-game-logic.ts` — レベルアップロジック
  - `lib/mahjong-types.ts` — `ClearResult.timestamp` 追加
  - `components/game/clear-history.tsx` — 新規作成（消去履歴UI）
  - `components/game/game-stats.tsx` — `clearHistory` props 追加
  - `components/game/single-player.tsx` — `clearHistory` 渡し
  - `app/globals.css` — `tile-clear` アニメーション強化
- **セルフレビュー**: 消去重複バグの根本修正（位置ベース重複排除）を確認
- **次のアクション**: AWS CDK インフラ構築（tasks #1〜#7）

---

### 2026-06-01 — オンライン対戦スペック作成（requirements + design + tasks）

- **担当**: AI エージェント
- **概要**: `.kiro/specs/online-multiplayer/` に requirements.md・design.md・tasks.md を作成。AWS CDK による本番インフラ設計、CI/CD、戦績レポート、PBT テスト計画を含む。
- **変更ファイル**:
  - `.kiro/specs/online-multiplayer/requirements.md` — 12 要件（匿名セッション・ルーム・対戦・観戦・チャット・環境切替・セキュリティ・戦績・AWS・スケール・CI/CD・サーバー権威）
  - `.kiro/specs/online-multiplayer/design.md` — システム構成・CDK スタック設計・Dockerfile・GitHub Actions・PBT 13 プロパティ
  - `.kiro/specs/online-multiplayer/tasks.md` — 16 タスク（コンテナ化・CDK・CI/CD・戦績UI・テスト）
  - `docs/system_architecture.md` — AWS 本番構成・CDK スタック・イベント一覧を反映
  - `docs/requirements.md` — NFR-6（インフラ・運用）追加、バックログ更新
  - `docs/basic_design.md` — 戦績レポート・エラーコード・マルチプレイ設計を更新
  - `docs/runbook.md` — AWS デプロイ手順・CDK コマンド・監視を追加
  - `docs/development_progress.md` — 本エントリ追加
- **セルフレビュー**: 要件・設計・タスクの整合性を確認
- **次のアクション**: tasks.md の各タスクを順次実装（Wave 1 から開始）

---

### 2026-06-04 — スマホ画面で履歴を確認できない問題の解消

- **担当**: AI エージェント
- **概要**: モバイルのコンパクト画面で省略されていた消去履歴（clearHistory）を確認できるよう、共通の引き出し式UI（Bottom Sheet Drawer）である `HistoryDialog` を実装。さらに、ボトムシート表示時にゲーム盤面がシートの裏に隠れるのを防ぐため、履歴を開いた際にゲーム盤面コンテナに自動的に `pb-[30dvh]` のパディングを加え、盤面全体を画面上部にスムーズにシフトさせるアニメーション（transition-all）を実装。また、成立数が多くなると `30vh` の高さでは履歴が見切れてしまうため、右上の拡大/縮小ボタンでシート高さを `30vh`（最小化して盤面が見える状態）と `80vh`（最大化して履歴をじっくりスクロール確認できる状態）でトグル切り替えできる拡張機構を追加。
- **変更ファイル**:
  - `components/ui/drawer.tsx` (DrawerContentにカスタムの背景色調整用 `overlayClassName` プロップスを追加)
  - `components/game/clear-history.tsx` (タップによる牌ハイライトのために `onClick` イベントを追加、関数・Rowコンポーネントをexport)
  - `components/game/history-dialog.tsx` (非モーダル化 `modal={false}` の設定、高さのトグル切り替え機能 `isExpanded` (30vh⇔80vh) の実装、拡大/縮小ボタンおよび閉じるボタンの追加)
  - `components/game/game-controls.tsx` (モバイルコントロールに履歴ボタン追加)
  - `components/game/single-player.tsx` (履歴表示時にゲーム盤面を上方にシフトさせる padding アニメーションの追加)
  - `components/game/cpu-game.tsx` (履歴表示時にゲーム盤面を上方にシフトさせる padding アニメーションの追加)
  - `components/game/multiplayer-game.tsx` (履歴表示時にゲーム盤面を上方にシフトさせる padding アニメーションの追加)
- **セルフレビュー**: 1 pass, 3 pass, 6 pass, 10 pass, 11 pass, 12 pass
- **次のアクション**: バックログのタスク消化

---

## バックログ（未着手）

| 優先 | タスク | 関連 |
|------|--------|------|
| P1 | tsconfig.server.json + Dockerfile | tasks #1, #2 |
| P1 | CDK InfraStack（VPC, ECR, ACM, WAF） | tasks #3, #4 |
| P1 | CDK AppStack（ECS, ALB, CloudWatch） | tasks #5, #6 |
| P1 | GitHub Actions CI/CD | tasks #7 |
| P1 | 戦績レポート UI | tasks #8〜#10 |
| P1 | .env.example 更新 | tasks #11 |
| P2 | vitest + fast-check テスト | tasks #12〜#16 |
| P2 | 広告・収益化フロー設計 | requirements FR-5 |
| P3 | モバイル UX / A11y 改善 | requirements NFR-4 |
| P3 | TS ビルド厳格化 | requirements NFR-5.3 |
