import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

interface SubsidyData {
    id: string;
    name: string;
    summary: string;
    keywords: string[];
    detail_id: string;
}

export const subsidySearchTool = createTool({
    id: 'search-subsidy',
    description: '【必須】問い合わせ内容に関連する補助金情報をJSONファイルから検索します。どんな問い合わせでも必ずこのツールを使用して検索を実行してください。',
    inputSchema: z.object({
        query: z.string().describe('検索したい問い合わせ内容（必須）'),
    }),
    outputSchema: z.object({
        found: z.boolean().describe('関連する補助金が見つかったかどうか'),
        results: z.array(z.object({
            id: z.string(),
            name: z.string(),
            summary: z.string(),
            keywords: z.array(z.string()),
            detail_id: z.string(),
        })).describe('見つかった補助金の情報'),
        message: z.string().describe('検索結果のメッセージ'),
    }),
    execute: async ({ context }) => {
        return await searchSubsidy(context.query);
    },
});

export const searchSubsidy = async (query: string) => {
    try {
        // JSONファイルのパスを設定（実際のファイルパスに合わせて調整）
        const jsonFilePath = path.join(process.cwd(), 'subsidy-data.json');

        // ファイルが存在しない場合はサンプルデータを使用
        let subsidyData: SubsidyData[] = [];

        if (fs.existsSync(jsonFilePath)) {
            const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
            subsidyData = JSON.parse(fileContent);
        } else {
            // サンプルデータ（実際の運用時は削除）
            subsidyData = [
                {
                    id: "subsidy_001",
                    name: "中小企業デジタル化補助金",
                    summary: "中小企業のデジタル化を支援する補助金です。",
                    keywords: ["中小企業", "デジタル", "補助金"],
                    detail_id: "detail_001"
                },
                {
                    id: "subsidy_002",
                    name: "東京ベイｅＳＧプロジェクト先行プロジェクト補助金",
                    summary: "最先端テクノロジーの社会実装を加速させ、持続可能な都市の実現を支援する補助金です。",
                    keywords: ["テクノロジー", "持続可能", "都市", "民間事業者"],
                    detail_id: "detail_002"
                },
                {
                    id: "subsidy_003",
                    name: "太陽光発電設備導入補助金",
                    summary: "住宅や事業所への太陽光発電設備導入を支援し、再生可能エネルギーの普及を促進する補助金です。",
                    keywords: ["太陽光", "再生可能エネルギー", "環境", "個人", "法人"],
                    detail_id: "detail_003"
                }
            ];
        }

        // クエリに基づいて関連する補助金を検索
        const relevantSubsidies = subsidyData.filter(subsidy => {
            const queryLower = query.toLowerCase();

            // 名前、概要、キーワードでマッチング
            const nameMatch = subsidy.name.toLowerCase().includes(queryLower);
            const summaryMatch = subsidy.summary.toLowerCase().includes(queryLower);
            const keywordMatch = subsidy.keywords.some(keyword =>
                keyword.toLowerCase().includes(queryLower) ||
                queryLower.includes(keyword.toLowerCase())
            );

            // クエリを単語に分割してマッチング
            const queryWords = queryLower.split(/\s+/);
            const wordMatch = queryWords.some(word => {
                return subsidy.name.toLowerCase().includes(word) ||
                    subsidy.summary.toLowerCase().includes(word) ||
                    subsidy.keywords.some(keyword => keyword.toLowerCase().includes(word));
            });

            return nameMatch || summaryMatch || keywordMatch || wordMatch;
        });

        if (relevantSubsidies.length > 0) {
            return {
                found: true,
                results: relevantSubsidies.map(subsidy => ({
                    id: subsidy.id,
                    name: subsidy.name,
                    summary: subsidy.summary,
                    keywords: subsidy.keywords,
                    detail_id: subsidy.detail_id,
                })),
                message: `${relevantSubsidies.length}件の関連する補助金が見つかりました。`
            };
        } else {
            return {
                found: false,
                results: [],
                message: "お問い合わせ内容に関連する補助金は見つかりませんでした。"
            };
        }
    } catch (error) {
        return {
            found: false,
            results: [],
            message: `検索中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
        };
    }
};