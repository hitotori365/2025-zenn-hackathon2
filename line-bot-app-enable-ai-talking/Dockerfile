# Node.js 18 LTS ベースイメージ
FROM node:18-slim

# 作業ディレクトリを設定
WORKDIR /app

# package.json をコピーして依存関係をインストール
COPY package.json ./
RUN npm install --only=production

# アプリケーションのソースコードをコピー
COPY . .

# ポート8080を公開
EXPOSE 8080

# アプリケーションを起動
CMD ["npm", "start"]
