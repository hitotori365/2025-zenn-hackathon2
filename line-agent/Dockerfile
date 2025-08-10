# ビルドステージ
FROM node:22-slim AS builder

WORKDIR /app

# パッケージファイルをコピーして依存インストール（キャッシュレイヤー最適化）
COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force

# アプリケーションの全ファイルをコピー
COPY . .

# mastra buildを実行
RUN npm run build

# 本番用の依存関係のみをインストール
WORKDIR /app/.mastra/output
RUN npm ci --omit=dev && npm cache clean --force

# プロダクションステージ
FROM node:22-slim AS production

WORKDIR /app

# ビルド済みファイルをコピー
COPY --from=builder /app/.mastra/output ./

EXPOSE 8080

# 正しい起動コマンド
CMD ["node", "--import=./instrumentation.mjs", "./index.mjs"]
