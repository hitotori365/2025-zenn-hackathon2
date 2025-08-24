import { MastraClient } from "@mastra/client-js";
import { Client } from '@line/bot-sdk';
import { checkMessageRelevance } from '../utils/messageRelevanceChecker';
import { checkSubsidyFound } from '../utils/subsidyResultChecker';
import { saveUserSession, isActiveSessionWithinTimeLimit, updateLastActivityAt, saveSelectedSubsidy } from '../utils/firestoreService';
import { performVectorSearchTopN } from '../utils/vectorSearchService';
import type { FlexMessage } from '@line/bot-sdk';

// Workflow input type
interface LineWebhookInput {
  userId: string;
  messageText: string;
  replyToken?: string;
}

// Postback input type
interface LinePostbackInput {
  userId: string;
  data: string;
  replyToken?: string;
}


// 補助金選択用のFlexメッセージを作成
const createSubsidySelectionFlexMessage = (subsidies: Array<{subsidyId: string, subsidyName: string, similarity: number}>): FlexMessage => {
  const bubbles = subsidies.map((subsidy, index) => ({
    type: "bubble" as const,
    hero: {
      type: "box" as const,
      layout: "vertical" as const,
      contents: [
        {
          type: "text" as const,
          text: `${index + 1}位`,
          weight: "bold" as const,
          size: "xl" as const,
          align: "center" as const,
          color: "#ffffff"
        }
      ],
      backgroundColor: index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32",
      paddingAll: "20px"
    },
    body: {
      type: "box" as const,
      layout: "vertical" as const,
      contents: [
        {
          type: "text" as const,
          text: subsidy.subsidyName,
          weight: "bold" as const,
          size: "lg" as const,
          wrap: true
        },
        {
          type: "text" as const,
          text: `類似度: ${(subsidy.similarity * 100).toFixed(1)}%`,
          size: "sm" as const,
          color: "#888888",
          margin: "md"
        }
      ]
    },
    footer: {
      type: "box" as const,
      layout: "vertical" as const,
      spacing: "sm",
      contents: [
        {
          type: "button" as const,
          style: "primary" as const,
          height: "sm",
          action: {
            type: "postback" as const,
            label: "この補助金を選択",
            data: `action=select_subsidy&subsidy_id=${subsidy.subsidyId}&subsidy_name=${subsidy.subsidyName}`
          }
        }
      ],
      flex: 0
    }
  }));

  return {
    type: "flex",
    altText: "補助金の候補が見つかりました",
    contents: {
      type: "carousel",
      contents: bubbles
    }
  };
};

// LINEメッセージ送信のヘルパー関数
const sendLineMessage = async (
  lineClient: Client,
  userId: string,
  message: string | FlexMessage,
  replyToken?: string
): Promise<void> => {
  const messageObj = typeof message === 'string' 
    ? { type: 'text' as const, text: message }
    : message;
  
  try {
    if (replyToken) {
      await lineClient.replyMessage(replyToken, messageObj);
    } else {
      await lineClient.pushMessage(userId, messageObj);
    }
    console.log(`Successfully sent message to ${userId}`);
  } catch (error) {
    // replyTokenが期限切れの場合はpushMessageで再試行
    if (replyToken && error instanceof Error && error.message.includes('Invalid reply token')) {
      console.warn('Reply token expired, using push message instead');
      await lineClient.pushMessage(userId, messageObj);
      console.log(`Successfully sent push message to ${userId}`);
    } else {
      throw error;
    }
  }
};


