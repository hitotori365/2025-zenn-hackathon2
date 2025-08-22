import {
  SubsidyDetails,
  UserAttributes,
  GeneratedMessage,
} from "../repositories/subsidy-details-repository";

// メッセージ生成ユースケース
export const createMessageGenerationUsecase = () => {
  return async (
    userAttributes: UserAttributes, 
    subsidyDetails: SubsidyDetails, 
    requestType: "details" | "eligibility" | "application" | "contact" = "details"
  ): Promise<GeneratedMessage> => {
    try {
      // ユーザーの適格性を判定
      const isEligible = checkEligibility(userAttributes, subsidyDetails);
      
      // 推奨ポイントを生成
      const recommendations = generateRecommendations(userAttributes, subsidyDetails, isEligible);
      
      // メッセージを生成
      let message = "";
      
      switch (requestType) {
        case "details":
          message = generateDetailMessage(subsidyDetails, userAttributes, isEligible, recommendations);
          break;
        case "eligibility":
          message = generateEligibilityMessage(subsidyDetails, userAttributes, isEligible);
          break;
        case "application":
          message = generateApplicationMessage(subsidyDetails);
          break;
        case "contact":
          message = generateContactMessage(subsidyDetails);
          break;
        default:
          message = generateDetailMessage(subsidyDetails, userAttributes, isEligible, recommendations);
      }

      return {
        message,
        isEligible,
        recommendations,
      };
      
    } catch (error) {
      console.error("Error in messageGenerationUsecase:", error);
      return {
        message: "申し訳ございません。メッセージの生成中にエラーが発生しました。",
        isEligible: false,
        recommendations: [],
      };
    }
  };
};

// ユーザーの適格性を判定する関数
function checkEligibility(userAttributes: UserAttributes, subsidyDetails: SubsidyDetails): boolean {
  const eligibility = subsidyDetails.eligibility;
  
  // 企業規模のチェック
  if (eligibility.company_size && userAttributes.companySize) {
    if (!eligibility.company_size.includes(userAttributes.companySize)) {
      return false;
    }
  }
  
  // 業界のチェック
  if (eligibility.industry && userAttributes.industry) {
    const isIndustryMatch = eligibility.industry.some(industry => 
      userAttributes.industry?.includes(industry) || industry.includes(userAttributes.industry!)
    );
    if (!isIndustryMatch) {
      return false;
    }
  }
  
  return true;
}

// 推奨ポイントを生成する関数
function generateRecommendations(
  userAttributes: UserAttributes, 
  subsidyDetails: SubsidyDetails,
  isEligible: boolean
): string[] {
  const recommendations: string[] = [];
  
  if (isEligible) {
    recommendations.push("あなたの事業内容に適合している可能性が高いです");
    
    // 支援内容に基づく推奨
    const expenses = subsidyDetails.support_details.supported_expenses;
    if (expenses.some(expense => expense.includes("IT") || expense.includes("デジタル"))) {
      recommendations.push("IT投資やデジタル化に活用できます");
    }
    if (expenses.some(expense => expense.includes("人材") || expense.includes("研修"))) {
      recommendations.push("人材育成・研修費用として活用できます");
    }
    
    recommendations.push("早めの申請準備をおすすめします");
  } else {
    recommendations.push("現在の情報では対象外の可能性があります");
    recommendations.push("詳細な要件を確認されることをおすすめします");
  }
  
  return recommendations;
}

