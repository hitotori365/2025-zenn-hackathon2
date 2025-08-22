import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { SubsidyDetailsResult } from "../usecase/getSubsidyDetailsUsecase";

// 補助金詳細データのスキーマ定義
const SubsidyDetailsSchema = z.object({
  detail_id: z.string(),
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  description: z.string(),
  eligibility: z.object({
    company_size: z.array(z.string()).optional(),
    industry: z.array(z.string()).optional(),
    employee_count: z.string().optional(),
    capital: z.string().optional(),
    requirements: z.array(z.string()),
  }),
  support_details: z.object({
    budget_range: z.string(),
    subsidy_rate: z.string(),
    supported_expenses: z.array(z.string()),
  }),
  application_info: z.object({
    application_period: z.string(),
    selection_method: z.string(),
    required_documents: z.array(z.string()),
  }),
  contact: z.object({
    organization: z.string(),
    phone: z.string(),
    website: z.string(),
  }),
});

export const subsidyDetailsTool = (
  subsidyDetailsUsecase: (subsidyId: string) => Promise<SubsidyDetailsResult>
) => createTool({
  id: "subsidyDetailsTool",
  description: "補助金のIDを受け取り、対応する補助金の詳細情報を取得します",
  inputSchema: z.object({
    subsidyId: z.string().describe("取得したい補助金のID（例: subsidy_001）"),
  }),
  outputSchema: z.object({
    found: z.boolean().describe("補助金が見つかったかどうか"),
    subsidyDetails: SubsidyDetailsSchema.optional().describe("補助金の詳細情報"),
    error: z.string().optional().describe("エラーメッセージ"),
  }),
  execute: async ({ context }) => {
    const { subsidyId } = context;
    const result = await subsidyDetailsUsecase(subsidyId);
    
    return {
      found: result.found,
      subsidyDetails: result.subsidyDetails,
      error: result.error,
    };
  },
});

export default subsidyDetailsTool;