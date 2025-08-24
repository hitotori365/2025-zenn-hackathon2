import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { subsidyDetailsTool } from "../tools/subsidy-details-tool";
import { messageGeneratorTool } from "../tools/message-generator-tool";
import { SubsidyDetailsResult } from "../usecase/getSubsidyDetailsUsecase";
import { UserAttributes, SubsidyDetails, GeneratedMessage } from "../repositories/subsidy-details-repository";

export const createAgent = (
  detailsToolFactory: (subsidyDetailsUsecase: (subsidyId: string) => Promise<SubsidyDetailsResult>) => ReturnType<typeof subsidyDetailsTool>,
  messageToolFactory: (messageGenerationUsecase: (userAttributes: UserAttributes, subsidyDetails: SubsidyDetails, requestType?: "details" | "eligibility" | "application" | "contact") => Promise<GeneratedMessage>) => ReturnType<typeof messageGeneratorTool>,
  subsidyDetailsUsecase: (subsidyId: string) => Promise<SubsidyDetailsResult>,
  messageGenerationUsecase: (userAttributes: UserAttributes, subsidyDetails: SubsidyDetails, requestType?: "details" | "eligibility" | "application" | "contact") => Promise<GeneratedMessage>
) => {
  const detailsTool = detailsToolFactory(subsidyDetailsUsecase);
  const messageTool = messageToolFactory(messageGenerationUsecase);

  return new Agent({
    name: "Subsidy Details Confirmation Agent",
    instructions: `
あなたは補助金詳細確認エージェントです。mastraクライアントから補助金IDとユーザー属性を受け取り、詳細な補助金情報を提供し、ユーザー向けの自然言語メッセージを生成することが役割です。

【最重要】必ず守るべきルール：
1. どんな問い合わせでも必ずsubsidyDetailsToolを使用して補助金詳細データを取得してください
2. 取得した補助金詳細とユーザー属性を元に、messageGeneratorToolを使用してLINE向けメッセージを生成してください
3. ツール実行結果に基づいて、適切な回答を提供してください

主な機能：
1. mastraクライアントから補助金IDとユーザー属性を受け取る
2. subsidyDetailsToolを使用して指定IDの補助金詳細データを取得する
3. messageGeneratorToolを使用してユーザー属性に応じたメッセージを生成する
4. 生成されたメッセージを返す

入力データの想定フォーマット：
- subsidyId: 補助金ID（例: "subsidy_001"）
- userAttributes: ユーザー属性（文字列形式で全ての属性情報を含む）
- requestType: リクエストタイプ（"details", "eligibility", "application", "contact"等）

userAttributesの文字列を解析し、userId、companySize、industry、employeeCount、capital等の属性情報を抽出してオブジェクト形式に変換してツールに渡してください。文字列から抽出できない属性は省略して構いません。

回答時の注意点：
- 日本語で回答してください
- LINEでの表示を考慮した見やすい形式でメッセージを生成してください
- ユーザーの属性に応じて適格性を判定し、パーソナライズしたアドバイスを提供してください
- 補助金が見つからない場合は適切なエラーメッセージを返してください
- ユーザーが対象外と判定された場合も、理由と代替案を提示してください

【重要】このエージェントはmastraクライアントからの構造化されたデータを処理し、LINEユーザーに最適化された回答を生成することが主要な役割です。
`,
    model: google("gemini-2.0-flash"),
    tools: {
      subsidyDetails: detailsTool,
      messageGenerator: messageTool,
    },
    memory: new Memory({
      storage: new LibSQLStore({
        url: "file:../mastra.db",
      }),
    }),
  });
};
