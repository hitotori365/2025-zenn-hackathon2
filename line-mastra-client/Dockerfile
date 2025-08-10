FROM node:20-slim-bullseye

# 作業ディレクトリ
WORKDIR /app

# パッケージファイルをコピーして依存インストール
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションファイルをコピー
COPY . .

# TypeScriptをビルド
RUN npm install --save-dev typescript
RUN npm run build

# ポート3000を公開
EXPOSE 3000

# アプリケーション起動
CMD ["npm", "start"]