// 詳細メッセージを生成
function generateDetailMessage(
  subsidyDetails: SubsidyDetails,
  userAttributes: UserAttributes,
  isEligible: boolean,
  recommendations: string[]
): string {
  const eligibilityStatus = isEligible ? "✅ 対象の可能性があります" : "⚠️ 要件をご確認ください";
  
  let message = `📋 ${subsidyDetails.name}\n\n`;
  message += `${eligibilityStatus}\n\n`;
  message += `【概要】\n${subsidyDetails.description}\n\n`;
  message += `【支援内容】\n`;
  message += `💰 予算規模: ${subsidyDetails.support_details.budget_range}\n`;
  message += `📊 補助率: ${subsidyDetails.support_details.subsidy_rate}\n\n`;
  message += `【対象経費】\n`;
  subsidyDetails.support_details.supported_expenses.forEach((expense, index) => {
    message += `${index + 1}. ${expense}\n`;
  });
  
  if (recommendations.length > 0) {
    message += `\n【おすすめポイント】\n`;
    recommendations.forEach(rec => {
      message += `• ${rec}\n`;
    });
  }
  
  message += `\n【申請期間】\n${subsidyDetails.application_info.application_period}\n\n`;
  message += `詳細な要件や申請方法については、下記までお問い合わせください。\n`;
  message += `${subsidyDetails.contact.organization}\n`;
  message += `📞 ${subsidyDetails.contact.phone}\n`;
  message += `🌐 ${subsidyDetails.contact.website}`;
  
  return message;
}

// 適格性メッセージを生成
function generateEligibilityMessage(
  subsidyDetails: SubsidyDetails,
  userAttributes: UserAttributes,
  isEligible: boolean
): string {
  let message = `📋 ${subsidyDetails.name}\n\n`;
  
  const eligibilityStatus = isEligible ? "✅ あなたは対象の可能性があります" : "⚠️ 対象要件をご確認ください";
  message += `${eligibilityStatus}\n\n`;
  
  message += `【対象要件】\n`;
  if (subsidyDetails.eligibility.company_size) {
    message += `企業規模: ${subsidyDetails.eligibility.company_size.join("、")}\n`;
  }
  if (subsidyDetails.eligibility.industry) {
    message += `対象業界: ${subsidyDetails.eligibility.industry.join("、")}\n`;
  }
  if (subsidyDetails.eligibility.employee_count) {
    message += `従業員数: ${subsidyDetails.eligibility.employee_count}\n`;
  }
  if (subsidyDetails.eligibility.capital) {
    message += `資本金: ${subsidyDetails.eligibility.capital}\n`;
  }
  
  message += `\n【その他の要件】\n`;
  subsidyDetails.eligibility.requirements.forEach((req, index) => {
    message += `${index + 1}. ${req}\n`;
  });
  
  if (!isEligible) {
    message += `\n詳細な要件については、実施機関にご相談されることをおすすめします。`;
  }
  
  return message;
}

// 申請方法メッセージを生成
function generateApplicationMessage(subsidyDetails: SubsidyDetails): string {
  let message = `📋 ${subsidyDetails.name}\n申請方法について\n\n`;
  
  message += `【申請期間】\n${subsidyDetails.application_info.application_period}\n\n`;
  message += `【選考方法】\n${subsidyDetails.application_info.selection_method}\n\n`;
  message += `【必要書類】\n`;
  subsidyDetails.application_info.required_documents.forEach((doc, index) => {
    message += `${index + 1}. ${doc}\n`;
  });
  
  message += `\n申請についての詳細は、実施機関にお問い合わせください。\n`;
  message += `${subsidyDetails.contact.organization}\n`;
  message += `📞 ${subsidyDetails.contact.phone}\n`;
  message += `🌐 ${subsidyDetails.contact.website}`;
  
  return message;
}

// 連絡先メッセージを生成
function generateContactMessage(subsidyDetails: SubsidyDetails): string {
  let message = `📋 ${subsidyDetails.name}\n連絡先情報\n\n`;
  
  message += `【実施機関】\n${subsidyDetails.contact.organization}\n\n`;
  message += `【電話番号】\n${subsidyDetails.contact.phone}\n\n`;
  message += `【ウェブサイト】\n${subsidyDetails.contact.website}\n\n`;
  message += `お問い合わせの際は、補助金名をお伝えいただくとスムーズです。`;
  
  return message;
}