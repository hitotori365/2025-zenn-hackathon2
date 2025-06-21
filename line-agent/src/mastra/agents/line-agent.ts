import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { weatherTool } from '../tools/weather-tool';

export const lineAgent = new Agent({
  name: 'LINE Agent',
  description: 'LINEからのメッセージを処理するエージェント',
  instructions: `
    あなたはLINEアシスタントです。ユーザーからのメッセージに応じて、天気に関する質問か一般的な質問かを判断してください。

    - メッセージに「天気」「気温」「気候」などのキーワードが含まれている場合は、天気に関する質問と判断し、'weatherTool'を使用して天気情報を返してください。
    - それ以外の一般的な質問の場合は、フレンドリーな会話で応答してください。
    - 回答は常に日本語で行ってください。
  `,
  model: google('gemini-1.5-pro-latest'),
  tools: { weatherTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
}); 