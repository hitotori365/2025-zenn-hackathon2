const express = require('express');
const line = require('@line/bot-sdk');
const { Firestore } = require('@google-cloud/firestore');

const app = express();
const PORT = process.env.PORT || 8080;

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// Firestore初期化
const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

// 補助金関連データベース（簡易版）
const subsidyDatabase = {
  '生ゴミ処理機': {
    name: '生ごみ処理機購入補助金',
    amount: '購入費の1/2（上限3万円）',
    condition: '多くの自治体で実施中',
    note: 'お住まいの市区町村役場で詳細をご確認ください'
  },
  '太陽光': {
    name: '太陽光発電設備導入補助金',
    amount: '1kWあたり2-4万円',
    condition: '住宅用太陽光発電システム',
    note: '自治体により条件が異なります'
  },
  '省エネ': {
    name: '省エネリフォーム補助金',
    amount: '工事費の10-30%',
    condition: '断熱改修、高効率設備導入等',
    note: '国や自治体の制度を併用可能な場合があります'
  },
  '医療費': {
    name: '医療費控除',
    amount: '所得税・住民税の軽減',
    condition: '年間医療費が10万円超',
    note: '確定申告が必要です'
  }
};

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'ホジョキンTV エブリデイ (基本版) is running!',
    timestamp: new Date().toISOString(),
    mode: 'Basic Mode - Vertex AI Disabled'
  });
});

// LINE Webhook エンドポイント
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Webhook Error:', err);
      res.status(500).end();
    });
});

// ユーザー状態管理関数
async function getUserState(userId) {
  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      const newUser = {
        userId: userId,
        status: 'waiting',
        createdAt: new Date(),
        lastActiveAt: new Date()
      };
      
      await firestore.collection('users').doc(userId).set(newUser);
      console.log(`新規ユーザー作成: ${userId}`);
      return newUser;
    }
    
    return userDoc.data();
  } catch (error) {
    console.error('ユーザー状態取得エラー:', error);
    throw error;
  }
}

async function updateUserState(userId, status) {
  try {
    await firestore.collection('users').doc(userId).update({
      status: status,
      lastActiveAt: new Date()
    });
    console.log(`ユーザー状態更新: ${userId} -> ${status}`);
  } catch (error) {
    console.error('ユーザー状態更新エラー:', error);
    throw error;
  }
}

// 補助金検知機能
function detectSubsidy(message) {
  const keywords = Object.keys(subsidyDatabase);
  
  for (const keyword of keywords) {
    if (message.includes(keyword)) {
      return subsidyDatabase[keyword];
    }
  }
  
  return null;
}

// 補助金検知＋基本応答（Vertex AI無し）
function generateResponse(userMessage) {
  // 補助金検知
  const detectedSubsidy = detectSubsidy(userMessage);
  
  if (detectedSubsidy) {
    // 補助金が見つかった場合
    return `🎉 それ、補助金出るかも！\n\n💰 ${detectedSubsidy.name}\n補助額: ${detectedSubsidy.amount}\n条件: ${detectedSubsidy.condition}\n\n📝 ${detectedSubsidy.note}`;
  }
  
  // 一般的な応答
  return `🤖 「${userMessage}」についてですね！\n\n補助金や助成金の制度がある可能性があります。\n\n💡 キーワード例：\n「生ゴミ処理機」「太陽光」「省エネ」「医療費」\n\nお住まいの自治体のホームページもご確認ください！`;
}

// クイックリプライメッセージ作成
function createStartChatMessage() {
  return {
    type: 'text',
    text: '🤖 こんにちは！ホジョキンです！\n\n補助金・助成金の情報をお手伝いします。\n会話を開始しますか？',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '✅ はい',
            data: 'action=start_chat'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '❌ いいえ',
            data: 'action=end_chat'
          }
        }
      ]
    }
  };
}

// イベントハンドラー
async function handleEvent(event) {
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
    console.error('イベント処理エラー:', error);
    
    const errorMessage = {
      type: 'text',
      text: '申し訳ございません。一時的なエラーが発生しました。少し時間をおいて再度お試しください。'
    };
    
    return client.replyMessage(event.replyToken, errorMessage);
  }
}

// Postbackイベント処理
async function handlePostbackEvent(event, userId) {
  const data = event.postback.data;
  console.log(`Postback受信: ${userId} - ${data}`);
  
  let replyMessage;
  
  if (data === 'action=start_chat') {
    await updateUserState(userId, 'chatting');
    replyMessage = {
      type: 'text',
      text: '✅ ありがとうございます！\n\n🤖 補助金・助成金に関することなら何でもお聞きください！\n\n💡 例：\n「生ゴミ処理機を買ったよ」\n「太陽光パネルを検討中」\n「子供の医療費について」\n\n⚠️ 現在は基本モードで動作中です（Vertex AI機能は次のフェーズで追加予定）'
    };
  } else if (data === 'action=end_chat') {
    await updateUserState(userId, 'waiting');
    replyMessage = {
      type: 'text',
      text: '❌ 承知いたしました。\n\n🤖 また何かお困りのことがありましたら、いつでもお声がけください！'
    };
  }
  
  return client.replyMessage(event.replyToken, replyMessage);
}

// テキストメッセージイベント処理
async function handleTextEvent(event, userId) {
  const userState = await getUserState(userId);
  console.log(`ユーザー状態: ${userId} - ${userState.status}`);
  
  const messageText = event.message.text.toLowerCase();
  
  // 会話終了キーワードチェック
  if (messageText.includes('終了') || messageText.includes('やめる') || messageText.includes('リセット') || messageText.includes('おわり')) {
    await updateUserState(userId, 'waiting');
    const replyMessage = {
      type: 'text',
      text: '🔄 会話を終了しました。\n\n🤖 また何かお困りのことがありましたら、いつでもお声がけください！'
    };
    return client.replyMessage(event.replyToken, replyMessage);
  }
  
  let replyMessage;
  
  if (userState.status === 'waiting') {
    replyMessage = createStartChatMessage();
  } else if (userState.status === 'chatting') {
    // 基本処理実行（Vertex AI無し）
    console.log(`基本処理開始: ${event.message.text}`);
    const response = generateResponse(event.message.text);
    
    replyMessage = {
      type: 'text',
      text: response,
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '🔄 会話終了',
              data: 'action=end_chat'
            }
          }
        ]
      }
    };
  }

  return client.replyMessage(event.replyToken, replyMessage);
}

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 ホジョキンTV エブリデイ (基本版) が起動しました！`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🗄️ Firestore: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
  console.log(`⚠️  Vertex AI: 無効化中（MODULE_NOT_FOUND対策）`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// エラーハンドリング
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});