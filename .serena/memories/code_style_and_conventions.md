# コードスタイルと規約

## TypeScript設定
- **厳密モード**: `strict: true`
- **verbatimModuleSyntax**: true（import/export構文の厳密な処理）
- **skipLibCheck**: true（ライブラリの型チェックをスキップ）

## コーディング規約

### 命名規則
- **ファイル名**: kebab-case（例: `subsidy-search-tool.ts`）
- **エクスポート変数**: camelCase（例: `inquiryAgent`, `lineAgent`）
- **クラス・型**: PascalCase

### インポート/エクスポート
- ESModulesスタイルを使用
- 名前付きエクスポートを優先
```typescript
export const inquiryAgent = new Agent({...});
```

### コード構造
- Mastraエージェントは独立したファイルで定義
- ツールは`tools`ディレクトリに配置
- ワークフローは`workflows`ディレクトリに配置
- エージェントは`agents`ディレクトリに配置

### エージェント定義パターン
```typescript
export const agentName = new Agent({
  name: 'Agent Name',
  description: '説明',
  instructions: `
    マルチライン文字列で
    詳細な指示を記述
  `,
  model: google('gemini-1.5-pro-latest'),
  tools: { toolName },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
});
```

### 日本語の使用
- コメントとドキュメントは日本語で記述
- エラーメッセージも日本語
- エージェントのinstructionsは日本語で詳細に記述

### エラーハンドリング
- try-catchブロックでエラーを適切にキャッチ
- エラーログを出力
- ユーザーには適切なエラーメッセージを返す

## 注意事項
- ESLintやPrettierの設定ファイルは現在なし
- フォーマッティングルールは明示的に定義されていない
- TypeScriptの厳密モードにより型安全性を確保