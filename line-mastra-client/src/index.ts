import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { MastraClient } from "@mastra/client-js";
import { Client, validateSignature } from '@line/bot-sdk';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { handleLineWebhook } from './workflows/lineWebhookWorkflow';

const app = new Hono()

// Firebaseアプリの初期化（gcloud auth application-default loginの認証を使用）
const firebaseApp = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
});

// Firestoreインスタンスの取得
const db = getFirestore(firebaseApp);

// ヘルスチェックエンドポイント
app.get('/', async (c) => {
  let firestoreStatus = 'unknown';
  
  try {
    // Firestoreの接続確認（コレクションリストの取得を試みる）
    const collections = await db.listCollections();
    firestoreStatus = 'connected';
    console.log(`Firestore接続確認: ${collections.length}個のコレクションが見つかりました`);
  } catch (error) {
    firestoreStatus = 'error';
    console.error('Firestore接続エラー:', error);
  }
  
  return c.json({ 
    status: 'healthy',
    lineBot: process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'enabled' : 'disabled',
    firestore: firestoreStatus,
    message: process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'LINE Bot is running' : 'LINE Bot is disabled. Please set environment variables.'
  });
})

// Mastraクライアントの初期化
const client = new MastraClient({
  baseUrl: process.env.CHECK_SUBSIDY_AGENT_URL || "http://localhost:4111",
});

// 環境変数のチェック
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
  console.error('環境変数 LINE_CHANNEL_ACCESS_TOKEN および LINE_CHANNEL_SECRET が設定されていません。');
  console.error('Cloud Run コンソールから環境変数を設定してください。');
  console.error('設定方法: https://console.cloud.google.com/run で該当のサービスを選択し、「編集とデプロイ」から環境変数を追加してください。');
  
  // 環境変数が設定されていない場合でも、ヘルスチェック用にサーバーは起動する
  console.warn('LINE Bot機能は無効化されています。');
}

// LINE設定
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'dummy-token',
  channelSecret: process.env.LINE_CHANNEL_SECRET || 'dummy-secret',
};

// LINEクライアント
const lineClient = process.env.LINE_CHANNEL_ACCESS_TOKEN ? new Client(lineConfig) : null;



// LINE Webhookエンドポイント
app.post('/callback', async (c) => {
  try {
    // LINE機能が無効の場合
    if (!lineClient) {
      return c.json({ error: 'LINE Bot functionality is disabled. Please set LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET environment variables.' }, 503);
    }

    // LINE署名検証
    const signature = c.req.header('x-line-signature');
    const body = await c.req.text();
    
    if (!signature || !validateSignature(body, lineConfig.channelSecret, signature)) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // JSONとして解析
    const jsonBody = JSON.parse(body);
    
    if (!jsonBody.events || !Array.isArray(jsonBody.events)) {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    // LINE Webhookイベントを処理（workflowを使用）
    const promises = jsonBody.events.map(async (event: any) => {
      // テキストメッセージ以外は無視
      if (event.type !== 'message' || event.message.type !== 'text') {
        return;
      }
      
      const userId = event.source?.userId;
      if (!userId) {
        console.error("userId not found in the event");
        return;
      }
      
      // ワークフロー処理を実行
      try {
        await handleLineWebhook(client, lineClient, {
          userId: userId,
          messageText: event.message.text,
          replyToken: event.replyToken,
        });
      } catch (error) {
        console.error('Error handling LINE webhook:', error);
      }
    });
    
    await Promise.all(promises);
    
    return c.json({ status: 'ok' });
  } catch (error) {
    console.error('Error in LINE webhook handler:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

const port = parseInt(process.env.PORT || '3000', 10);

serve({
  fetch: app.fetch,
  port: port
}, async (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
  console.log(`Mastraクライアントが ${process.env.CHECK_SUBSIDY_AGENT_URL || "http://localhost:4111"} のinquiry-agentに接続されています`)
  console.log(`LINE Webhookエンドポイント: http://localhost:${info.port}/callback`)
  console.log(`Firestore初期化: ${process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'プロジェクトID未設定'}`)
  
})
