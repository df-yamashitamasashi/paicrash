# Runbook

麻雀パズルのローカル開発・障害対応・デプロイ手順です。

---

## 前提

- Node.js 22 以上推奨
- pnpm がインストール済みであること
- AWS CLI（本番デプロイ時）

---

## ローカル開発

```bash
# 初回
pnpm install

# ターミナル1: リアルタイムサーバー（対戦・観戦に必須）
pnpm dev:server   # tsx watch server/index.ts

# ターミナル2: フロント（http://localhost:3000）
pnpm dev

# 本番ビルド
pnpm build
pnpm start

# 品質チェック
pnpm lint
pnpm exec tsc --noEmit

# テスト（実装後）
pnpm test
```

`.env.local` に `NEXT_PUBLIC_SOCKET_URL` を設定（`.env.example` 参照）。

---

## 環境変数

| 変数名 | スコープ | ローカル値 | 説明 |
|--------|---------|-----------|------|
| `NEXT_PUBLIC_SOCKET_URL` | Client | `http://localhost:3001` | Socket.IO サーバーの接続先 URL |
| `PORT` | Server | `3001` | サーバーのリッスンポート |
| `ALLOWED_ORIGINS` | Server | `http://localhost:3000` | CORS 許可オリジン（カンマ区切り） |

### ローカル LAN 環境（同一ネットワーク内）

```bash
# LAN IP が 192.168.1.10 の場合
NEXT_PUBLIC_SOCKET_URL=http://192.168.1.10:3001
ALLOWED_ORIGINS=http://192.168.1.10:3000,http://192.168.1.11:3000
```

### AWS 環境

```bash
NEXT_PUBLIC_SOCKET_URL=wss://api.your-domain.com
ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## 手動テストチェックリスト

### メインメニュー

- [ ] シングルプレイ・オンライン対戦・役ガイドが開ける
- [ ] 「メニューへ戻る」でメニューに戻れる

### シングルプレイ

- [ ] 牌の左右移動・落下・ハードドロップ
- [ ] 刻子・順子で消去、連鎖・スコア更新
- [ ] 消去演出（拡大→光→縮小）が表示される
- [ ] 消去履歴パネルに消した牌が記録される
- [ ] 一時停止・ゲームオーバー
- [ ] 役ガイドの内容と一致する役表示

### オンライン対戦

- [ ] 名前入力 → 接続 → ルーム作成 or 参加
- [ ] 観戦参加（別ブラウザ/タブ）
- [ ] 準備完了 → 開始 → 対戦画面
- [ ] チャット送信（ルーム全員に届く）
- [ ] 勝敗ダイアログ → 「レポートをダウンロード」ボタン
- [ ] ダウンロードした JSON の内容確認（個人情報なし）
- [ ] ブラウザリロード後のセッション復元
- [ ] 切断・再接続の動作確認

---

## AWS デプロイ

### 初回セットアップ（CDK）

```bash
# CDK 依存関係インストール
cd cdk
pnpm install

# AWS 認証（プロファイル設定済みの場合）
export AWS_PROFILE=your-profile

# CDK ブートストラップ（初回のみ）
pnpm cdk bootstrap

# InfraStack デプロイ（VPC, ECR, ACM, WAF）
pnpm cdk deploy InfraStack

# AppStack デプロイ（ECS, ALB, CloudWatch）
pnpm cdk deploy AppStack
```

### 通常デプロイ（GitHub Actions）

`main` ブランチへのプッシュで自動実行：
1. TypeScript 型チェック（`tsc --noEmit`）
2. ESLint チェック（`pnpm lint`）
3. Docker イメージビルド → ECR プッシュ
4. ECS サービス強制デプロイ（`--force-new-deployment`）

### 手動デプロイ（緊急時）

```bash
# ECR ログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com

# イメージビルド & プッシュ
docker build -t paijang-server .
docker tag paijang-server:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/paijang-server:latest
docker push \
  ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/paijang-server:latest

# ECS 強制デプロイ
aws ecs update-service \
  --cluster paijang-cluster \
  --service paijang-server \
  --force-new-deployment \
  --region ap-northeast-1
```

---

## よくある問題

### `pnpm dev` が起動しない

1. `node -v` でバージョン確認（22+）
2. `rm -rf node_modules && pnpm install` で再インストール
3. ポート 3000 占有 → 別プロセスを停止するか `pnpm dev -- -p 3001`

### ビルドが通らない

- `pnpm exec tsc --noEmit` で型エラーを確認
- ESLint: `pnpm lint` の出力に従い修正

### サーバーに接続できない

1. `pnpm dev:server` が起動しているか確認
2. `.env.local` の `NEXT_PUBLIC_SOCKET_URL` が正しいか確認
3. ブラウザの DevTools → Network タブで WebSocket 接続を確認

### セッションが復元されない

1. ブラウザの localStorage に `paijang.sessionToken` が存在するか確認
2. サーバーが再起動していた場合はセッションが消滅（仕様）→ 新規接続フローへ

### ゲームが重い / カクつく

1. ブラウザ DevTools の Performance で tick 負荷を確認
2. 不要な再レンダー — Zustand セレクタの粒度を確認
3. モバイル実機でタッチ応答を確認

---

## 障害対応フロー

| 深刻度 | 例 | 対応 |
|--------|-----|------|
| P1 | 全ユーザーが接続不可 | ECS タスク状態確認、ALB ヘルスチェック確認、ロールバック、ステータス告知 |
| P2 | 対戦開始失敗・desync | CloudWatch ログ確認、ECS タスク再起動、クライアント強制再接続 |
| P3 | UI 崩れ・軽微バグ | フロント hotfix デプロイ |

### ECS タスク再起動

```bash
aws ecs update-service \
  --cluster paijang-cluster \
  --service paijang-server \
  --force-new-deployment \
  --region ap-northeast-1
```

**注意**: 再起動時に全セッション・ルーム・対戦状態が消滅します。

### CloudWatch ログ確認

```bash
aws logs tail /ecs/paijang-server --follow --region ap-northeast-1
```

---

## ロールバック

- **フロントエンド**: Vercel/Amplify の管理画面で前リリースへロールバック
- **サーバー**: ECR の前バージョンタグを指定して ECS タスク定義を更新

```bash
# 前バージョンのイメージタグを確認
aws ecr list-images --repository-name paijang-server --region ap-northeast-1

# タスク定義を更新して前バージョンを指定（CDK または手動）
```

---

## 監視

| メトリクス | 閾値 | アラート先 |
|-----------|------|-----------|
| ECS メモリ使用率 | > 80% | CloudWatch Alarm |
| ALB 5xx エラー率 | > 1% | 手動確認（要設定） |
| ECS タスク数 | < 1 | 手動確認（要設定） |

---

## 連絡先

プロジェクトオーナー・オンコールは未記載。運用開始前に本セクションを更新してください。
