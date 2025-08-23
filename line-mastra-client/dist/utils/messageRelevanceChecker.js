import OpenAI from 'openai';
const openai = new OpenAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});
export async function checkMessageRelevance(message) {
    try {
        const prompt = `以下のメッセージが補助金・控除・経済的支援に関連する内容かを1-5で評価してください。

評価基準：
5: 明確に関連（補助金・控除を直接求めている）
4: 関連あり（経済的な不安や支援を求めている）
3: やや関連（間接的に経済的な話題）
2: ほぼ関連なし（一般的な会話）
1: 全く関連なし

判定のポイント：
- 「〇〇したい」という表現があるか
- お金・経済・生活の不安に関する内容か
- 支援・補助・援助を求める内容か

メッセージ: ${message}

評価（数字のみ）:`;
        const response = await openai.chat.completions.create({
            model: 'gemini-2.0-flash',
            messages: [
                {
                    role: 'system',
                    content: '与えられたメッセージの補助金・経済支援との関連性を1-5の数値のみで評価してください。',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3,
            max_tokens: 10,
        });
        const scoreText = response.choices[0].message.content?.trim() || '1';
        const score = parseInt(scoreText, 10);
        // スコアが有効な範囲でない場合は1とする
        const validScore = isNaN(score) || score < 1 || score > 5 ? 1 : score;
        return {
            score: validScore,
            isRelevant: validScore >= 3,
        };
    }
    catch (error) {
        console.error('Error checking message relevance:', error);
        // エラー時は関連ありとして処理を続行
        return {
            score: 3,
            isRelevant: true,
        };
    }
}
