# Implementation Plan

## Overview

paijang オンライン対戦機能のデプロイ・インフラ・テスト・UI 拡張に関する実装タスク一覧。
コンテナ化（タスク 1〜2）→ AWS CDK インフラ（タスク 3〜6）→ CI/CD（タスク 7）→ 戦績レポート UI（タスク 8〜10）→ 環境変数ドキュメント（タスク 11）→ テスト（タスク 12〜16）の順で実装する。

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1, 3, 8, 11, 12] },
    { "wave": 2, "tasks": [2, 4, 9, 13, 14, 15] },
    { "wave": 3, "tasks": [5, 6, 10] },
    { "wave": 4, "tasks": [7, 16] }
  ]
}
```

## Tasks

- [x] 1. tsconfig.server.json 作成
  - サーバー専用 TypeScript 設定ファイルを作成する（module: commonjs, target: ES2022）
  - `extends` で既存の tsconfig.json を継承し、`include` に `server/**/*` と `lib/**/*` を指定する
  - `outDir: "dist"`, `rootDir: "."` を設定する
  - _Requirements: 11.1, 11.2_

- [x] 2. Dockerfile 作成
  - マルチステージビルドで builder ステージと runner ステージを定義する
  - builder ステージ: `node:22-alpine` ベース、pnpm で全依存関係インストール後 `tsc --project tsconfig.server.json` でコンパイル
  - runner ステージ: `pnpm install --frozen-lockfile --prod` で本番依存のみインストール、builder の `dist/` をコピー
  - 非 root ユーザー（appuser/appgroup）を作成して `USER appuser` で実行する
  - `ENV NODE_ENV=production PORT=3001`、`EXPOSE 3001`、`CMD ["node", "dist/server/index.js"]` を設定する
  - _Requirements: 11.1, 11.2_
  - _Depends on: 1_

- [x] 3. CDK プロジェクト初期化
  - `cdk/` ディレクトリを作成し、`package.json`（aws-cdk-lib, constructs 等の依存関係）を追加する
  - `cdk/tsconfig.json` を作成する（module: commonjs, target: ES2022）
  - `cdk/cdk.json` を作成する（app エントリポイント指定）
  - `cdk/bin/app.ts` を作成し、InfraStack と AppStack をインスタンス化する CDK App エントリポイントを実装する
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. InfraStack 実装
  - `cdk/lib/infra-stack.ts` を作成する
  - VPC を実装する（パブリックサブネット 2AZ、`natGateways: 0` でコスト削減）
  - ECR リポジトリ `paijang-server` を実装する（`removalPolicy: RETAIN`）
  - ACM 証明書を実装する（DNS 検証、ALB と同リージョン）
  - 環境変数 `ENABLE_WAF=true` の場合のみ WAF WebACL を実装する（IP レート制限 + AWSManagedRulesCommonRuleSet）
  - VPC・ECR・ACM・WAF を他スタックから参照できるよう `public readonly` プロパティとして公開する
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 7.5, 7.6, 10.6_
  - _Depends on: 3_

- [x] 5. AppStack 実装
  - `cdk/lib/app-stack.ts` を作成する
  - ECS Cluster を実装し、環境変数 `USE_FARGATE_SPOT=true` の場合は `capacityProviders: ['FARGATE_SPOT']` を追加する
  - Fargate タスク定義（0.25 vCPU / 512 MB）を実装し、ECR リポジトリからコンテナイメージを参照、`PORT` 等環境変数を設定する
  - Fargate Service（`desiredCount: 1`、`assignPublicIp: true`）を実装する（Spot 利用時は `capacityProviderStrategies` を設定）
  - ALB（インターネット向け）と HTTPS リスナー（443）を実装する
  - ターゲットグループに WebSocket stickiness（1 時間）とヘルスチェック（`/`）を設定する
  - 環境変数 `ENABLE_WAF=true` の場合のみ、`CfnWebACLAssociation` で WAF を ALB にアタッチする
  - CloudWatch Alarm（メモリ使用率 > 80%、評価期間 2 回）を実装する
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 7.5, 7.6, 10.6_
  - _Depends on: 4_

- [x] 6. OIDC IAM ロール実装
  - `cdk/lib/infra-stack.ts`（または専用ファイル）に GitHub Actions 用 OIDC プロバイダーを追加する
  - `OpenIdConnectProvider`（URL: `https://token.actions.githubusercontent.com`）を作成する
  - `WebIdentityPrincipal` で `main` ブランチのみを許可する条件付き IAM ロール `GitHubActionsRole` を作成する
  - `AmazonEC2ContainerRegistryPowerUser` マネージドポリシーをアタッチする
  - `ecs:UpdateService` に限定した最小権限インラインポリシーを追加する
  - _Requirements: 11.4_
  - _Depends on: 4_

