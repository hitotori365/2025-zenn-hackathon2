FROM node:22-slim

# 作業ディレクトリ
WORKDIR /app

# パッケージファイルをコピーして依存インストール（開発依存関係も含む）
COPY package*.json ./
RUN npm ci

# アプリケーションファイルをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# ポート3000を公開
EXPOSE 3000

# アプリケーション起動
CMD ["npm", "start"]