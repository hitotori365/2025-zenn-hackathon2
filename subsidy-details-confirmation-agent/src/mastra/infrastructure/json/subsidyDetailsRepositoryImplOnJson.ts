import fs from "fs";
import path from "path";
import {
  SubsidyDetails,
  SubsidyDetailsRepository,
} from "../../repositories/subsidy-details-repository";

// Helper function to resolve JSON file path
const resolveJSONPath = (jsonFilePath: string): string => {
  // If absolute path, use as is
  if (path.isAbsolute(jsonFilePath)) {
    return jsonFilePath;
  }
  // If relative path, resolve from project root
  const currentWorkingDir = process.cwd();
  const projectRoot = currentWorkingDir.includes(".mastra/output")
    ? path.resolve(currentWorkingDir, "../../")
    : currentWorkingDir;
  return path.join(projectRoot, jsonFilePath);
};

// Pure function to read JSON data
const readJSONData = async (jsonFilePath: string): Promise<SubsidyDetails[]> => {
  const resolvedPath = resolveJSONPath(jsonFilePath);
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`JSONファイルが見つかりません: ${resolvedPath}`);
  }

  try {
    const jsonData = fs.readFileSync(resolvedPath, "utf-8");
    const parsedData = JSON.parse(jsonData);
    
    if (!Array.isArray(parsedData)) {
      throw new Error(`JSONファイルの形式が正しくありません。配列である必要があります: ${resolvedPath}`);
    }

    return parsedData as SubsidyDetails[];
  } catch (parseError) {
    if (parseError instanceof SyntaxError) {
      throw new Error(`JSONファイルの解析に失敗しました: ${resolvedPath}. ${parseError.message}`);
    }
    throw parseError;
  }
};

export const createJSONSubsidyDetailsRepository = (
  jsonFilePath: string
): SubsidyDetailsRepository => {
  return {
    findById: async (subsidyId: string): Promise<SubsidyDetails | null> => {
      try {
        const jsonData = await readJSONData(jsonFilePath);
        
        // 指定されたIDの補助金を検索
        const foundSubsidy = jsonData.find(subsidy => subsidy.id === subsidyId);
        return foundSubsidy || null;
        
      } catch (error) {
        console.error("Error in SubsidyDetailsRepository:", error);
        throw error; // Re-throw to let the usecase handle the error properly
      }
    },
  };
};