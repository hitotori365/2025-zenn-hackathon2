<<<<<<< HEAD
import { Agent } from "@mastra/core/agent";
import { google } from '@ai-sdk/google';
import { gomiData, subsidyDescription, } from './data/namagomi';

export const lineAgent = new Agent({
    name: "Rule Agent",
    description: "ルールに関する質問に答えるエージェント",
    instructions: `
あなたは助成金制度に関する専門エージェントです。
各自治体の助成金制度について関係ある話題であれば助成金制度について正確な情報を提供し、関係ない話題であれば「無関係」とのみ回答してください。

以下のデータベースを参照して回答してください：

${subsidyDescription}

データ: ${JSON.stringify(gomiData, null, 2)}

ユーザーからの質問に対して：
1. 該当する自治体の助成金情報を正確に提供する
2. 助成率、上限金額、申請方法、問合せ先を明確に回答する
3. 助成金がない場合は、その旨を伝える
4. 詳細は各自治体窓口で確認するよう案内する

回答は親切で分かりやすく、正確な情報のみを提供してください。
`,
    model: google('gemini-2.5-flash-preview-05-20'),
});
=======
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
>>>>>>> origin/main
