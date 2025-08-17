import {
  SubsidyRepository,
  SubsidySearchResult,
} from "../repositories/subsidy-repository";

// Higher-order function to create search service
export const createSubsidySearchUsecase = (repository: SubsidyRepository) => {
  return async (query: string): Promise<SubsidySearchResult> => {
    try {
      const relevantSubsidies = await repository.search(query);

      if (relevantSubsidies.length > 0) {
        const summaryText = `${relevantSubsidies.length}件の補助金が見つかりました。主な対象: ${relevantSubsidies
          .slice(0, 3)
          .map((s) => s.target)
          .join("、")}`;

        return {
          found: true,
          count: relevantSubsidies.length,
          summary: summaryText,
          message: "使えそうな補助金があります",
        };
      } else {
        return {
          found: false,
          count: 0,
          summary: "関連する補助金は見つかりませんでした。",
          message: "該当する補助金はありません",
        };
      }
    } catch (error) {
      return {
        found: false,
        count: 0,
        summary: "検索中にエラーが発生しました。",
        message: `エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      };
    }
  };
};
