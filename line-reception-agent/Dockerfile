# ベースイメージ（Node.js 18-slim）
FROM node:18-slim

# 作業ディレクトリ
WORKDIR /app

# パッケージファイルをコピーして依存インストール
COPY package*.json ./
RUN npm install --include=dev

# アプリケーションの全ファイルをコピー
COPY . .

# デバッグ用：ファイルの存在確認
RUN ls -la
RUN ls -la .mastra/ || echo "No .mastra directory"

RUN npm run build && ls -la .mastra/output/

# デバッグ用：ビルド後の確認
RUN ls -la .mastra/output/ || echo "Build output not found"

EXPOSE 8080

# サーバを起動
CMD ["node", "--import=./.mastra/output/instrumentation.mjs", ".mastra/output/index.mjs"]
