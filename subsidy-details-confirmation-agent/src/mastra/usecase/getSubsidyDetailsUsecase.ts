import {
  SubsidyDetails,
  SubsidyDetailsRepository,
} from "../repositories/subsidy-details-repository";

// 補助金詳細取得のユースケース結果
export interface SubsidyDetailsResult {
  found: boolean;
  subsidyDetails?: SubsidyDetails;
  error?: string;
}

// 補助金詳細取得ユースケース
export const createSubsidyDetailsUsecase = (repository: SubsidyDetailsRepository) => {
  return async (subsidyId: string): Promise<SubsidyDetailsResult> => {
    try {
      const subsidyDetails = await repository.findById(subsidyId);
      
      if (!subsidyDetails) {
        return {
          found: false,
          error: `ID "${subsidyId}" に対応する補助金の詳細情報が見つかりません`,
        };
      }

      return {
        found: true,
        subsidyDetails,
      };
      
    } catch (error) {
      return {
        found: false,
        error: `補助金詳細情報の取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };
};