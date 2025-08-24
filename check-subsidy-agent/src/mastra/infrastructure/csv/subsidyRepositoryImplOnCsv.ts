import fs from "fs";
import path from "path";
import csv from "csv-parser";
import {
  SubsidyData,
  SubsidyRepository,
} from "../../repositories/subsidy-repository.js";

// Type for raw CSV data (allows string indexing)
type RawCSVData = Record<string, string>;

// Helper function to resolve CSV file path
const resolveCSVPath = (csvFilePath: string): string => {
  // If absolute path, use as is
  if (path.isAbsolute(csvFilePath)) {
    return csvFilePath;
  }
  // If relative path, resolve from project root
  const currentWorkingDir = process.cwd();
  const projectRoot = currentWorkingDir.includes(".mastra/output")
    ? path.resolve(currentWorkingDir, "../../")
    : currentWorkingDir;
  return path.join(projectRoot, csvFilePath);
};

// Pure function to read raw CSV data
const readCSVData = async (csvFilePath: string): Promise<RawCSVData[]> => {
  return new Promise((resolve, reject) => {
    const results: RawCSVData[] = [];

    if (!fs.existsSync(csvFilePath)) {
      reject(new Error(`CSVファイルが見つかりません: ${csvFilePath}`));
      return;
    }

    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: '\t' }))
      .on("data", (data: RawCSVData) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

// Function to map CSV row to SubsidyData
const mapCsvToSubsidyData = (csvRow: RawCSVData): SubsidyData => ({
  year: csvRow.id || "",
  organizationNumber: csvRow.id || "",
  organization: csvRow.id || "",
  policyFieldNumber: csvRow.id || "",
  policyField: csvRow.id || "",
  businessName: csvRow.id || "",
  subsidyName: csvRow.name || "",
  subsidyDescription: csvRow.summary || "",
  targetNumber: csvRow.id || "",
  target: csvRow.id || "",
  budgetAmount: csvRow.id || "",
  department: csvRow.id || "",
  contact: csvRow.id || "",
  url: csvRow.id || "",
});

// Pure function to perform search filtering
const filterSubsidies = (
  subsidies: SubsidyData[],
  query: string
): SubsidyData[] => {
  const queryLower = query.toLowerCase();

  return subsidies.filter((subsidy) => {
    // Search across key fields
    const nameMatch = subsidy.subsidyName.toLowerCase().includes(queryLower);
    const descriptionMatch = subsidy.subsidyDescription
      .toLowerCase()
      .includes(queryLower);
    const targetMatch = subsidy.target.toLowerCase().includes(queryLower);
    const businessMatch = subsidy.businessName
      .toLowerCase()
      .includes(queryLower);

    // Word-based matching for better search coverage
    const queryWords = queryLower.split(/\s+/);
    const wordMatch = queryWords.some((word) => {
      return (
        subsidy.subsidyName.toLowerCase().includes(word) ||
        subsidy.subsidyDescription.toLowerCase().includes(word) ||
        subsidy.target.toLowerCase().includes(word) ||
        subsidy.businessName.toLowerCase().includes(word)
      );
    });

    return (
      nameMatch || descriptionMatch || targetMatch || businessMatch || wordMatch
    );
  });
};

// Higher-order function to create CSV-based repository
export const createCSVSubsidyRepository = (
  csvFilePath: string
): SubsidyRepository => {
  const resolvedPath = resolveCSVPath(csvFilePath);

  // Return repository functions
  return {
    findAll: async (): Promise<SubsidyData[]> => {
      const rawCsvData = await readCSVData(resolvedPath);
      return rawCsvData.map(mapCsvToSubsidyData);
    },

    search: async (query: string): Promise<SubsidyData[]> => {
      const rawCsvData = await readCSVData(resolvedPath);
      const subsidies = rawCsvData.map(mapCsvToSubsidyData);
      return filterSubsidies(subsidies, query);
    },
  };
};
