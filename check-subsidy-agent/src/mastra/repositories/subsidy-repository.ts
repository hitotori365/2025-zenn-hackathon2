// Business data model (clean interface)
export interface SubsidyData {
  year: string;
  organizationNumber: string;
  organization: string;
  policyFieldNumber: string;
  policyField: string;
  businessName: string;
  subsidyName: string;
  subsidyDescription: string;
  targetNumber: string;
  target: string;
  budgetAmount: string;
  department: string;
  contact: string;
  url: string;
}

// Search result type
export interface SubsidySearchResult {
  found: boolean;
  count: number;
  summary: string;
  message: string;
  subsidies?: SubsidyData[]; // 補助金詳細情報
}

// Repository function signatures (functional interface)
export type FindAllSubsidies = () => Promise<SubsidyData[]>;
export type SearchSubsidies = (query: string) => Promise<SubsidyData[]>;

// Repository dependency bundle
export interface SubsidyRepository {
  findAll: FindAllSubsidies;
  search: SearchSubsidies;
}
