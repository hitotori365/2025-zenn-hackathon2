# ⚠️ 基本版（MVP）について

現在のバージョンは基本機能のみ実装されています：
- ✅ 簡易的なキーワードマッチングによる補助金検知
- ✅ ユーザー状態管理（waiting/chatting）
- ❌ Vertex AI/Gemini APIは未実装
- ❌ 会話履歴保存は未実装
- ❌ 高度な自然言語処理は未実装

# コマンドMEMO

## CloudRunデプロイ

```bash
gcloud run deploy [cloud run name] \
    --source . \
    --region asia-northeast1 \
    --allow-unauthenticated \
    --project [google project name] \
    --set-secrets="LINE_CHANNEL_ACCESS_TOKEN=[secret name]:latest,LINE_CHANNEL_SECRET=[secret name]:latest" \
    --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=[google project id]"
```

## Webhook URL確認

```bash
gcloud run services describe line-bot-service-enable-ai-talk \
  --region asia-northeast1 \
  --format "value(status.url)"
```

## ヘルスチェック確認

```bash
curl https://[YOUR_CLOUD_RUN_URL]/health
```

## Firestore 初期設定

1. Firestoreデータベース作成

```bash
# Firestore API有効化（念のため確認）
gcloud services enable firestore.googleapis.com
# Firestoreデータベース作成（ネイティブモード）
gcloud firestore databases create --location=asia-northeast1
```

2. Cloud Runサービスアカウント権限設定

```bash
# プロジェクト番号取得
PROJECT_NUMBER=$(gcloud projects describe [YOUR_PROJECT_ID] --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"
# Firestore権限付与
gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/datastore.user"
```

## Vector AI 有効化

1. Vertex AI API有効化確認

```bash
# Vertex AI API有効化
gcloud services enable aiplatform.googleapis.com
# 有効化確認
gcloud services list --enabled --filter="name:aiplatform.googleapis.com"
```

2. サービスアカウント権限設定

```bash
# Vertex AI利用権限付与
gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/aiplatform.user"
# 権限確認
gcloud projects get-iam-policy [YOUR_PROJECT_ID] \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
```



1. Vertex AI API有効化確認

# 構成図

```mermaid
graph TB
    subgraph "LINE Platform"
        U[👤 ユーザー]
        LB[📱 LINE Bot ホジョキントーク]
    end
    
    subgraph "Google Cloud Platform"
        subgraph "Cloud Run"
            CR[⚡ Express Server<br/>index.js<br/>Port: 8080]
        end
        
        subgraph "データベース"
            FS[🗄️ Firestore<br/>・ユーザー状態のみ<br/>（会話履歴は未実装）]
        end
        
        subgraph "補助金検知"
            KD[🔍 キーワードマッチング<br/>・生ゴミ処理機<br/>・太陽光<br/>・省エネ<br/>・医療費]
        end
    end
   
    %% メッセージフロー
    U -->|📤 メッセージ送信| LB
    LB -->|📡 Webhook| CR
    CR -->|💾 状態確認/保存| FS
    CR -->|🔍 キーワード検知| KD
    KD -->|📋 補助金情報| CR
    CR -->|📤 返信| LB
    LB -->|📱 表示| U
    
    %% スタイル
    classDef lineClass fill:#06C755,stroke:#ffffff,color:#ffffff
    classDef gcpClass fill:#4285F4,stroke:#ffffff,color:#ffffff
    classDef dataClass fill:#FF9800,stroke:#ffffff,color:#ffffff
    classDef detectClass fill:#9C27B0,stroke:#ffffff,color:#ffffff
    
    class U,LB lineClass
    class CR gcpClass
    class FS dataClass
    class KD detectClass

```

# 処理のフロー

