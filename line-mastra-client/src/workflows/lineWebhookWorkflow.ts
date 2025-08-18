import { MastraClient } from "@mastra/client-js";
import { Client } from '@line/bot-sdk';
import { checkMessageRelevance } from '../utils/messageRelevanceChecker';
import { checkSubsidyFound } from '../utils/subsidyResultChecker';

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