import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { GoogleGenAI } from '@google/genai';

// Subsidy data type
interface SubsidyData {
  id: string;
  name: string;
  summary: string;
  embedding: number[];
}

// ベクトル検索結果の型
export interface VectorSearchResult {
  subsidyId: string;
  subsidyName: string;
  similarity: number;
}

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

// メッセージからベクトル検索を実行する関数
export async function performVectorSearch(messageText: string): Promise<VectorSearchResult> {
  console.log('Generating embedding for user message with Gemini API...');
  
  const genai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  
  // メッセージをエンべディング
  const response = await genai.models.embedContent({
    model: 'text-embedding-004',
    contents: messageText
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
  
  return {
    subsidyId: mostRelevantSubsidyId,
    subsidyName: mostRelevantSubsidy,
    similarity: maxSimilarity
  };
}