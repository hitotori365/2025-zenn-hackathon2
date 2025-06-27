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
