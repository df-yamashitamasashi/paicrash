# Runbook

麻雀パズルのローカル開発・障害対応・デプロイ手順です。

---

## 前提

- Node.js 22 以上推奨
- pnpm がインストール済みであること
- gcloud CLI / Firebase CLI（本番デプロイ管理時）

---

## ローカル開発

```bash
# 初回依存関係インストール
pnpm install

# フロントエンド開発サーバーの起動
# (http://localhost:3000)
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

`.env.local` に Firebase 関連の環境変数を設定してください（`.env.example` 参照）。

---

## 環境変数

| 変数名 | スコープ | ローカル値 | 説明 |
|--------|---------|-----------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | `...` | Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | `...` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | `...` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Client | `...` | Firebase Realtime Database URL |

---

## 手動テストチェックリスト

### シングルプレイ

- [ ] 牌の左右移動・落下・ハードドロップ
- [ ] 刻子・順子で消去、連鎖・スコア更新
- [ ] 消去演出が表示される

### オンライン対戦（Firebase）

- [ ] Google ログインができること
- [ ] ルーム作成 or 参加ができること
- [ ] 複数ブラウザ間で牌やスコアが同期されること
- [ ] ガベージ（おじゃま牌）が送信されること

---

## GCP / Firebase デプロイ

### CI/CD デプロイ (GitHub Actions)

`main` ブランチへのプッシュで自動実行：
1. TypeScript 型チェック（`tsc --noEmit`）
2. Workload Identity Federation による GCP 認証
3. Docker イメージビルド → Artifact Registry プッシュ
4. Cloud Run サービスデプロイ

### データベース (Firebase RTDB)

Firebase Console または Firebase CLI からセキュリティルールをデプロイします。

```bash
# Firebase CLI のセットアップとデプロイ
firebase login
firebase use paicrash-gcp-project-id
firebase deploy --only database
```

### 手動デプロイ (Cloud Run)

```bash
# ビルドとデプロイを同時に行う場合
gcloud run deploy paicrash-server \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --project paicrash-gcp-project-id
```

---

## 障害対応フロー

| 深刻度 | 例 | 対応 |
|--------|-----|------|
| P1 | 全ユーザーがアクセス不可 | Cloud Run サービス状態確認、最新リビジョンへのロールバック |
| P2 | 対戦時の同期遅延・エラー | Firebase RTDB の接続数・帯域制限確認、Cloud Monitoring ログ確認 |
| P3 | UI 崩れ・軽微バグ | フロント hotfix デプロイ |

### ログの確認

```bash
# Cloud Run のログを確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=paicrash-server" --limit 50
```

---

## ロールバック

- **フロントエンド (Cloud Run)**: Cloud Console または CLI からトラフィックを過去の正常なリビジョンへ 100% 振り替えます。

```bash
gcloud run services update-traffic paicrash-server --to-revisions=PREVIOUS_REVISION=100
```

---

## 監視

| メトリクス | 閾値 | アラート先 |
|-----------|------|-----------|
| Cloud Run エラー率 | > 1% | Cloud Monitoring アラート |
| RTDB 同時接続数 | 上限の 80% | Firebase Console アラート |
