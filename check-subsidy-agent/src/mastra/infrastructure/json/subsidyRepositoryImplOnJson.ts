import {
  SubsidyData,
  SubsidyRepository,
} from "../../repositories/subsidy-repository";

// Example JSON-based repository implementation
export const createJSONSubsidyRepository = (
  jsonFilePath?: string
): SubsidyRepository => {
  // Mock implementation for demonstration
  const mockData: SubsidyData[] = [
    {
      year: "2024",
      organizationNumber: "01",
      organization: "政策企画局",
      policyFieldNumber: "17",
      policyField: "その他",
      businessName: "デジタル化推進事業",
      subsidyName: "デジタル化支援補助金",
      subsidyDescription: "企業のデジタル化を支援する補助金です",
      targetNumber: "1",
      target: "中小企業",
      budgetAmount: "1000000",
      department: "デジタル政策課",
      contact: "03-1234-5678",
      url: "https://example.com",
    },
  ];

  return {
    findAll: async (): Promise<SubsidyData[]> => {
      // In real implementation, read from JSON file
      return mockData;
    },

    search: async (query: string): Promise<SubsidyData[]> => {
      const queryLower = query.toLowerCase();
      return mockData.filter(
        (subsidy) =>
          subsidy.subsidyName.toLowerCase().includes(queryLower) ||
          subsidy.subsidyDescription.toLowerCase().includes(queryLower)
      );
    },
  };
};
