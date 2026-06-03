# GEMINI: 麻雀パズルプロジェクト

## 概要

このリポジトリは、日本の麻雀をテーマにした落ち物パズルゲームとして構築された Next.js アプリです。広告収入モデルを前提としたモバイル／ウェブ向けゲームとして設計されており、ユーザーはシングルプレイヤーとネットワーク対戦の両方を楽しめるようになっています。

麻雀牌の生成とマッチングゲームエンジンを使い、モダンなコンポーネントライブラリと Tailwind CSS による UI で構成されています。

## 主要機能

- シングルプレイヤー麻雀パズルゲーム
- ネットワーク対戦対応のロビーと部屋フロー
- 役ガイドダイアログ
- 牌の3つ組や連番のマッチ検出
- `lib/game-engine.ts` にあるボードとスコア計算のロジック
- `lib/multiplayer-store.ts` の Zustand によるクライアント側マルチプレイヤー状態管理
- `hooks/use-multiplayer.ts` にあるマルチプレイヤー接続と同期ロジックの基盤

## 技術スタック

- Next.js 16（App Router）
- React 19
- TypeScript 5
- Tailwind CSS 4
- Zustand（グローバルクライアント状態管理）
- Radix UI（UI コントロール）
- Lucide アイコン
- Recharts, date-fns, socket.io-client（ネットワーク対戦実装を想定）

## 重要なファイル

- `app/page.tsx`
  - アプリのメインエントリーポイント
  - メニュー、ゲームモード選択、ダイアログ、ゲームコンポーネントをレンダリング

- `app/layout.tsx`
  - ルートレイアウトとメタデータ定義

- `lib/game-engine.ts`
  - 麻雀パズルゲームのコアロジック
  - ボード生成、牌マッチング、連番検出、役検出

- `lib/mahjong-types.ts`
  - 牌、ボード、役の共通型定義

- `lib/yaku-data.ts`
  - 麻雀役定義とスコア計算のヘルパー

- `lib/multiplayer-store.ts`
  - マルチプレイヤー接続、部屋、チャット、ゲーム状態の Zustand ストア

- `hooks/use-multiplayer.ts`
  - ネットワーク対戦接続と同期ロジックの基盤
  - 本番運用では実際の WebSocket / Socket.IO サーバーに置き換える想定

- `components/game/`
  - シングルプレイヤーとマルチプレイヤーのゲーム UI コンポーネント

- `components/ui/`
  - アプリ全体で使われる再利用可能な UI コンポーネントとプリミティブ

## 実行と開発

依存関係をインストールし、ローカルで実行します:

```bash
pnpm install
pnpm dev
```

その他のスクリプト:

- `pnpm build` - 本番アプリをビルド
- `pnpm start` - 本番サーバーを起動
- `pnpm lint` - ソースを lint

## 注意事項

- 本プロジェクトは広告収入モデルを前提としたゲーム設計を想定しています。
- ネットワーク対戦向けの接続と同期機構を構築する必要があります。
- `next.config.mjs` は TypeScript のビルドエラーを無視し、画像最適化を無効化する設定になっています。

## 推奨される次のステップ

- マルチプレイヤールーム同期のために実際の Socket.IO / WebSocket バックエンドを実装する
- `hooks/use-multiplayer.ts` のロジックをネットワーク同期対応に整備する
- 広告表示やリワード広告を含む収益化フローを設計・実装する
- `lib/game-engine.ts` と `hooks/use-multiplayer.ts` のテストを追加する
- モバイル対応とアクセシビリティの UI/UX を改善する