- [x] 7. GitHub Actions デプロイワークフロー作成
  - `.github/workflows/deploy.yml` を作成する
  - トリガーを `push: branches: [main]` に設定し、`permissions: id-token: write, contents: read` を付与する
  - pnpm セットアップ → `pnpm install` → `tsc --noEmit`（型チェック）→ `pnpm lint` の順でステップを定義する
  - `aws-actions/configure-aws-credentials@v4` で OIDC 認証（`role-to-assume` に `GitHubActionsRole` の ARN）を設定する
  - `aws-actions/amazon-ecr-login@v2` → Docker ビルド → ECR プッシュ（`${{ github.sha }}` タグ + `latest` タグ）のステップを実装する
  - `aws ecs update-service --force-new-deployment` で ECS サービスを強制デプロイするステップを追加する
  - _Requirements: 11.3, 11.4, 11.5_
  - _Depends on: 2, 5, 6_

- [x] 8. BattleReport 型定義追加
  - `lib/multiplayer-protocol.ts` に `BattleReport` インターフェースを追加する
  - フィールド: `schemaVersion: "1.0"`, `roomId`, `roomName`, `startedAt`（ISO 8601）, `endedAt`（ISO 8601）, `winnerName`, `players`（`playerName`, `score`, `isWinner` の配列）
  - 個人識別情報（IP アドレス・メールアドレス等）を含まない設計とする
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 9. GameOverPayload 拡張と match:ended ペイロード更新
  - `lib/multiplayer-protocol.ts` の `GameOverPayload` インターフェースに `startedAt: number`, `endedAt: number`, `roomName: string` フィールドを追加する
  - `server/room-manager.ts` の `evaluateWinner()` メソッドで `startedAt`（`room.startedAt`）と `endedAt`（`Date.now()`）と `roomName`（`room.name`）を `GameOverPayload` に含めるよう修正する
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - _Depends on: 8_

- [x] 10. レポートダウンロード UI 実装
  - `components/game/multiplayer-game.tsx` で `match:ended` イベント受信後に `GameOverPayload` を状態として保持する
  - 対戦終了後の画面に「レポートをダウンロード」ボタンを表示する
  - ボタンクリック時に `BattleReport` オブジェクトをクライアントサイドで生成し、`JSON.stringify` で JSON 化する
  - `URL.createObjectURL` と `<a download>` を使ってブラウザのダウンロード機能でファイルを保存する
  - ファイル名を `paijang-battle-{roomId}-{YYYYMMDD}.json` 形式とする
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - _Depends on: 9_

- [x] 11. .env.example 更新
  - `.env.example` に `NEXT_PUBLIC_SOCKET_URL`、`PORT`、`ALLOWED_ORIGINS`、および CDK デプロイ用の `ENABLE_WAF`、`USE_FARGATE_SPOT` を追加する
  - 各変数にローカル開発用のサンプル値と用途説明をコメントで記載する（例: `# Socket.IO サーバーの接続先 URL`）
  - LAN 環境・AWS 環境での設定例もコメントで補足する
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 12. テスト環境セットアップ
  - `vitest` と `fast-check` を devDependencies に追加する（`pnpm add -D vitest fast-check`）
  - `vitest.config.ts` をプロジェクトルートに作成する（`environment: 'node'`, `globals: true` 等を設定）
  - `package.json` の `scripts` に `"test": "vitest run"` と `"test:watch": "vitest"` を追加する
  - テストファイルの配置ディレクトリ（例: `tests/` または `__tests__/`）を決定し、設定に反映する
  - _Requirements: 7.2, 7.3, 1.8, 3.3, 5.3, 2.3, 4.1, 4.5, 12.2, 12.4, 3.6_

