'use strict';

const express = require('express');
const line = require('@line/bot-sdk');

// Secret Managerから渡される環境変数を読み込む
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Expressアプリケーションを初期化
const app = express();

// LINEからのWebhookリクエストを受け取るエンドポイント
// /callback パスへのPOSTリクエストを処理
// line.middlewareが署名の検証などを自動で行ってくれる
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// イベントを処理する関数
function handleEvent(event) {
  // テキストメッセージ以外のイベントは無視
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // LINE SDKのクライアントを初期化
  const client = new line.Client(config);

  // オウム返しするメッセージを作成
  const echo = { type: 'text', text: event.message.text };

  // メッセージを返信する
  return client.replyMessage(event.replyToken, echo);
}

// Cloud Runが指定するポートでサーバーを起動
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});