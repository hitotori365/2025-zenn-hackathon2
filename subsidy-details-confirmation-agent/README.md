# Subsidy Details Confirmation Agent

補助金詳細確認エージェントは、補助金IDとユーザー属性を受け取り、詳細な補助金情報を提供し、LINEユーザー向けの自然言語メッセージを生成するMastraエージェントです。

## 機能

- 補助金IDによる詳細情報の取得
- ユーザー属性に基づく適格性判定
- LINE向けに最適化されたメッセージ生成
- 文字列形式のユーザー属性の自動解析

## セットアップ

1. 環境変数の設定
```bash
cp .env.example .env
```

2. `.env`ファイルを編集してGoogle AI API キーを設定
```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

3. 依存関係のインストール
```bash
npm install
```

4. 開発サーバーの起動
```bash
npm run dev
```

## データ構造

補助金データは`subsidy-details/`ディレクトリ内に`{subsidy_id}.json`形式で個別ファイルとして保存されています。

```
subsidy-details/
├── subsidy_001.json
├── subsidy_002.json
├── subsidy_003.json
├── subsidy_004.json
└── subsidy_005.json
```

## 環境変数

- `GOOGLE_GENERATIVE_AI_API_KEY`: Google AI APIキー（必須）
- `SUBSIDY_DATA_SOURCE`: データソース（デフォルト: `json`）
- `SUBSIDY_DETAILS_JSON_DIR`: 補助金JSONファイルディレクトリ（デフォルト: `./subsidy-details`）

## API使用例

エージェントへのリクエスト形式：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "{\"subsidyId\": \"subsidy_001\", \"userAttributes\": \"userId: user123, companySize: 中小企業, industry: 製造業, employeeCount: 50人, capital: 1億円\", \"requestType\": \"details\"}"
    }
  ]
}
```

## 開発

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクション起動
npm start
```

プレイグラウンドは http://localhost:4111 でアクセス可能です。