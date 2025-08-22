// Business data model (clean interface)
export interface SubsidyDetails {
  detail_id: string;
  id: string;
  name: string;
  summary: string;
  description: string;
  eligibility: {
    company_size?: string[];
    industry?: string[];
    employee_count?: string;
    capital?: string;
    requirements: string[];
  };
  support_details: {
    budget_range: string;
    subsidy_rate: string;
    supported_expenses: string[];
  };
  application_info: {
    application_period: string;
    selection_method: string;
    required_documents: string[];
  };
  contact: {
    organization: string;
    phone: string;
    website: string;
  };
}

// User attributes interface
export interface UserAttributes {
  userId: string;
  companySize?: "個人" | "小規模事業者" | "中小企業" | "大企業" | "スタートアップ";
  industry?: string;
  employeeCount?: string;
  capital?: string;
  location?: string;
  businessType?: string;
}

// Message generation result
export interface GeneratedMessage {
  message: string;
  isEligible: boolean;
  recommendations: string[];
}

// Repository function signatures (functional interface)
export type FindSubsidyDetailsById = (subsidyId: string) => Promise<SubsidyDetails | null>;

// Repository dependency bundle
export interface SubsidyDetailsRepository {
  findById: FindSubsidyDetailsById;
}