- [x] 13. SecurityModule プロパティベーステスト実装
  - `tests/security.pbt.test.ts` を作成する
  - Property 1: `sanitizeDisplayName` の双方向性（有効な入力のみ非 null を返す）を fast-check で検証する
  - Property 2: `sanitizeRoomName` の双方向性（2〜32 文字・禁止文字なし）を fast-check で検証する
  - Property 3: `sanitizeChatMessage` の双方向性（1〜200 文字・制御文字なし）を fast-check で検証する
  - Property 4: `RateLimiter` のウィンドウ内許可・超過拒否（maxEvents 回まで true、maxEvents+1 回目は false）を fast-check で検証する
  - Property 5: `generateSessionToken` の一意性と形式（64 文字小文字 16 進数、N 回生成で全て異なる）を fast-check で検証する
  - Property 13: `parseAllowedOrigins` の正確性（カンマ区切り解析・空文字除去・未定義時のデフォルト値）を fast-check で検証する
  - _Requirements: 7.2, 7.3, 1.8, 3.3, 5.3_
  - _Depends on: 12_

- [x] 14. RoomManager プロパティベーステスト実装
  - `tests/room-manager.pbt.test.ts` を作成する
  - Property 6: セッション TTL クリーンアップの正確性（`lastSeenAt + TTL < now` かつ未接続のセッションのみ削除）を fast-check で検証する
  - Property 7: ルームプレイヤー上限の強制（2 人満員時の 3 人目参加で `ROOM_FULL` エラー、プレイヤー数不変）を fast-check で検証する
  - Property 8: 観戦者上限の強制（20 人満員時の 21 人目参加で `SPECTATORS_FULL` エラー、観戦者数不変）を fast-check で検証する
  - Property 9: 権限なしプレイヤーからのゲーム入力拒否（role が `player` でない・対戦未開始時に `UNAUTHORIZED` エラー、状態不変）を fast-check で検証する
  - _Requirements: 2.3, 4.1, 4.5, 12.4_
  - _Depends on: 12_

- [x] 15. GameLogic プロパティベーステスト実装
  - `tests/game-logic.pbt.test.ts` を作成する
  - Property 10: 有効なゲーム入力のみが状態変化を引き起こす（無効な action 文字列で `changed: false`、状態不変）を fast-check で検証する
  - Property 11: ガベージキューの送信先正確性（`fromPlayerId` 以外の全プレイヤーのキューが `amount` 増加、自身は不変）を fast-check で検証する
  - Property 12: 戦績レポートの必須フィールド完全性と個人情報非含有（`BattleReport` の全必須フィールド存在・IP 等の個人情報なし）を fast-check で検証する
  - _Requirements: 12.2, 3.6, 8.1, 8.5, 8.6_
  - _Depends on: 12_

- [x] 16. CDK スナップショットテスト実装
  - `cdk/test/infra-stack.test.ts` と `cdk/test/app-stack.test.ts` を作成する
  - WAF ルールの検証: `ENABLE_WAF=true` の場合にのみ `AWS::WAFv2::WebACL` が存在することを確認する
  - Spot の検証: `USE_FARGATE_SPOT=true` の場合に `CapacityProviderStrategy` が設定されることを確認する
  - ECS メモリアラームの検証: `AWS::CloudWatch::Alarm` の `Threshold: 80` を確認する
  - ALB HTTPS リスナーの検証: `AWS::ElasticLoadBalancingV2::Listener` の `Port: 443` と `Protocol: HTTPS` を確認する
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 7.5, 7.6, 10.6_
  - _Depends on: 5_

## Notes

- タスク 1〜2 はコンテナ化グループ。tsconfig.server.json が Dockerfile のビルドステップで必要なため順序を守ること。
- タスク 3〜6 は AWS CDK インフラグループ。CDK プロジェクト初期化（タスク 3）が全 CDK タスクの前提となる。
- タスク 7 の GitHub Actions ワークフローは Dockerfile（タスク 2）・AppStack（タスク 5）・OIDC ロール（タスク 6）が揃ってから作成する。
- タスク 8〜10 は戦績レポート UI グループ。型定義（タスク 8）→ サーバー側ペイロード拡張（タスク 9）→ クライアント UI（タスク 10）の順で実装する。
- タスク 12〜15 のプロパティベーステストは vitest + fast-check のセットアップ（タスク 12）完了後に並行して実装できる。
- タスク 16 の CDK スナップショットテストは AppStack（タスク 5）の実装完了後に実施する。
- PBT（プロパティベーステスト）タスク: タスク 13, 14, 15
