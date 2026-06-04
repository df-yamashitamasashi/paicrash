# PaiCrash (麻雀パズル)

PaiCrash（パイクラッシュ）は、麻雀牌を使った落ち物パズルゲームです。
同じ種類の牌を縦横に並べて役を作り、スコアを稼いだり、相手におじゃまブロック（ゴミブロック）を送って対戦することができます。
シングルプレイでハイスコアを目指すモード、AI（CPU）と対戦するモード、Firebaseを利用したリアルタイムのオンラインマルチプレイモードを搭載しています。

## 🎮 主な機能

- **シングルプレイ**: ひたすら役を作ってハイスコアを目指すエンドレスモード。
- **CPU対戦**: 強さを選べるAI（Slow / Normal / Fast / Insane）と対戦。
- **オンラインマルチプレイ**: リアルタイムで他のプレイヤーと対局し、おじゃまブロックを送り合う対戦モード。観戦機能付き。
- **役の自動判定・ガイド**: 麻雀のルールに詳しくない人でも遊べるように、ゲーム内で役の一覧や作り方を確認できるガイド機能を搭載。
- **動的な難易度調整**: スコアが上がるにつれて落下速度が自然に上昇。

## 🛠️ 技術スタック

### フロントエンド
- **フレームワーク**: [Next.js 16](https://nextjs.org/) (App Router)
- **UIライブラリ**: [React 19](https://react.dev/)
- **言語**: [TypeScript 5](https://www.typescriptlang.org/)
- **スタイリング**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UIコンポーネント**: [Radix UI](https://www.radix-ui.com/) / [shadcn/ui](https://ui.shadcn.com/) ベース
- **アイコン**: [Lucide React](https://lucide.dev/)
- **状態管理**: [Zustand](https://github.com/pmndrs/zustand) (ゲームステートやマルチプレイの状態同期)

### バックエンド / インフラ
- **マルチプレイ同期**: [Firebase Realtime Database](https://firebase.google.com/docs/database) (ルーム管理、ゲーム入力の同期、観戦状態の配信)
- **ホスティング**: Vercel (推奨) または Firebase App Hosting
- **パッケージマネージャー**: `pnpm`

## 🚀 起動方法（ローカル開発）

### 1. 前提条件
- Node.js (v18.17 以降推奨)
- pnpm のインストール (`npm install -g pnpm`)

### 2. 環境変数の設定
プロジェクトのルートに `.env.local` ファイルを作成し、Firebase の接続情報を記述します。

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://your_project_id-default-rtdb.firebaseio.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
```

### 3. パッケージのインストール

```bash
pnpm install
```

### 4. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで `http://localhost:3000` にアクセスするとゲームが起動します。

## 🚢 デプロイ方法

本プロジェクトは **Google Cloud Run** へコンテナとしてデプロイされています。デプロイフローは GitHub Actions を用いて自動化されており、`main` ブランチに push すると自動でビルド＆デプロイが走ります。

### GitHub Actions による自動デプロイ (GCP Cloud Run)

GitHub Actions のワークフロー (`.github/workflows/deploy.yml`) が設定されており、以下のステップでデプロイが行われます。

1. **OIDC認証**: Workload Identity Federation (WIF) を利用し、サービスアカウントキーを発行せずに安全に GCP 認証を行います。
2. **Dockerビルド**: `Dockerfile` を基にアプリケーションコンテナをビルドし、Google Cloud Artifact Registry にプッシュします。
3. **Cloud Runへデプロイ**: プッシュされたイメージを使って Cloud Run の新しいリビジョンをデプロイします。

#### 必要な GitHub Secrets の設定
GitHub のリポジトリ設定 (`Settings` > `Secrets and variables` > `Actions`) から以下の Secrets を設定してください。

- `GCP_PROJECT_ID`: デプロイ先の GCP プロジェクト ID
- `GCP_WIF_PROVIDER`: Workload Identity プロバイダのフルネーム
- `GCP_WIF_SERVICE_ACCOUNT`: デプロイ用サービスアカウントのメールアドレス

#### Firebase 環境変数の設定 (Cloud Run 側)
Cloud Run コンソール（またはデプロイ時の `gcloud run deploy` コマンドライン引数）から、以下の Firebase 環境変数を設定しておく必要があります。

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 📁 主要なディレクトリ構造

```
paicrash/
├── app/                  # Next.js App Routerのエンドポイント (page.tsx, layout.tsx, globals.css)
├── components/
│   ├── game/             # ゲーム固有のコンポーネント (盤面、結果画面、各種モード)
│   └── ui/               # 汎用的なUIコンポーネント群 (ボタン、ダイアログなど)
├── hooks/                # 状態やゲームループを管理するカスタムフック
│   ├── use-cpu-game.ts   # CPU対戦ロジック
│   ├── use-multiplayer.ts# マルチプレイのネットワーク同期
│   └── use-keyboard.ts   # キーボード入力の制御
├── lib/
│   ├── game-engine.ts    # 麻雀パズルのコアルール（役判定、落下、スコア計算）
│   ├── game-store.ts     # シングルプレイ用の状態管理 (Zustand)
│   ├── multiplayer-store.ts # マルチプレイ・ルーム状態管理 (Zustand)
│   ├── multiplayer-protocol.ts # マルチプレイ通信データの型定義
│   └── firebase.ts       # Firebaseの初期化設定
└── public/               # 静的アセット（効果音、画像ファイルなど）
```

## 📝 開発時の注意点

- `lib/game-engine.ts` がパズルのコアロジックを担っています。役の追加や落下挙動の変更を行う場合はこのファイルを編集します。
- オンライン対戦時、入力遅延を防ぐためにクライアント側のフック（`use-multiplayer.ts`）で予測描画を行いつつ、Firebase 経由で他プレイヤーの操作（`applyGameInput`）を受信して状態を同期する仕組みになっています。
