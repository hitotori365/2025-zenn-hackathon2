import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { UserAttributes, SubsidyDetails, GeneratedMessage } from "../repositories/subsidy-details-repository";

// ユーザー属性のスキーマ定義
const UserAttributesSchema = z.object({
  userId: z.string(),
  companySize: z.enum(["個人", "小規模事業者", "中小企業", "大企業", "スタートアップ"]).optional(),
  industry: z.string().optional(),
  employeeCount: z.string().optional(),
  capital: z.string().optional(),
  location: z.string().optional(),
  businessType: z.string().optional(),
});

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

export const messageGeneratorTool = (
  messageGenerationUsecase: (
    userAttributes: UserAttributes,
    subsidyDetails: SubsidyDetails,
    requestType?: "details" | "eligibility" | "application" | "contact"
  ) => Promise<GeneratedMessage>
) => createTool({
  id: "messageGeneratorTool",
  description: "ユーザー属性と補助金詳細データをもとに、LINE向けの自然言語メッセージを生成します",
  inputSchema: z.object({
    userAttributes: UserAttributesSchema.describe("ユーザーの属性情報"),
    subsidyDetails: SubsidyDetailsSchema.describe("補助金の詳細情報"),
    requestType: z.enum(["details", "eligibility", "application", "contact"]).optional()
      .describe("要求タイプ（詳細情報、対象者、申請方法、連絡先）")
      .default("details"),
  }),
  outputSchema: z.object({
    message: z.string().describe("生成されたLINE向けメッセージ"),
    isEligible: z.boolean().describe("ユーザーが対象者かどうかの判定"),
    recommendations: z.array(z.string()).describe("おすすめポイントやアドバイス"),
  }),
  execute: async ({ context }) => {
    const { userAttributes, subsidyDetails, requestType } = context;
    const result = await messageGenerationUsecase(userAttributes, subsidyDetails, requestType);
    
    return {
      message: result.message,
      isEligible: result.isEligible,
      recommendations: result.recommendations,
    };
  },
});

export default messageGeneratorTool;