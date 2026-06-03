# Requirements Document

## Introduction

本ドキュメントは、麻雀パズル落ちゲー「paijang」のオンライン対戦機能に関する要件を定義する。

既存の Socket.IO サーバー（`server/index.ts`）、ルーム管理（`server/room-manager.ts`）、セキュリティ（`server/security.ts`）、クライアント側フック（`hooks/use-multiplayer.ts`）の実装を前提とし、**AWS へのデプロイ**・**ローカル/オンライン切り替え**・**戦績レポート**・**セキュリティ強化**・**観戦機能**の要件を明確化する。

対戦は 2 人制。観戦は最大 20 人。個人情報は取得せず、ニックネームのみで匿名プレイを実現する。セッション・ルーム情報はサーバーメモリで管理し、DB は使用しない。

---

## Glossary

- **System**：paijang オンライン対戦システム全体
- **Server**：Node.js + Socket.IO で実装されたリアルタイムサーバー（`server/index.ts`）
- **Client**：Next.js フロントエンド（ブラウザ）
- **RoomManager**：ルーム・セッション・ゲームロジックを管理するサーバーサイドモジュール（`server/room-manager.ts`）
- **SecurityModule**：レート制限・入力サニタイズ・トークン生成を担うモジュール（`server/security.ts`）
- **Player**：対戦に参加するユーザー（ニックネームのみ、最大 2 人/ルーム）
- **Spectator**：対戦を観戦するユーザー（最大 20 人/ルーム）
- **Session**：32 バイトランダムトークンで識別されるサーバーサイドのユーザー状態（TTL: 24 時間）
- **Room**：対戦・観戦の単位。名前 2〜32 文字、プレイヤー 2 人 + 観戦者最大 20 人
- **MatchSnapshot**：対戦中の全プレイヤーのゲーム状態スナップショット
- **GameOverPayload**：対戦終了時の勝者・スコア情報
- **BattleReport**：対戦結果をまとめたダウンロード可能なレポート（JSON 形式）
- **RateLimiter**：単位時間あたりのイベント数を制限するモジュール
- **NEXT_PUBLIC_SOCKET_URL**：クライアントが接続するサーバー URL を指定する環境変数
- **ALLOWED_ORIGINS**：サーバーが許可する CORS オリジンを指定する環境変数
- **ALB**：AWS Application Load Balancer
- **ECS**：AWS Elastic Container Service（Fargate）
- **ECR**：AWS Elastic Container Registry
- **ACM**：AWS Certificate Manager
- **CloudFront**：AWS のコンテンツ配信ネットワーク（CDN）
- **WAF**：AWS Web Application Firewall

---

## Requirements

### Requirement 1: Anonymous Session Management

**User Story:** プレイヤーとして、メールアドレスやパスワードなしにニックネームだけで対戦に参加したい。そうすることで、個人情報を提供せずに気軽にプレイできる。

#### Acceptance Criteria