// Workflow handler function
export const handleLineWebhook = async (
  mastraClient: MastraClient,
  lineClient: Client | null,
  input: LineWebhookInput
) => {
  console.log(`Processing message for user ${input.userId}`);
  
  try {
    // アクティブセッションが30秒以内かチェック
    const hasActiveSession = await isActiveSessionWithinTimeLimit(input.userId, 30);
    if (hasActiveSession) {
      console.log('User has active session within 30 seconds. Transitioning to detail agent.');
      
      // lastActivityAtを更新
      try {
        await updateLastActivityAt(input.userId);
        console.log('Updated lastActivityAt for active session');
      } catch (error) {
        console.error('Failed to update lastActivityAt:', error);
        // 更新に失敗してもLINEへの返信は続行
      }
      
      // 固定メッセージを返信
      const fixedMessage = '詳細確認エージェントとのやり取りに遷移';
      
      if (lineClient) {
        await sendLineMessage(lineClient, input.userId, fixedMessage, input.replyToken);
      }
      
      return { success: true, message: fixedMessage };
    }
    
    // メッセージの関連性をチェック
    const relevanceCheck = await checkMessageRelevance(input.messageText);
    console.log(`Message relevance score: ${relevanceCheck.score}`);
    
    // 関連性が低い場合は早期終了（返信なし）
    if (!relevanceCheck.isRelevant) {
      console.log('Message is not relevant to subsidies. Skipping processing.');
      return { success: true, message: 'Message not relevant - no response sent' };
    }
    // ベクトル検索を実行（上位3件）
    try {
      const searchResults = await performVectorSearchTopN(input.messageText, 3);
      
      // 結果が0件の場合
      if (searchResults.results.length === 0) {
        const noResultMessage = '申し訳ございません。関連する補助金が見つかりませんでした。';
        if (lineClient) {
          await sendLineMessage(lineClient, input.userId, noResultMessage, input.replyToken);
        }
        return { success: true, message: noResultMessage };
      }
      
      // Flexメッセージを作成して送信
      const flexMessage = createSubsidySelectionFlexMessage(searchResults.results);
      
      if (lineClient) {
        await sendLineMessage(lineClient, input.userId, flexMessage, input.replyToken);
      }
      
      console.log(`Sent subsidy selection flex message with ${searchResults.results.length} options to user ${input.userId}`);
      
      return { success: true, message: `Found ${searchResults.results.length} subsidy candidates` };
      
    } catch (error) {
      console.error('Error performing vector search:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error processing LINE message:', error);
    
    if (lineClient) {
      const errorMessage = '申し訳ございません。現在メッセージを処理できません。';
      await sendLineMessage(lineClient, input.userId, errorMessage, input.replyToken)
        .catch(err => console.error('Failed to send error message:', err));
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
};

// Postback handler function
export const handleLinePostback = async (
  mastraClient: MastraClient,
  lineClient: Client | null,
  input: LinePostbackInput
) => {
  console.log(`Processing postback for user ${input.userId}, data: ${input.data}`);
  
  try {
    // Postbackデータをパース
    const params = new URLSearchParams(input.data);
    const action = params.get('action');
    
    if (action === 'select_subsidy') {
      const subsidyId = params.get('subsidy_id');
      const subsidyName = params.get('subsidy_name');
      
      console.log(`User selected subsidy: ${subsidyName} (ID: ${subsidyId})`);
      
      // FirestoreにsubsidyIdを保存
      if (subsidyId && subsidyName) {
        await saveSelectedSubsidy(input.userId, {
          id: subsidyId,
          name: subsidyName
        });
        console.log(`Saved selected subsidy to Firestore: ${subsidyId}`);
        
        // 確認メッセージを送信
        const confirmMessage = `「${subsidyName}」を選択しました。\n詳細確認エージェントとのやり取りに遷移します。`;
        
        if (lineClient) {
          await sendLineMessage(lineClient, input.userId, confirmMessage, input.replyToken);
        }
        
        return { success: true, message: confirmMessage };
      } else {
        throw new Error('Invalid postback data: missing subsidy_id or subsidy_name');
      }
    }
    
    // 未知のアクション
    console.warn(`Unknown postback action: ${action}`);
    return { success: true, message: 'Unknown postback action' };
    
  } catch (error) {
    console.error('Error processing postback:', error);
    
    if (lineClient) {
      const errorMessage = '申し訳ございません。選択の処理中にエラーが発生しました。';
      await sendLineMessage(lineClient, input.userId, errorMessage, input.replyToken)
        .catch(err => console.error('Failed to send error message:', err));
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
};