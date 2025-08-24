import fs from "fs";
import path from "path";
import {
  SubsidyDetails,
  SubsidyDetailsRepository,
} from "../../repositories/subsidy-details-repository";

// Helper function to resolve JSON directory path
const resolveJSONDirectory = (jsonDirPath: string): string => {
  // If absolute path, use as is
  if (path.isAbsolute(jsonDirPath)) {
    return jsonDirPath;
  }
  // If relative path, resolve from project root
  const currentWorkingDir = process.cwd();
  const projectRoot = currentWorkingDir.includes(".mastra/output")
    ? path.resolve(currentWorkingDir, "../../")
    : currentWorkingDir;
  return path.join(projectRoot, jsonDirPath);
};

// Pure function to read single subsidy JSON file by ID
const readSubsidyData = async (jsonDirPath: string, subsidyId: string): Promise<SubsidyDetails | null> => {
  const resolvedDir = resolveJSONDirectory(jsonDirPath);
  const filePath = path.join(resolvedDir, `${subsidyId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null; // File not found - subsidy doesn't exist
  }

  try {
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const parsedData = JSON.parse(jsonData);
    
    return parsedData as SubsidyDetails;
  } catch (parseError) {
    if (parseError instanceof SyntaxError) {
      throw new Error(`JSONファイルの解析に失敗しました: ${filePath}. ${parseError.message}`);
    }
    throw parseError;
  }
};

export const createJSONSubsidyDetailsRepository = (
  jsonDirPath: string
): SubsidyDetailsRepository => {
  return {
    findById: async (subsidyId: string): Promise<SubsidyDetails | null> => {
      try {
        // 指定されたIDの補助金ファイルを直接読み込み
        const foundSubsidy = await readSubsidyData(jsonDirPath, subsidyId);
        return foundSubsidy;
        
      } catch (error) {
        console.error("Error in SubsidyDetailsRepository:", error);
        throw error; // Re-throw to let the usecase handle the error properly
      }
    },
  };
};