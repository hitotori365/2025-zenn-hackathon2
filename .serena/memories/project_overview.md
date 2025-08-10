# プロジェクト概要

## プロジェクトの目的
このプロジェクトは、LINEグループで補助金・控除に関する問い合わせを自動的に処理するシステムです。

### 主な機能
1. LINEグループでのメッセージを受信
2. AIが補助金・控除に関連する内容かを判断
3. 関連する補助金情報の検索と提供
4. 必要項目が不足している場合のヒアリング対応

## システム構成
3つの独立したサービスで構成されています：

### 1. line-mastra-client
- **役割**: LINEとMastraエージェントを仲介するクライアント
- **技術**: Hono (Node.js), TypeScript
- **ポート**: 3000
- **エンドポイント**:
  - `/callback`: LINE Webhookエンドポイント
  - `/chat`: テスト用チャットエンドポイント
  - `/agent-card`, `/agent-info`: エージェント情報取得

### 2. line-agent
- **役割**: LINEメッセージ処理の基本エージェント
- **技術**: Mastra, Gemini AI (Google)
- **データベース**: LibSQL (SQLite)
- **現在の機能**: 天気情報の提供（weatherTool）

### 3. check-subsidy-agent
- **役割**: 補助金情報の検索と問い合わせ対応
- **技術**: Mastra, Gemini AI (Google)
- **データベース**: LibSQL (SQLite)
- **主要ツール**: subsidySearchTool
- **データソース**: subsidy-data.json（補助金情報）

## 処理フロー
1. LINEグループでユーザーがメッセージを送信
2. LINE Webhookがline-mastra-clientに転送
3. line-mastra-clientがinquiry-agentにメッセージを送信
4. inquiry-agentが補助金関連かを判断し、必要に応じて検索
5. 結果をLINEに返信

## 環境変数
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Bot用アクセストークン
- `LINE_CHANNEL_SECRET`: LINE Bot用シークレット

## 会話状態管理
3つの状態を管理：
- **NONE**: 初期状態（通常の会話）
- **PENDING_VALIDATION**: 補助金関連と判定され、項目チェック中
- **GATHERING_INFO**: 不足項目のヒアリング中