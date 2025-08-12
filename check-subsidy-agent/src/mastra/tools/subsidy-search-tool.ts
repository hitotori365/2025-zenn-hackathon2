import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { SubsidySearchResult } from "../repositories/subsidy-repository.js";

export const subsidySearchTool = (
  searchService: (query: string) => Promise<SubsidySearchResult>
) =>
  createTool({
    id: "search-subsidy",
    description:
      "【必須】問い合わせ内容に関連する補助金情報をCSVファイルから検索します。どんな問い合わせでも必ずこのツールを使用して検索を実行してください。",
    inputSchema: z.object({
      query: z.string().describe("検索したい問い合わせ内容（必須）"),
    }),
    outputSchema: z.object({
      found: z.boolean().describe("関連する補助金が見つかったかどうか"),
      count: z.number().describe("見つかった補助金の件数"),
      summary: z.string().describe("検索結果の要約"),
      message: z.string().describe("判定結果メッセージ"),
    }),
    execute: async ({ context }) => {
      return await searchService(context.query);
    },
  });