```mermaid
flowchart TD
    START([👤 ユーザーがLINEでメッセージ送信])
    
    WEBHOOK[📡 Cloud Run<br/>Webhook受信]
    
    CHECK_USER{🔍 Firestore<br/>ユーザー状態確認}
    
    FIRST_TIME[📝 初回ユーザー<br/>状態: 'waiting']
    CONVERSATION[💬 会話中ユーザー<br/>状態: 'chatting']
    
    ASK_START[❓ 「会話を開始しますか？」<br/>クイックリプライ<br/>「はい」「いいえ」]
    
    CHECK_REPLY{🤔 ユーザーの選択}
    
    START_CHAT[✅ 状態を'chatting'に更新<br/>「こんにちは！何でも聞いてください」]
    
    END_CHAT[❌ 「また今度お話ししましょう」<br/>状態を'waiting'にリセット]
    
    KEYWORD_DETECT[🔍 キーワード検知<br/>補助金データベース照合]
    
    SUBSIDY_RESPONSE[💭 補助金情報返信]
    
    SEND_REPLY[📤 LINE Bot<br/>メッセージ返信]
    
    UPDATE_STATE[💾 Firestore<br/>ユーザー状態更新]
    
    END([🔚 処理完了])
    
    %% フロー接続
    START --> WEBHOOK
    WEBHOOK --> CHECK_USER
    
    CHECK_USER -->|初回| FIRST_TIME
    CHECK_USER -->|会話中| CONVERSATION
    
    FIRST_TIME --> ASK_START
    ASK_START --> SEND_REPLY
    SEND_REPLY --> UPDATE_STATE
    UPDATE_STATE --> END
    
    %% ユーザーが「はい」「いいえ」を選択した場合
    WEBHOOK -->|クイックリプライ<br/>受信時| CHECK_REPLY
    
    CHECK_REPLY -->|「はい」| START_CHAT
    CHECK_REPLY -->|「いいえ」| END_CHAT
    
    START_CHAT --> SEND_REPLY
    END_CHAT --> SEND_REPLY
    
    %% 会話中の処理
    CONVERSATION --> KEYWORD_DETECT
    KEYWORD_DETECT --> SUBSIDY_RESPONSE
    SUBSIDY_RESPONSE --> SEND_REPLY
    
    %% スタイル
    classDef startEnd fill:#4CAF50,stroke:#ffffff,color:#ffffff
    classDef process fill:#2196F3,stroke:#ffffff,color:#ffffff
    classDef decision fill:#FF9800,stroke:#ffffff,color:#ffffff
    classDef detect fill:#9C27B0,stroke:#ffffff,color:#ffffff
    classDef database fill:#607D8B,stroke:#ffffff,color:#ffffff
    
    class START,END startEnd
    class WEBHOOK,ASK_START,START_CHAT,END_CHAT,SEND_REPLY process
    class CHECK_USER,CHECK_REPLY decision
    class KEYWORD_DETECT,SUBSIDY_RESPONSE detect
    class UPDATE_STATE,FIRST_TIME,CONVERSATION database

```

# シーケンス

