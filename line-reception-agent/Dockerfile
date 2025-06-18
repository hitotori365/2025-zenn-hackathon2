# ベースイメージ（Node.js 18-slim）
FROM node:18-slim

# 作業ディレクトリ
WORKDIR /app

# パッケージファイルをコピーして依存インストール
COPY package*.json ./
RUN npm install

# アプリケーションの全ファイルをコピー
COPY . .
RUN npm run build

EXPOSE 8080

# サーバを起動
CMD ["npm", "start"]
