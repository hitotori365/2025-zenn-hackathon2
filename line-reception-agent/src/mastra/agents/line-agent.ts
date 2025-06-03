import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

export const lineAgent = new Agent({
  name: 'LINE Agent',
  instructions: `
    あなたはLINEボットのアシスタントです。ユーザーからのメッセージに対して、親切かつ簡潔に日本語で返答してください。
  `,
  model: google('gemini-2.5-flash-preview-05-20'),
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
}); 