```mermaid
sequenceDiagram
    participant U as 👤 ユーザー
    participant LB as 📱 LINE Bot
    participant CR as ⚡ Cloud Run<br/>(Express)
    participant FS as 🗄️ Firestore
    participant KD as 🔍 キーワード<br/>マッチング

    Note over U,KD: シナリオ1: 初回ユーザーのメッセージ送信

    U->>LB: 📤 "こんにちは"
    LB->>CR: 📡 Webhook送信<br/>(POST /webhook)
    
    CR->>FS: 🔍 ユーザー状態確認<br/>getUserState(userId)
    FS-->>CR: ❌ ユーザー未存在
    
    CR->>FS: 📝 新規ユーザー作成<br/>{userId, status: "waiting"}
    FS-->>CR: ✅ 保存完了
    
    Note over CR: status = "waiting"<br/>→ クイックリプライ表示
    
    CR->>LB: 📤 "会話を開始しますか？"<br/>+ QuickReply["はい","いいえ"]
    LB->>U: 📱 メッセージ表示

    Note over U,KD: シナリオ2: ユーザーが「はい」を選択

    U->>LB: 👆 "✅ はい" クリック
    LB->>CR: 📡 Postback送信<br/>(action=start_chat)
    
    CR->>FS: 🔄 状態更新<br/>updateUserState(userId, "chatting")
    FS-->>CR: ✅ 更新完了
    
    CR->>LB: 📤 "ありがとうございます！<br/>何でもお聞きください！"
    LB->>U: 📱 メッセージ表示

    Note over U,KD: シナリオ3: 補助金関連メッセージ送信

    U->>LB: 📤 "生ゴミ処理機を買ったよ"
    LB->>CR: 📡 Webhook送信
    
    CR->>FS: 🔍 ユーザー状態確認
    FS-->>CR: 📊 {status: "chatting"}
    
    Note over CR: status = "chatting"<br/>→ 補助金検知処理
    
    CR->>KD: 🔍 キーワード検知<br/>detectSubsidy("生ゴミ処理機を買ったよ")
    
    Note over KD: キーワード"生ゴミ処理機"検出<br/>内部データベース参照
    
    KD-->>CR: 💡 補助金情報返却<br/>{name, amount, condition, note}
    
    Note over CR: generateResponse()<br/>補助金情報を整形
    
    CR->>LB: 📤 "🎉 それ、補助金出るかも！<br/>💰 生ごみ処理機購入補助金<br/>補助額: 購入費の1/2（上限3万円）"<br/>+ QuickReply["🔄 会話終了"]
    LB->>U: 📱 メッセージ表示

    Note over U,KD: シナリオ4: 一般的なメッセージ（補助金非対象）

    U->>LB: 📤 "今日は良い天気ですね"
    LB->>CR: 📡 Webhook送信
    
    CR->>FS: 🔍 ユーザー状態確認
    FS-->>CR: 📊 {status: "chatting"}
    
    CR->>KD: 🔍 キーワード検知<br/>detectSubsidy("今日は良い天気ですね")
    KD-->>CR: ❌ 補助金キーワード未検出
    
    Note over CR: generateResponse()<br/>一般的な応答生成
    
    CR->>LB: 📤 "🤖 補助金や助成金の制度がある<br/>可能性があります。<br/>キーワード例：生ゴミ処理機、太陽光..."<br/>+ QuickReply["🔄 会話終了"]
    LB->>U: 📱 メッセージ表示

    Note over U,KD: シナリオ5: 会話終了（ボタンクリック）

    U->>LB: 👆 "🔄 会話終了" クリック
    LB->>CR: 📡 Postback送信<br/>(action=end_chat)
    
    CR->>FS: 🔄 状態リセット<br/>updateUserState(userId, "waiting")
    FS-->>CR: ✅ 更新完了
    
    CR->>LB: 📤 "❌ 承知いたしました。<br/>また何かありましたらお声がけください！"
    LB->>U: 📱 メッセージ表示

    Note over U,KD: シナリオ6: 会話終了（キーワード入力）

    rect rgb(255, 248, 240)
        Note over U,KD: 別の会話で「終了」キーワードが入力された場合
        
        U->>LB: 📤 "終了"
        LB->>CR: 📡 Webhook送信
        
        Note over CR: 終了キーワード検出<br/>messageText.includes('終了')
        
        CR->>FS: 🔄 状態リセット<br/>updateUserState(userId, "waiting")
        FS-->>CR: ✅ 更新完了
        
        CR->>LB: 📤 "🔄 会話を終了しました。"
        LB->>U: 📱 メッセージ表示
    end

    Note over U,KD: エラーハンドリング

    rect rgb(255, 240, 240)
        Note over U,KD: Firestoreエラーが発生した場合
        
        CR->>FS: 🔍 ユーザー状態確認
        FS-->>CR: ❌ 接続エラー
        
        Note over CR: try-catch でエラーキャッチ<br/>フォールバック処理
        
        CR->>LB: 📤 "申し訳ございません。<br/>一時的なエラーが発生しました。"
        LB->>U: 📱 エラーメッセージ表示
    end
```

## 現在対応している補助金キーワード

現在、以下のキーワードに反応して補助金情報を提供します：

- **生ゴミ処理機** - 生ごみ処理機購入補助金（購入費の1/2、上限3万円）
- **太陽光** - 太陽光発電設備導入補助金（1kWあたり2-4万円）
- **省エネ** - 省エネリフォーム補助金（工事費の10-30%）
- **医療費** - 医療費控除（年間医療費が10万円超で所得税・住民税軽減）

※実際の補助金額や条件は自治体により異なります。詳細はお住まいの市区町村役場でご確認ください。