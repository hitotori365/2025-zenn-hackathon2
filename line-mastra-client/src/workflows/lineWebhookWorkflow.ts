import { MastraClient } from "@mastra/client-js";
import { Client } from '@line/bot-sdk';
import { checkMessageRelevance } from '../utils/messageRelevanceChecker';
import { checkSubsidyFound } from '../utils/subsidyResultChecker';
import { saveUserSession, isActiveSessionWithinTimeLimit, updateLastActivityAt } from '../utils/firestoreService';

// Workflow input type
interface LineWebhookInput {
  userId: string;
  messageText: string;
  replyToken?: string;
}

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
      
      if (lineClient && input.replyToken) {
        try {
          await lineClient.replyMessage(input.replyToken, {
            type: 'text',
            text: fixedMessage,
          });
          console.log(`Successfully sent fixed message to ${input.userId}`);
        } catch (replyError) {
          console.warn('Reply token expired, using push message instead');
          await lineClient.pushMessage(input.userId, {
            type: 'text',
            text: fixedMessage,
          });
          console.log(`Successfully sent push message to ${input.userId}`);
        }
      } else if (lineClient) {
        await lineClient.pushMessage(input.userId, {
          type: 'text',
          text: fixedMessage,
        });
        console.log(`Successfully sent push message to ${input.userId}`);
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
    // inquiry-agentのA2Aクライアントを取得
    const inquiryAgent = mastraClient.getA2A("inquiryAgent");
    const id = crypto.randomUUID();
    
    // inquiryAgentにメッセージを送信
    const response = await inquiryAgent.sendMessage({
      id,
      message: {
        role: "user",
        parts: [
          { type: "text", text: input.messageText },
        ],
      },
    });
    
    // タスクの状態を確認
    let task = response.task;
    
    // タスクがworking状態の場合は完了まで待機
    if (task.status.state === "working") {
      console.log("Waiting for task to complete...");
      while (task.status.state === "working") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        task = await inquiryAgent.getTask({ id: task.id });
      }
    }
    
    // レスポンスメッセージを抽出
    let responseText = "";
    for (const part of task.status.message?.parts || []) {
      if (part.type === "text") {
        responseText += part.text;
      }
    }
    
    if (!responseText) {
      responseText = "申し訳ございません。うまく聞き取れませんでした。";
    }
    
    // 補助金が見つかったかチェック
    const subsidyFound = checkSubsidyFound(responseText);
    if (!subsidyFound) {
      console.log('No subsidy found. Skipping response.');
      return { success: true, message: 'No subsidy found - no response sent' };
    }
    
    // Firestoreにユーザーセッションを保存
    try {
      await saveUserSession(input.userId);
      console.log('User session saved to Firestore');
    } catch (error) {
      console.error('Failed to save user session to Firestore:', error);
      // Firestoreの保存に失敗してもLINEへの返信は続行
    }
    
    // LINEに返信
    if (lineClient && input.replyToken) {
      try {
        await lineClient.replyMessage(input.replyToken, {
          type: 'text',
          text: responseText,
        });
        console.log(`Successfully sent reply message to ${input.userId}`);
      } catch (replyError) {
        // replyTokenが期限切れの場合はpushMessageを使用
        console.warn('Reply token expired, using push message instead');
        await lineClient.pushMessage(input.userId, {
          type: 'text',
          text: responseText,
        });
        console.log(`Successfully sent push message to ${input.userId}`);
      }
    } else if (lineClient) {
      await lineClient.pushMessage(input.userId, {
        type: 'text',
        text: responseText,
      });
      console.log(`Successfully sent push message to ${input.userId}`);
    }
    
    return { success: true, message: responseText };
    
  } catch (error) {
    console.error('Error processing LINE message:', error);
    
    // エラー時のメッセージ送信
    if (lineClient) {
      const errorMessage = '申し訳ございません。現在メッセージを処理できません。';
      try {
        if (input.replyToken) {
          await lineClient.replyMessage(input.replyToken, {
            type: 'text',
            text: errorMessage,
          });
        } else {
          await lineClient.pushMessage(input.userId, {
            type: 'text',  
            text: errorMessage,
          });
        }
      } catch (sendError) {
        console.error('Failed to send error message:', sendError);
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
};