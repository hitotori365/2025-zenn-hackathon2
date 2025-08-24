import { MastraClient } from "@mastra/client-js";
import { Client } from '@line/bot-sdk';
import { checkMessageRelevance } from '../utils/messageRelevanceChecker';
import { checkSubsidyFound } from '../utils/subsidyResultChecker';
import { saveUserSession, isActiveSessionWithinTimeLimit, updateLastActivityAt, saveSelectedSubsidy } from '../utils/firestoreService';
import { performVectorSearch } from '../utils/vectorSearchService';

// Workflow input type
interface LineWebhookInput {
  userId: string;
  messageText: string;
  replyToken?: string;
}


// LINEメッセージ送信のヘルパー関数
const sendLineMessage = async (
  lineClient: Client,
  userId: string,
  message: string,
  replyToken?: string
): Promise<void> => {
  const messageObj = { type: 'text' as const, text: message };
  
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
    // ベクトル検索を実行
    try {
      const searchResult = await performVectorSearch(input.messageText);
      
      // FirestoreにsubsidyIdを保存
      await saveSelectedSubsidy(input.userId, {
        id: searchResult.subsidyId,
        name: searchResult.subsidyName
      });
      
      // 結果をテスト用に返すメッセージ
      const testMessage = `最も関連する補助金: ${searchResult.subsidyName} (ID: ${searchResult.subsidyId}, 類似度: ${searchResult.similarity.toFixed(4)})`;
      
      if (lineClient) {
        await sendLineMessage(lineClient, input.userId, testMessage, input.replyToken);
      }
      
      return { success: true, message: testMessage };
      
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