import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Client } from '@line/bot-sdk';

// LINE設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

// LINEクライアントの初期化
const client = new Client(config);

if (!config.channelAccessToken || !config.channelSecret) {
  throw new Error('LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET are required');
}

export const lineTool = createTool({
  id: 'send-line-message',
  description: 'LINEにメッセージを送信するツール',
  inputSchema: z.object({
    replyToken: z.string().describe('LINEのリプライトークン'),
    message: z.string().describe('送信するメッセージ内容'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const { replyToken, message } = context;
      
      // LINEにメッセージを送信
      await client.replyMessage(replyToken, {
        type: 'text',
        text: message,
      });

      return {
        success: true,
        message: 'メッセージを正常に送信しました',
      };
    } catch (error) {
      console.error('LINE送信エラー:', error);
      return {
        success: false,
        message: `送信に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

// LINE Webhookイベントを処理する関数
export const handleLineEvent = async (event: any) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;
  const replyToken = event.replyToken;
  const aiResponse = await getAIResponse(userMessage);

  await client.replyMessage(replyToken, {
    type: 'text',
    text: aiResponse,
  });
};

// AIエージェントから回答を取得する関数（仮実装）
const getAIResponse = async (userMessage: string): Promise<string> => {
  // ここでweather-agentやline-agentにメッセージを送信
  // 実際の実装では、Mastraのエージェントを呼び出す
  return `AIからの回答: ${userMessage}`;
};