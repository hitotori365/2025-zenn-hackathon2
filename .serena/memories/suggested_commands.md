# 推奨コマンド一覧

## 開発コマンド

### line-mastra-client
```bash
cd line-mastra-client
npm run dev     # 開発サーバー起動 (tsx watch)
npm run build   # TypeScriptビルド
npm run start   # プロダクション実行
```

### line-agent
```bash
cd line-agent
npm run dev     # Mastra開発モード
npm run build   # Mastraビルド
npm run start   # Mastraプロダクション実行
```

### check-subsidy-agent
```bash
cd check-subsidy-agent  
npm run dev     # Mastra開発モード
npm run build   # Mastraビルド
npm run start   # Mastraプロダクション実行
```

## 依存関係管理
```bash
npm install     # 依存関係インストール
npm update      # 依存関係更新
```

## Git操作
```bash
git status      # 変更状況確認
git add .       # 変更をステージング
git commit -m "メッセージ"  # コミット
git push        # リモートへプッシュ
```

## システム全体の起動手順
1. check-subsidy-agentを起動:
   ```bash
   cd check-subsidy-agent && npm run dev
   ```
2. line-agentを起動（必要な場合）:
   ```bash
   cd line-agent && npm run dev
   ```
3. line-mastra-clientを起動:
   ```bash
   cd line-mastra-client && npm run dev
   ```

## 環境変数設定
```bash
export LINE_CHANNEL_ACCESS_TOKEN="your-token"
export LINE_CHANNEL_SECRET="your-secret"
```

## デバッグ
- ログ確認: 各サービスのコンソール出力を確認
- エンドポイントテスト: `http://localhost:3000/chat`でテスト

## 注意事項
- テスト、リント、フォーマットコマンドは現在定義されていません
- 各プロジェクトは独立して実行可能です
- Mastraエージェントはポート4111で動作します