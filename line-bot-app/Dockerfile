# Node.js v20 の公式イメージをベースに使用
FROM node:20-slim

# アプリケーション用のディレクトリを作成
WORKDIR /usr/src/app

# アプリケーションの依存関係をインストール
# package.json と package-lock.json をコピー
COPY package*.json ./

# 本番環境で必要なパッケージのみをインストール
RUN npm install --production

# アプリケーションのソースコードをコピー
COPY . .

# コンテナ起動時にアプリケーションを実行するコマンド
CMD [ "npm", "start" ]
