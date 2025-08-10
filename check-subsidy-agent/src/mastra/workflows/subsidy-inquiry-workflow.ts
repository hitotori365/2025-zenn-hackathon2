import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const subsidyResultSchema = z.object({
  found: z.boolean(),
  results: z.array(z.object({
    id: z.string(),
    name: z.string(),
    summary: z.string(),
    keywords: z.array(z.string()),
    detail_id: z.string(),
  })),
  message: z.string(),
});

const searchSubsidiesWithAgent = createStep({
  id: 'search-subsidies-with-agent',
  description: 'エージェントを使用して問い合わせ内容に基づいて関連する補助金を検索する',
  inputSchema: z.object({
    query: z.string().describe('検索したい問い合わせ内容'),
  }),
  outputSchema: subsidyResultSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const agent = mastra?.getAgent('inquiryAgent');
    if (!agent) {
      throw new Error('Inquiry agent not found');
    }

    // エージェントに検索を実行させる
    const response = await agent.stream([
      {
        role: 'user',
        content: `以下の問い合わせ内容に関連する補助金を検索してください。必ずsubsidySearchToolを使用して検索を実行し、結果を返してください。

問い合わせ内容: ${inputData.query}`,
      },
    ]);

    let responseText = '';
    for await (const chunk of response.textStream) {
      responseText += chunk;
    }

    // エージェントの回答から検索結果を抽出
    // 実際の実装では、エージェントの回答を解析して結果を取得する必要があります
    // ここでは簡易的な実装として、エージェントの回答をそのまま返します
    return {
      found: true, // エージェントが検索を実行したことを示す
      results: [], // 実際の実装では検索結果を解析して取得
      message: responseText,
    };
  },
});

const formatResponse = createStep({
  id: 'format-response',
  description: '検索結果を整理して分かりやすい形式で返す',
  inputSchema: subsidyResultSchema,
  outputSchema: z.object({
    response: z.string(),
    found: z.boolean(),
    count: z.number(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    let formattedResponse = '';

    if (inputData.found && inputData.results.length > 0) {
      formattedResponse = inputData.message;
    } else {
      formattedResponse = `申し訳ございませんが、お問い合わせ内容に関連する補助金は見つかりませんでした。

以下のような情報をお教えいただけると、より適切な補助金をご案内できる可能性があります：
• 事業の種類や業界
• 対象となる規模（個人・中小企業・大企業など）
• 具体的な用途や目的
• 地域や所在地

お気軽に詳細をお聞かせください。`;
    }

    return {
      response: formattedResponse,
      found: inputData.found,
      count: inputData.results.length,
    };
  },
});

const subsidyInquiryWorkflow = createWorkflow({
  id: 'subsidy-inquiry-workflow',
  inputSchema: z.object({
    query: z.string().describe('検索したい問い合わせ内容'),
  }),
  outputSchema: z.object({
    response: z.string(),
    found: z.boolean(),
    count: z.number(),
  }),
})
  .then(searchSubsidiesWithAgent)
  .then(formatResponse);

subsidyInquiryWorkflow.commit();

export { subsidyInquiryWorkflow };