1. WHEN プレイヤーがニックネームを入力して接続を要求したとき、THE Server SHALL 2〜16 文字かつ制御文字・特殊記号（`<>{}[]\`）を含まないニックネームのみを受け付け、32 バイトのランダムセッショントークンを発行する
2. IF ニックネームが 2 文字未満または 16 文字超または禁止文字を含む場合、THEN THE Server SHALL エラーコード `INVALID_NAME` とメッセージ「ニックネームは2〜16文字で入力してください。」をクライアントに返す
3. THE Server SHALL セッション情報（プレイヤー ID・ニックネーム・トークン・ルーム ID・ロール・最終アクセス日時）をサーバーメモリのみで管理し、データベースに保存しない
4. THE Server SHALL セッションの TTL を 24 時間とし、最終アクセスから 24 時間経過かつ未接続のセッションを定期クリーンアップ（60 秒間隔）で削除する
5. WHEN クライアントがブラウザをリロードしたとき、THE Client SHALL localStorage に保存されたセッショントークンを使って `session:resume` イベントを送信し、セッションを復元する
6. WHEN セッション復元が成功したとき、THE Server SHALL プレイヤーが在室していたルームの状態・対戦スナップショットをクライアントに再送する
7. IF セッショントークンが無効または期限切れの場合、THEN THE Server SHALL エラーコード `SESSION_EXPIRED` を返し、THE Client SHALL localStorage のトークンを削除して新規接続フローに誘導する
8. THE SecurityModule SHALL セッション作成を 10 回/分のレート制限で保護する

---

### Requirement 2: Room Management

**User Story:** プレイヤーとして、対戦ルームを作成・参加・退出したい。そうすることで、他のプレイヤーと対戦を始められる。

#### Acceptance Criteria

1. WHEN 有効なセッションを持つプレイヤーがルーム作成を要求したとき、THE RoomManager SHALL 2〜32 文字のルーム名を持つルームを生成し、作成者をホストかつプレイヤーとして登録する
2. IF ルーム名が 2 文字未満または 32 文字超または禁止文字を含む場合、THEN THE Server SHALL エラーコード `INVALID_NAME` を返す
3. THE RoomManager SHALL 1 ルームあたりのプレイヤー上限を 2 人とする
4. WHEN プレイヤーが満員のルームへの参加を要求したとき、THE Server SHALL エラーコード `ROOM_FULL` を返す
5. WHEN プレイヤーが対戦中のルームへのプレイヤー参加を要求したとき、THE Server SHALL エラーコード `GAME_IN_PROGRESS` を返す
6. WHEN プレイヤーがルームを退出したとき、THE RoomManager SHALL ホストが退出した場合は残存プレイヤーに自動でホスト権限を移譲する
7. WHEN ルームの全メンバー（プレイヤー・観戦者）が退出したとき、THE RoomManager SHALL そのルームをメモリから削除する
8. THE Server SHALL ルーム一覧（ID・名前・プレイヤー数・観戦者数・対戦中フラグ・作成日時）を全接続クライアントにブロードキャストする

---

### Requirement 3: Two-Player Match

**User Story:** プレイヤーとして、もう 1 人のプレイヤーとリアルタイムで対戦したい。そうすることで、競争的なゲームプレイを楽しめる。

#### Acceptance Criteria

1. WHEN ホストが対戦開始を要求したとき、THE RoomManager SHALL 2 人のプレイヤーが全員接続済みかつ準備完了状態であることを確認してから対戦を開始する
2. IF プレイヤーが 2 人未満または未準備のプレイヤーが存在する場合、THEN THE Server SHALL エラーコード `NOT_READY` を返す
3. WHILE 対戦中、THE Server SHALL プレイヤーの入力（`move-left` / `move-right` / `soft-drop` / `hard-drop`）を 120 回/10 秒のレート制限で受け付け、ゲーム状態を更新してルーム全員に `match:state` イベントでブロードキャストする
4. WHILE 対戦中、THE RoomManager SHALL 自動落下ティックをプレイヤーごとに独立して実行し、ゲームレベルに応じたインターバルで `soft-drop` を適用する
5. WHEN いずれかのプレイヤーのゲームオーバー条件が成立したとき、THE RoomManager SHALL 勝者を決定し、`match:ended` イベントに勝者 ID・勝者名・全プレイヤーのスコアを含めてルーム全員にブロードキャストする
6. THE RoomManager SHALL ラインクリア時に相手プレイヤーのガベージキューに妨害ブロックを追加する
7. WHEN 対戦が終了したとき、THE RoomManager SHALL ルームの `isStarted` フラグを `false` に戻し、プレイヤーが再度準備・再戦できる状態にする

---

### Requirement 4: Spectator Mode

**User Story:** 観戦者として、進行中の対戦をリアルタイムで観戦したい。そうすることで、他のプレイヤーのプレイを楽しめる。

#### Acceptance Criteria

1. THE RoomManager SHALL 1 ルームあたりの観戦者上限を 20 人とする
2. WHEN 観戦者が観戦参加を要求したとき、THE RoomManager SHALL 観戦者上限未満であれば参加を許可し、対戦中の場合は現在の `MatchSnapshot` を即座に送信する
3. IF 観戦者上限（20 人）に達している場合、THEN THE Server SHALL エラーコード `SPECTATORS_FULL` を返す
4. WHILE 対戦中、THE Server SHALL `match:state` イベントをプレイヤーと観戦者の両方が参加するルームチャンネルにブロードキャストする
5. THE System SHALL 観戦者にゲーム入力操作（`game:input`）を許可しない（観戦者からの入力は `UNAUTHORIZED` エラーを返す）
6. WHEN 観戦者がブラウザをリロードしたとき、THE Client SHALL セッション復元後に観戦ロールと現在の対戦状態を復元する

---

### Requirement 5: In-Room Chat

**User Story:** ルームメンバーとして、対戦中・待機中にチャットでコミュニケーションを取りたい。そうすることで、対戦相手や観戦者と交流できる。

#### Acceptance Criteria

1. WHEN ルームメンバー（プレイヤーまたは観戦者）がチャットメッセージを送信したとき、THE Server SHALL 1〜200 文字かつ制御文字を除去したメッセージをルーム全員にブロードキャストする
2. IF チャットメッセージが 200 文字超または空文字の場合、THEN THE Server SHALL メッセージを破棄し、送信者にエラーを返す
3. THE SecurityModule SHALL チャット送信を 20 回/分のレート制限で保護する
4. IF チャット送信がレート制限を超えた場合、THEN THE Server SHALL エラーコード `RATE_LIMITED` とメッセージ「チャット送信が多すぎます。」を返す
5. THE Server SHALL チャットメッセージにメッセージ ID・送信者 ID・送信者名・テキスト・タイムスタンプ・ロール（`player` / `spectator` / `system`）を含める

---

### Requirement 6: Environment Switching (Local / Online)

**User Story:** 開発者・プレイヤーとして、ローカル LAN とインターネット（AWS）の両方で同じクライアントを使いたい。そうすることで、環境ごとにコードを変更せずに動作確認・本番運用ができる。

#### Acceptance Criteria

1. THE Client SHALL 接続先サーバー URL を環境変数 `NEXT_PUBLIC_SOCKET_URL` から読み込み、未設定の場合は `http://localhost:3001` をデフォルト値として使用する
2. THE Server SHALL 許可する CORS オリジンを環境変数 `ALLOWED_ORIGINS`（カンマ区切り）から読み込み、未設定の場合は `http://localhost:3000` のみを許可する
3. THE System SHALL ローカル環境では `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001` / `ALLOWED_ORIGINS=http://localhost:3000` を使用し、AWS 環境では各サービスのエンドポイントを設定することで切り替えを実現する
4. THE System SHALL 環境変数のみの変更でローカル LAN 対戦（同一ネットワーク内の IP アドレス指定）と AWS オンライン対戦を切り替えられる
5. WHERE ローカル LAN 環境、THE Server SHALL `NEXT_PUBLIC_SOCKET_URL` に LAN 内 IP アドレスとポートを指定することで同一ネットワーク内のプレイヤー間通信を実現する

