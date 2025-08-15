# Check Subsidy Agent

補助金一覧確認エージェントです。Mastraフレームワークを使用して補助金一覧の検索を行います。

## 概要

このプロジェクトは、補助金データを検索し、ユーザーの問い合わせに対してAIエージェントが回答するシステムです。CSVファイルやJSONファイルからデータを読み込み、検索機能を提供します。

## 環境変数の設定

プロジェクトを実行する前に、以下の環境変数を設定する必要があります。

### 必要な環境変数

1. `.env.example`を`.env`にコピー:

```bash
cp .env.example .env
```

2. `.env`ファイルで以下の環境変数を設定:

```env
# 補助金データのCSVファイルパス (デフォルト: hojokin2024.csv)
SUBSIDY_CSV_PATH=hojokin2024.csv

# データソースの種類 (csv, json, db) (デフォルト: csv)
SUBSIDY_DATA_SOURCE=csv

# Google Generative AI APIキー (必須)
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### 環境変数の詳細

- **SUBSIDY_CSV_PATH**: 補助金データが格納されているCSVファイルのパス
- **SUBSIDY_DATA_SOURCE**: データソースの種類を指定 (`csv`, `json`, `db`)
- **GOOGLE_GENERATIVE_AI_API_KEY**: Google Generative AI APIのAPIキー（Geminiモデル使用）

## インストール

```bash
npm install
```

## 実行

### 開発モード

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### 本番実行

```bash
npm run start
```

## 必要要件

- Node.js >= 20.9.0
- Google Generative AI APIキー

## プロジェクト構成

- `src/mastra/agents/`: AIエージェントの定義
- `src/mastra/workflows/`: ワークフローの定義
- `src/mastra/tools/`: 検索ツールの実装
- `src/mastra/infrastructure/`: データアクセス層（CSV、JSON対応）
- `src/mastra/repositories/`: データリポジトリインターフェース
- `src/mastra/usecase/`: ユースケース層（アプリケーションロジック）
- `src/mastra/config/`: 設定ファイル
