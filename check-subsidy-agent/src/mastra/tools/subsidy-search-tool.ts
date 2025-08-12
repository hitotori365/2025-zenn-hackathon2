import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

interface SubsidyCSVRow {
    年度: string;
    '所管局№': string;
    所管局: string;
    '施策分野№': string;
    施策分野: string;
    事業名: string;
    補助金名: string;
    補助金の概要: string;
    '補助対象者№': string;
    補助対象者: string;
    '令和６年度予算額（千円）': string;
    所管部署: string;
    問い合わせ先: string;
    各局HPリンク: string;
}

export const subsidySearchTool = createTool({
    id: 'search-subsidy',
    description: '【必須】問い合わせ内容に関連する補助金情報をCSVファイルから検索します。どんな問い合わせでも必ずこのツールを使用して検索を実行してください。',
    inputSchema: z.object({
        query: z.string().describe('検索したい問い合わせ内容（必須）'),
    }),
    outputSchema: z.object({
        found: z.boolean().describe('関連する補助金が見つかったかどうか'),
        count: z.number().describe('見つかった補助金の件数'),
        summary: z.string().describe('検索結果の要約'),
        message: z.string().describe('判定結果メッセージ'),
    }),
    execute: async ({ context }) => {
        return await searchSubsidy(context.query);
    },
});

const readCSVData = async (): Promise<SubsidyCSVRow[]> => {
    return new Promise((resolve, reject) => {
        const results: SubsidyCSVRow[] = [];
        // ES modules対応: import.meta.urlを使用してプロジェクトルートを取得
        const currentFileUrl = import.meta.url;
        const currentFilePath = fileURLToPath(currentFileUrl);
        const currentDir = path.dirname(currentFilePath);
        const projectRoot = path.resolve(currentDir, '../../../');
        const csvFilePath = path.join(projectRoot, 'hojokin2024.csv');
        
        if (!fs.existsSync(csvFilePath)) {
            reject(new Error(`CSVファイルが見つかりません: ${csvFilePath}`));
            return;
        }
        
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (data: SubsidyCSVRow) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

export const searchSubsidy = async (query: string) => {
    try {
        const csvData = await readCSVData();

        // クエリに基づいて関連する補助金を検索
        const relevantSubsidies = csvData.filter(row => {
            const queryLower = query.toLowerCase();
            
            // CSVフィールドでマッチング
            const nameMatch = row.補助金名.toLowerCase().includes(queryLower);
            const summaryMatch = row.補助金の概要.toLowerCase().includes(queryLower);
            const targetMatch = row.補助対象者.toLowerCase().includes(queryLower);
            const businessMatch = row.事業名.toLowerCase().includes(queryLower);
            
            // クエリを単語に分割してマッチング
            const queryWords = queryLower.split(/\s+/);
            const wordMatch = queryWords.some(word => {
                return row.補助金名.toLowerCase().includes(word) ||
                    row.補助金の概要.toLowerCase().includes(word) ||
                    row.補助対象者.toLowerCase().includes(word) ||
                    row.事業名.toLowerCase().includes(word);
            });
            
            return nameMatch || summaryMatch || targetMatch || businessMatch || wordMatch;
        });

        if (relevantSubsidies.length > 0) {
            const summaryText = `${relevantSubsidies.length}件の補助金が見つかりました。主な対象: ${relevantSubsidies.slice(0, 3).map(s => s.補助対象者).join('、')}`;
            
            return {
                found: true,
                count: relevantSubsidies.length,
                summary: summaryText,
                message: "使えそうな補助金があります"
            };
        } else {
            return {
                found: false,
                count: 0,
                summary: "関連する補助金は見つかりませんでした。",
                message: "該当する補助金はありません"
            };
        }
    } catch (error) {
        return {
            found: false,
            count: 0,
            summary: "検索中にエラーが発生しました。",
            message: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
        };
    }
};