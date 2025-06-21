# ベースイメージ（Node.js 20-slim）
FROM node:20-slim

# 作業ディレクトリ
WORKDIR /app

# パッケージファイルをコピーして依存インストール
COPY package*.json ./
RUN npm install --include=dev

# アプリケーションの全ファイルをコピー
COPY . .

# mastra buildを実行
RUN npm run build

# ビルド結果の確認
RUN ls -la .mastra/output/

# 本番用の依存関係のみをインストール
WORKDIR /app/.mastra/output
RUN npm ci --only=production

# 作業ディレクトリを戻す
WORKDIR /app

EXPOSE 8080

# サーバを起動（mastra startコマンドを使用）
CMD ["npm", "run", "start"]
