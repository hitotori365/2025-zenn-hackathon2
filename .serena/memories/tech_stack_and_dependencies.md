# 技術スタックと依存関係

## 全体的な技術スタック
- **言語**: TypeScript (ESNext target)
- **ランタイム**: Node.js (>=20.9.0)
- **パッケージマネージャー**: npm
- **モジュールシステム**: ESModules (type: "module")

## line-mastra-client
### 主要依存関係
- **@hono/node-server**: HTTPサーバー
- **hono**: 軽量Webフレームワーク
- **@mastra/client-js**: MastraクライアントSDK
- **@line/bot-sdk**: LINE Messaging API SDK

### 開発依存関係
- **tsx**: TypeScript実行環境（開発用）
- **typescript**: TypeScriptコンパイラ

### TypeScript設定
- target: ESNext
- module: NodeNext
- strict: true
- JSX: hono/jsx (React風JSXサポート)

## line-agent
### 主要依存関係
- **@mastra/core**: Mastraコアフレームワーク
- **@mastra/libsql**: SQLiteベースのデータストア
- **@mastra/memory**: メモリ管理
- **@mastra/loggers**: ロギング
- **@ai-sdk/google**: Google AI SDK (Gemini)
- **@line/bot-sdk**: LINE SDK
- **zod**: スキーマバリデーション

### 開発依存関係
- **mastra**: Mastra CLI
- **typescript**: TypeScriptコンパイラ

## check-subsidy-agent
### 主要依存関係
- **@mastra/core**: Mastraコアフレームワーク
- **@mastra/libsql**: SQLiteベースのデータストア
- **@mastra/memory**: メモリ管理
- **@mastra/loggers**: ロギング
- **@ai-sdk/google**: Google AI SDK (Gemini)
- **zod**: スキーマバリデーション

### 開発依存関係
- **mastra**: Mastra CLI
- **typescript**: TypeScriptコンパイラ

## 共通の特徴
- すべてのプロジェクトがTypeScriptを使用
- ESModulesを採用
- Mastraフレームワークでエージェント開発
- Google Gemini AIモデルを利用
- LibSQL (SQLite)でデータ永続化