# ビルドステージ
FROM node:22-slim AS builder

WORKDIR /app

# パッケージファイルをコピーして依存インストール
COPY package*.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# プロダクションステージ
FROM node:22-slim AS production

WORKDIR /app

# 本番用依存関係のみをインストール
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ビルド済みファイルをコピー
COPY --from=builder /app/dist ./dist

# アプリケーション起動
CMD ["node", "dist/index.js"]