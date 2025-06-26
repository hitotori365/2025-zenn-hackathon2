import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { registerApiRoute } from '@mastra/core/server';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { lineAgent } from './agents/line-agent';
import { Client, validateSignature } from '@line/bot-sdk';
import { Firestore } from '@google-cloud/firestore';

// LINE設定
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

// LINEクライアント
const lineClient = new Client(lineConfig);

// Firestore初期化を追加
const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

// デバッグ用ログを追加
console.log('Firestore初期化:', {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  firestoreInstance: firestore ? '作成済み' : '作成失敗'
});

// LINE Webhook処理関数
async function handleLineWebhook(events: any[]) {
  console.log('📨 LINE Webhook受信:', events.length, '件のイベント');
  
  const promises = events.map(async (event) => {
    console.log('📝 イベント処理開始:', event.type, event.message?.type);
    
    // テキストメッセージ以外は無視
    if (event.type !== 'message' || event.message.type !== 'text') {
      console.log('❌ テキストメッセージ以外のためスキップ');
      return;
    }

    try {
      console.log(' lineAgent呼び出し開始:', event.message.text);
      
      // lineAgentを呼び出してAI回答を生成
      const result = await lineAgent.generate([
        {
          role: 'user',
          content: event.message.text,
        },
      ]);

      console.log('✅ lineAgent応答完了:', result.text);

      // AI回答を取得
      const aiResponse = result.text;

      console.log('📤 LINE返信開始');
      
      // LINEに返信
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: aiResponse,
      });
      
      console.log('✅ LINE返信完了');
    } catch (error) {
      console.error('❌ Error processing LINE message:', error);
      
      // エラー時はデフォルトメッセージを返信
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: '申し訳ございません。現在メッセージを処理できません。',
      });
    }
  });

  await Promise.all(promises);
}

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, lineAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  server: {
    apiRoutes: [
      registerApiRoute('/callback', {
        method: 'POST',
        middleware: [
          // LINE署名検証ミドルウェア
          async (c, next) => {
            const signature = c.req.header('x-line-signature');
            const body = await c.req.text();
            
            if (!signature || !validateSignature(body, lineConfig.channelSecret, signature)) {
              return c.json({ error: 'Invalid signature' }, 401);
            }
            
            // 検証済みのbodyを再設定
            c.req.raw = new Request(c.req.url, {
              method: c.req.method,
              headers: c.req.raw.headers,
              body: body,
            });
            
            await next();
          },
        ],
        handler: async (c) => {
          try {
            console.log(' Webhookリクエスト受信');
            
            const body = await c.req.json();
            console.log('📦 リクエストボディ:', JSON.stringify(body, null, 2));
            
            if (!body.events || !Array.isArray(body.events)) {
              console.log('❌ 無効なリクエストボディ');
              return c.json({ error: 'Invalid request body' }, 400);
            }

            console.log(' LINE Webhookイベント処理開始');
            
            // LINE Webhookイベントを処理
            await handleLineWebhook(body.events);
            
            console.log('✅ Webhook処理完了');
            
            return c.json({ status: 'ok' });
          } catch (error) {
            console.error('❌ Error in LINE webhook handler:', error);
            return c.json({ error: 'Internal server error' }, 500);
          }
        },
      }),
    ],
  },
});
