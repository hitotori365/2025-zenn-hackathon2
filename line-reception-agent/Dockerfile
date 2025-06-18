# ベースイメージ（Node.js 20-slim）
FROM node:20-slim

# 作業ディレクトリ
WORKDIR /app

# パッケージファイルをコピーして依存インストール
COPY package*.json ./
RUN npm install --include=dev

# アプリケーションの全ファイルをコピー
COPY . .

# TypeScriptビルド
RUN npx tsc

EXPOSE 8080

# Expressサーバーを起動
CMD ["node", "dist/server.js"]
