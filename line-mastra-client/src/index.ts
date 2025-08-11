import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { MastraClient } from "@mastra/client-js";
import { Client, validateSignature } from '@line/bot-sdk';

const app = new Hono()

// ヘルスチェックエンドポイント
app.get('/', async (c) => {
  return c.json({ 
    status: 'healthy',
    lineBot: process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'enabled' : 'disabled',
    message: process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'LINE Bot is running' : 'LINE Bot is disabled. Please set environment variables.'
  });
})

// Mastraクライアントの初期化
const client = new MastraClient({
  baseUrl: process.env.CHECK_SUBSIDY_AGENT_URL || "http://localhost:4111",
});

// inquiry-agentのA2Aクライアントを取得
const inquiryAgent = client.getA2A("inquiryAgent");

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

// LINE Webhook処理関数
async function handleLineWebhook(events: any[]) {
  const promises = events.map(async (event) => {
    // テキストメッセージ以外は無視
    if (event.type !== 'message' || event.message.type !== 'text') {
      return;
    }

    try {
      // inquiryAgentにメッセージを送信
      const id = crypto.randomUUID();
      const response = await inquiryAgent.sendMessage({
        id,
        message: {
          role: "user",
          parts: [
            { type: "text", text: event.message.text },
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

      // LINEに返信
      if (lineClient) {
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: responseText,
        });
      }
    } catch (error) {
      console.error('Error processing LINE message:', error);
      
      // エラー時はデフォルトメッセージを返信
      if (lineClient) {
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: '申し訳ございません。現在メッセージを処理できません。',
        });
      }
    }
  });

  await Promise.all(promises);
}

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

    // LINE Webhookイベントを処理
    await handleLineWebhook(jsonBody.events);
    
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
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
  console.log(`Mastraクライアントが ${process.env.CHECK_SUBSIDY_AGENT_URL || "http://localhost:4111"} のinquiry-agentに接続されています`)
  console.log(`LINE Webhookエンドポイント: http://localhost:${info.port}/callback`)
})