---

### Requirement 7: Security

**User Story:** システム運用者として、不正アクセス・DDoS・データ改ざんからサービスを保護したい。そうすることで、安全で安定したサービスを提供できる。

#### Acceptance Criteria

1. THE System SHALL WebSocket 通信を TLS 1.2 以上で暗号化する（本番環境では `wss://` プロトコルを使用）
2. THE SecurityModule SHALL セッショントークンを `node:crypto` の `randomBytes(32)` で生成し、タイミング攻撃を防ぐために `timingSafeEqual` で比較する
3. THE SecurityModule SHALL 全入力値（ニックネーム・ルーム名・チャットメッセージ）から制御文字（U+0000〜U+001F、U+007F）および特殊記号（`<>{}[]\`）を除去する
4. THE Server SHALL Socket.IO の CORS 設定で `ALLOWED_ORIGINS` に含まれないオリジンからの接続を拒否する
5. WHERE AWS 環境、THE System SHALL AWS WAF を ALB に適用し、IP レート制限ルール（1 IP あたり 2000 リクエスト/5 分）と一般的な Web 攻撃ルールセット（AWSManagedRulesCommonRuleSet）を有効化する
6. WHERE AWS 環境、THE System SHALL ALB のセキュリティグループで HTTPS（443）のみを許可し、ECS タスクへの直接アクセスを遮断する
7. THE Server SHALL 個人情報（メールアドレス・パスワード・実名）を収集・保存しない
8. THE System SHALL セッショントークンをサーバーログに出力しない

---

### Requirement 8: Battle Report

**User Story:** プレイヤーとして、対戦結果をファイルとしてダウンロードしたい。そうすることで、自分の戦績を記録・分析できる。

#### Acceptance Criteria

1. WHEN 対戦が終了したとき、THE Server SHALL 対戦結果（ルーム ID・対戦開始日時・対戦終了日時・勝者名・全プレイヤーのニックネームとスコア）を `match:ended` イベントのペイロードとしてクライアントに送信する
2. THE Client SHALL 対戦終了後に「レポートをダウンロード」ボタンを表示し、WHEN プレイヤーがボタンをクリックしたとき、THE Client SHALL 対戦結果データを JSON 形式でクライアントサイドで生成してブラウザのダウンロード機能でファイルを保存する
3. THE System SHALL レポートデータをデータベースに永続化しない（クライアントサイド生成のみ）
4. THE System SHALL レポートファイル名を `paijang-battle-{roomId}-{YYYYMMDD}.json` の形式とする
5. THE System SHALL レポートに含める情報を以下に限定する：ルーム名・ルーム ID・対戦開始日時（ISO 8601）・対戦終了日時（ISO 8601）・勝者ニックネーム・各プレイヤーのニックネームとスコア
6. THE System SHALL レポートに個人を特定できる情報（IP アドレス・メールアドレス等）を含めない

---

### Requirement 9: AWS Deployment

**User Story:** システム運用者として、低コスト・高セキュリティな AWS 構成でサービスを運用したい。そうすることで、個人開発規模のコストでインターネット越しの対戦を提供できる。

#### Acceptance Criteria

1. THE System SHALL Next.js フロントエンドを Vercel または AWS Amplify にデプロイし、Socket.IO サーバーを AWS ECS Fargate（最小 0.25 vCPU / 512 MB）で実行する
2. THE System SHALL ECS タスクのコンテナイメージを AWS ECR に格納し、`Dockerfile` でビルド・管理する
3. THE System SHALL ALB を ECS の前段に配置し、HTTPS（443）リスナーで WebSocket（`/socket.io/`）トラフィックを ECS タスクにルーティングする
4. THE System SHALL ALB の SSL 証明書を AWS ACM で管理し、自動更新を有効化する
5. THE System SHALL ECS サービスを単一タスク（desired count: 1）で運用し、セッション・ルーム情報をサーバーメモリで管理する（複数インスタンス非対応）
6. IF ECS タスクが再起動した場合、THEN THE System SHALL 進行中の対戦セッションが消滅することをユーザーに許容させる（メモリ管理の制約として明示）
7. THE System SHALL GitHub Actions による CI/CD パイプラインを構築し、`main` ブランチへのプッシュで ECR へのイメージプッシュと ECS サービスの更新を自動実行する
8. WHERE コスト最適化が必要な場合、THE System SHALL ECS Fargate Spot を使用してコンピューティングコストを削減する

---

### Requirement 10: Scaling and Session Management Constraints

**User Story:** システム運用者として、メモリ管理の制約と許容範囲を明確にしたい。そうすることで、障害時の影響範囲を把握して適切な運用ができる。

#### Acceptance Criteria

1. THE System SHALL 単一 ECS タスクインスタンスで運用し、複数インスタンス間のセッション共有（Redis 等）は実装しない
2. THE RoomManager SHALL セッション TTL（24 時間）と定期クリーンアップ（60 秒間隔）によりメモリ使用量を管理する
3. IF サーバーが再起動した場合、THEN THE System SHALL 全セッション・ルーム・対戦状態が消滅し、クライアントは自動的に再接続フローに誘導される
4. THE Client SHALL Socket.IO の自動再接続（最大 8 回、初回 1 秒・最大 8 秒の指数バックオフ）でサーバー再起動後の復帰を試みる
5. THE System SHALL 同時接続数の目安を 100 接続以下（個人開発規模）とし、これを超える場合は ECS タスクのリソース増強またはアーキテクチャ見直しを検討する
6. THE System SHALL ECS タスクのメモリ使用量を CloudWatch メトリクスで監視し、512 MB の 80% 超過時にアラートを発報する

---

### Requirement 11: Containerization and CI/CD

**User Story:** 開発者として、コードの変更を安全かつ迅速に本番環境に反映したい。そうすることで、継続的な機能改善とバグ修正を効率的に行える。

#### Acceptance Criteria

1. THE System SHALL Socket.IO サーバーを `Dockerfile` でコンテナ化し、Node.js LTS イメージをベースとする
2. THE System SHALL `Dockerfile` でマルチステージビルドを使用し、本番イメージに開発依存関係（`devDependencies`）を含めない
3. THE System SHALL GitHub Actions ワークフローで `main` ブランチへのプッシュ時に以下を自動実行する：TypeScript 型チェック（`tsc --noEmit`）、ESLint チェック（`pnpm lint`）、ECR へのイメージプッシュ、ECS サービスの強制デプロイ
4. THE System SHALL GitHub Actions で AWS 認証に OIDC（OpenID Connect）を使用し、長期的な AWS アクセスキーを GitHub Secrets に保存しない
5. THE System SHALL ECS タスク定義の環境変数（`PORT`・`ALLOWED_ORIGINS`）を AWS Systems Manager Parameter Store または ECS タスク定義の環境変数として管理する

---

### Requirement 12: Server-Authoritative Game Input

**User Story:** システム運用者として、クライアントからの不正な入力によるゲーム状態の改ざんを防ぎたい。そうすることで、公平な対戦環境を維持できる。

#### Acceptance Criteria

1. THE Server SHALL ゲーム状態（スコア・牌面・勝敗）の真実をサーバーサイドのみで管理し、クライアントは表示と入力送信のみを担う
2. THE RoomManager SHALL 受け付けるゲーム入力を `move-left` / `move-right` / `soft-drop` / `hard-drop` の 4 種類に限定し、それ以外の値は `INVALID_INPUT` エラーを返す
3. THE SecurityModule SHALL ゲーム入力を 120 回/10 秒のレート制限で保護し、超過した場合は `RATE_LIMITED` エラーを返す
4. IF セッショントークンが無効または対戦中でないプレイヤーからゲーム入力が送信された場合、THEN THE Server SHALL `UNAUTHORIZED` エラーを返し、入力を無視する
5. THE Server SHALL ゲーム状態の更新結果（`match:state`）をサーバーから全ルームメンバーにブロードキャストし、クライアントサイドでのゲーム状態の独自計算を行わない
