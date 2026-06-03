# ============================================================
# Stage 1: builder — 依存関係インストール + TypeScript コンパイル
# ============================================================
FROM node:22-alpine AS builder
WORKDIR /app

# pnpm を有効化
RUN corepack enable && corepack prepare pnpm@latest --activate

# 依存関係のインストール（lockfile 使用）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ソースコピー & TypeScript コンパイル
COPY tsconfig.json tsconfig.server.json ./
COPY lib/ ./lib/
COPY server/ ./server/
RUN pnpm exec tsc --project tsconfig.server.json

# ============================================================
# Stage 2: runner — 本番イメージ（devDependencies 除外）
# ============================================================
FROM node:22-alpine AS runner
WORKDIR /app

# pnpm を有効化
RUN corepack enable && corepack prepare pnpm@latest --activate

# 本番依存関係のみインストール
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod

# コンパイル済みファイルをコピー
COPY --from=builder /app/dist ./dist

# 環境変数
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# 非 root ユーザーで実行（セキュリティ強化）
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "dist/server/index.js"]
