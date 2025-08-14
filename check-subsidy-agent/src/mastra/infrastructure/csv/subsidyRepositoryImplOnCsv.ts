import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import { config } from "../../config/config.js";
import {
  SubsidyData,
  SubsidyRepository,
} from "../../repositories/subsidy-repository.js";
import { subsidyCSVRow } from "./subsidyCSVRow.js";

// Type for raw CSV data (allows string indexing)
type RawCSVData = Record<string, string>;

// Helper function to resolve CSV file path
const resolveCSVPath = (csvFilePath?: string, csvPath?: string): string => {
  if (csvFilePath) {
    // If absolute path, use as is
    if (path.isAbsolute(csvFilePath)) {
      return csvFilePath;
    }
    // If relative path, resolve from project root
    const currentFileUrl = import.meta.url;
    const currentFilePath = fileURLToPath(currentFileUrl);
    const currentDir = path.dirname(currentFilePath);
    const projectRoot = path.resolve(currentDir, "../../../../../");
    return path.join(projectRoot, csvFilePath);
  }

  // Default: resolve csvPath relative to project root
  const envPath = csvPath || config.csvPath;
  if (path.isAbsolute(envPath)) {
    return envPath;
  }

  const currentFileUrl = import.meta.url;
  const currentFilePath = fileURLToPath(currentFileUrl);
  const currentDir = path.dirname(currentFilePath);
  const projectRoot = path.resolve(currentDir, "../../../../../");
  return path.join(projectRoot, envPath);
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
      .pipe(csv())
      .on("data", (data: RawCSVData) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

// Curried function to create a mapper with custom CSV row mapping
const createCsvToSubsidyDataMapper =
  (csvRowMapper: SubsidyData) =>
  (csvRow: RawCSVData): SubsidyData => ({
    year: csvRow[csvRowMapper.year] || "",
    organizationNumber: csvRow[csvRowMapper.organizationNumber] || "",
    organization: csvRow[csvRowMapper.organization] || "",
    policyFieldNumber: csvRow[csvRowMapper.policyFieldNumber] || "",
    policyField: csvRow[csvRowMapper.policyField] || "",
    businessName: csvRow[csvRowMapper.businessName] || "",
    subsidyName: csvRow[csvRowMapper.subsidyName] || "",
    subsidyDescription: csvRow[csvRowMapper.subsidyDescription] || "",
    targetNumber: csvRow[csvRowMapper.targetNumber] || "",
    target: csvRow[csvRowMapper.target] || "",
    budgetAmount: csvRow[csvRowMapper.budgetAmount] || "",
    department: csvRow[csvRowMapper.department] || "",
    contact: csvRow[csvRowMapper.contact] || "",
    url: csvRow[csvRowMapper.url] || "",
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
  csvFilePath?: string
): SubsidyRepository => {
  const resolvedPath = resolveCSVPath(csvFilePath);

  // Return repository functions
  return {
    findAll: async (): Promise<SubsidyData[]> => {
      const rawCsvData = await readCSVData(resolvedPath);
      const csvMapper = createCsvToSubsidyDataMapper(subsidyCSVRow);
      return rawCsvData.map(csvMapper);
    },

    search: async (query: string): Promise<SubsidyData[]> => {
      const rawCsvData = await readCSVData(resolvedPath);
      const csvMapper = createCsvToSubsidyDataMapper(subsidyCSVRow);
      const subsidies = rawCsvData.map(csvMapper);
      return filterSubsidies(subsidies, query);
    },
  };
};
