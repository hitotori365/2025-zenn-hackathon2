import { MastraClient } from "@mastra/client-js";
import { Client } from '@line/bot-sdk';
import { checkMessageRelevance } from '../utils/messageRelevanceChecker';
import { checkSubsidyFound } from '../utils/subsidyResultChecker';
import { saveUserSession, isActiveSessionWithinTimeLimit, updateLastActivityAt, saveSelectedSubsidy } from '../utils/firestoreService';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

// Workflow input type
interface LineWebhookInput {
  userId: string;
  messageText: string;
  replyToken?: string;
}

// Subsidy data type
interface SubsidyData {
  id: string;
  name: string;
  summary: string;
  embedding: number[];
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

// コサイン類似度計算関数
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// CSVファイルから補助金データを読み込む関数
const loadSubsidyData = async (): Promise<SubsidyData[]> => {
  const csvPath = path.join(process.cwd(), 'data', 'hojokin2024_with_embeddings.csv');
  
  return new Promise((resolve, reject) => {
    const results: SubsidyData[] = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data: any) => {
        try {
          // embed列のJSONを解析
          const embedding = JSON.parse(data.embed);
          results.push({
            id: data.id,
            name: data.name,
            summary: data.summary,
            embedding: embedding
          });
        } catch (error) {
          console.error(`Error parsing embedding for ${data.id}:`, error);
        }
      })
      .on('end', () => {
        console.log(`Loaded ${results.length} subsidy entries from CSV`);
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
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
    // Gemini APIでエンべディング処理
    console.log('Generating embedding for user message with Gemini API...');
    try {
      const { GoogleGenAI } = await import('@google/genai');
      
      const genai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      
      // メッセージをエンべディング
      const response = await genai.models.embedContent({
        model: 'text-embedding-004',
        contents: input.messageText

      });
      
      if (!response.embeddings || response.embeddings.length === 0) {
        throw new Error('No embeddings returned from Gemini API');
      }
      
      const embedding = response.embeddings[0].values;
      if (!embedding) {
        throw new Error('Embedding values are undefined');
      }
      
      console.log(`Generated embedding with ${embedding.length} dimensions`);
      console.log('Embedding values (first 10):', embedding.slice(0, 10));
      
      // CSVファイルを読み込んでベクトル検索
      console.log('Loading subsidy data from CSV...');
      const subsidyData = await loadSubsidyData();
      
      // コサイン類似度を計算して最も関連する補助金を見つける
      let maxSimilarity = -1;
      let mostRelevantSubsidy = '';
      let mostRelevantSubsidyId = '';
      
      for (const subsidy of subsidyData) {
        // 次元数が異なる場合はスキップまたはエラーログ
        if (embedding.length !== subsidy.embedding.length) {
          console.log(`Dimension mismatch: Query(${embedding.length}) vs ${subsidy.name}(${subsidy.embedding.length})`);
          continue;
        }
        
        const similarity = cosineSimilarity(embedding, subsidy.embedding);
        console.log(`Similarity with "${subsidy.name}": ${similarity.toFixed(4)}`);
        
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          mostRelevantSubsidy = subsidy.name;
          mostRelevantSubsidyId = subsidy.id;
        }
      }
      
      console.log(`Most relevant subsidy: ${mostRelevantSubsidy} (ID: ${mostRelevantSubsidyId}, similarity: ${maxSimilarity.toFixed(4)})`);
      
      // FirestoreにsubsidyIdを保存
      await saveSelectedSubsidy(input.userId, {
        id: mostRelevantSubsidyId,
        name: mostRelevantSubsidy
      });
      
      // 結果をテスト用に返すメッセージ
      const testMessage = `最も関連する補助金: ${mostRelevantSubsidy} (ID: ${mostRelevantSubsidyId}, 類似度: ${maxSimilarity.toFixed(4)})`;
      
      if (lineClient) {
        await sendLineMessage(lineClient, input.userId, testMessage, input.replyToken);
      }
      
      return { success: true, message: testMessage };
      
    } catch (error) {
      console.error('Error generating embedding:', error);
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