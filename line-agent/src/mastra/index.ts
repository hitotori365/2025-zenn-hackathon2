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

// ユーザー状態管理関数
async function getUserState(userId: string) {
  const userDoc = await firestore.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    const newUser = { userId, status: 'waiting', createdAt: new Date(), lastActiveAt: new Date() };
    await firestore.collection('users').doc(userId).set(newUser);
    return newUser;
  }
  return userDoc.data();
}

async function updateUserState(userId: string, status: string) {
  await firestore.collection('users').doc(userId).update({ status, lastActiveAt: new Date() });
}

function isEndChatKeyword(message: string): boolean {
  const endKeywords = ['終了', 'やめる', 'リセット', 'おわり'];
  return endKeywords.some(keyword => message.includes(keyword));
}

// Postbackイベント処理
async function handlePostbackEvent(event: any, userId: string) {
  const data = event.postback.data;
  let replyMessage: { type: 'text'; text: string };
  if (data === 'action=start_chat') {
    await updateUserState(userId, 'chatting');
    replyMessage = {
      type: 'text',
      text: '✅ ありがとうございます！\n\n🤖 何でもお聞きください！',
    };
  } else if (data === 'action=end_chat') {
    await updateUserState(userId, 'waiting');
    replyMessage = {
      type: 'text',
      text: '❌ 承知いたしました。\n\n🤖 また何かあればどうぞ！',
    };
  } else {
    // 万が一想定外のpostback
    replyMessage = {
      type: 'text',
      text: '不明な操作です。',
    };
  }
  return lineClient.replyMessage(event.replyToken, replyMessage);
}

// テキストメッセージイベント処理
async function handleTextEvent(event: any, userId: string) {
  const userState = await getUserState(userId);
  const messageText = event.message.text.toLowerCase();
  if (isEndChatKeyword(messageText)) {
    await updateUserState(userId, 'waiting');
    const replyMessage = {
      type: 'text' as const,
      text: '🔄 会話を終了しました。\n\n🤖 また何かあればどうぞ！',
    };
    return lineClient.replyMessage(event.replyToken, replyMessage);
  }

  // AI応答を取得
  const result = await lineAgent.generate([
    { role: 'user', content: event.message.text },
  ]);
  const aiText = result.text;

  let replyMessage: any;
  if (aiText.includes('無関係')) {
    // 関係ない話題の場合はwaitingのまま
    replyMessage = {
      type: 'text' as const,
      text: aiText,
    };
    await updateUserState(userId, 'waiting');
  } else {
    // 関連話題ならchattingフラグを立てる
    replyMessage = {
      type: 'text' as const,
      text: aiText,
      quickReply: {
        items: [
          { type: 'action', action: { type: 'postback', label: '🔄 会話終了', data: 'action=end_chat' } }
        ]
      }
    };
    await updateUserState(userId, 'chatting');
  }
  return lineClient.replyMessage(event.replyToken, replyMessage);
}

// LINE Webhook処理関数
async function handleLineWebhook(events: any[]) {
  console.log('📨 LINE Webhook受信:', events.length, '件のイベント');
  const promises = events.map(async (event) => {
    const userId = event.source.userId;
    try {
      if (event.type === 'postback') {
        return handlePostbackEvent(event, userId);
      }
      if (event.type === 'message' && event.message.type === 'text') {
        return handleTextEvent(event, userId);
      }
      return Promise.resolve(null);
    } catch (error) {
      console.error('❌ Error processing LINE message:', error);
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: '申し訳ございません。一時的なエラーが発生しました。',
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
