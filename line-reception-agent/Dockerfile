# ベースイメージ（Node.js 20-slim）
FROM node:20-slim

# 作業ディレクトリ
WORKDIR /app

# パッケージファイルをコピーして依存インストール
COPY package*.json ./
RUN npm install --include=dev

# アプリケーションの全ファイルをコピー
COPY . .

# ビルド実行
RUN npm run build

# ビルド結果の確認
RUN ls -la .mastra/output/

EXPOSE 8080

# Mastraの公式startコマンドを使用
CMD ["npx", "mastra", "start"]
