# プロジェクト構造

## ルートディレクトリ構成
```
2025-zenn-hackathon2/
├── README.md                # プロジェクト説明と処理フロー図
├── .gitignore              # Git除外設定
├── cloudbuild.yaml         # Cloud Build設定
├── .dockerignore           # Docker除外設定
├── CRUSH.md                # 追加ドキュメント
├── line-mastra-client/     # LINEクライアントサービス
├── line-agent/             # LINE処理エージェント
├── check-subsidy-agent/    # 補助金検索エージェント
└── format_data/            # データフォーマット関連

```

## line-mastra-client/
```
line-mastra-client/
├── src/
│   └── index.ts           # メインサーバーファイル
├── package.json           # プロジェクト設定
├── tsconfig.json          # TypeScript設定
├── .gitignore
└── README.md
```

## line-agent/
```
line-agent/
├── src/
│   └── mastra/
│       ├── index.ts
│       ├── agents/
│       │   ├── line-agent.ts      # LINEエージェント定義
│       │   └── weather-agent.ts   # 天気エージェント
│       ├── tools/
│       │   └── weather-tool.ts    # 天気情報取得ツール
│       └── workflows/
├── package.json
├── tsconfig.json
├── Dockerfile
└── .gitignore
```

## check-subsidy-agent/
```
check-subsidy-agent/
├── src/
│   └── mastra/
│       ├── index.ts
│       ├── agents/
│       │   └── inquiry-agent.ts          # 問い合わせエージェント
│       ├── tools/
│       │   └── subsidy-search-tool.ts    # 補助金検索ツール
│       └── workflows/
│           └── subsidy-inquiry-workflow.ts
├── subsidy-data.json      # 補助金データベース
├── package.json
├── tsconfig.json
└── .gitignore
```

## 各ディレクトリの役割
- **src/**: ソースコード
- **mastra/**: Mastraフレームワーク関連
- **agents/**: エージェント定義
- **tools/**: 再利用可能なツール
- **workflows/**: ワークフロー定義

## データファイル
- **subsidy-data.json**: 補助金情報のマスターデータ
- **mastra.db**: 各エージェントのメモリストレージ（実行時生成）

## 設定ファイル
- **package.json**: 依存関係とスクリプト定義
- **tsconfig.json**: TypeScriptコンパイル設定
- **.gitignore**: Git除外ファイル指定