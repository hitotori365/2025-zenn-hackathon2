import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { MastraClient } from "@mastra/client-js";

const app = new Hono()

// Mastraクライアントの初期化
const client = new MastraClient({
  baseUrl: "http://localhost:4111",
});

// inquiry-agentのA2Aクライアントを取得
const inquiryAgent = client.getA2A("inquiryAgent");

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// エージェントカードを取得するエンドポイント
app.get('/agent-card', async (c) => {
  try {
    const agentCard = await inquiryAgent.getCard();
    return c.json(agentCard);
  } catch (error) {
    console.error('エージェントカードの取得に失敗しました:', error);
    return c.json({ error: 'エージェントカードの取得に失敗しました' }, 500);
  }
});

// エージェントとチャットするエンドポイント
app.post('/chat', async (c) => {
  try {
    const { message } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'メッセージが必要です' }, 400);
    }

    // A2Aプロトコルに従ってメッセージを送信
    const id = crypto.randomUUID();
    const response = await inquiryAgent.sendMessage({
      id,
      message: {
        role: "user",
        parts: [
          { type: "text", text: message },
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
    
    return c.json({
      message: responseText,
      taskId: task.id,
      status: task.status.state
    });
  } catch (error) {
    console.error('チャットに失敗しました:', error);
    return c.json({ error: 'チャットに失敗しました' }, 500);
  }
});

// エージェントの情報を取得するエンドポイント
app.get('/agent-info', async (c) => {
  try {
    const agentCard = await inquiryAgent.getCard();
    return c.json({
      name: agentCard.name,
      description: agentCard.description
    });
  } catch (error) {
    console.error('エージェント情報の取得に失敗しました:', error);
    return c.json({ error: 'エージェント情報の取得に失敗しました' }, 500);
  }
});

// ストリーミングチャットエンドポイント
app.post('/chat/stream', async (c) => {
  try {
    const { message } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'メッセージが必要です' }, 400);
    }

    const id = crypto.randomUUID();
    const response = await inquiryAgent.sendAndSubscribe({
      id,
      message: {
        role: "user",
        parts: [
          { type: "text", text: message },
        ],
      },
    });

    // ストリーミングレスポンスを返す
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('ストリーミングチャットに失敗しました:', error);
    return c.json({ error: 'ストリーミングチャットに失敗しました' }, 500);
  }
});

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
  console.log(`Mastraクライアントが http://localhost:4111 のinquiry-agentに接続されています`)
})
