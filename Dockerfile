# ============================================================
# Stage 1: deps — 依存関係のインストール
# ============================================================
FROM node:22-alpine AS deps
WORKDIR /app

# pnpm を有効化
RUN corepack enable && corepack prepare pnpm@latest --activate

# package.json と lockfile のコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 2: builder — Next.js アプリケーションのビルド
# ============================================================
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# テレメトリの無効化（オプション）
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js の本番ビルドを実行
RUN pnpm build

# ============================================================
# Stage 3: runner — 本番用の最小実行イメージ
# ============================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# セキュリティのため、非 root ユーザーで実行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ビルド成果物のうち、最小限の実行に必要なファイルのみをコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
