# ベースイメージ（Node.js 18）
FROM node:18

# 作業ディレクトリ
WORKDIR /app

# パッケージファイルをコピーして依存インストール
COPY package*.json ./
RUN npm install

# アプリケーションの全ファイルをコピー
COPY . .

# サーバを起動
CMD ["npm", "start"]
