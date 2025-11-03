# 外部サービス連携機能

Chatwork、Google Chat、Gmailなどの外部サービスからメッセージを自動的に取得し、タスクとして管理する機能です。

## 機能概要

### 対応サービス

1. **Chatwork**
   - Chatwork APIを使用してルームのメッセージを取得
   - ルーム単位でフィルタリング可能
   - キーワードや送信者でフィルタリング

2. **Google Chat**
   - Google Chat APIを使用してスペースのメッセージを取得
   - スペース単位でフィルタリング可能
   - 送信者やキーワードでフィルタリング

3. **Gmail**
   - Gmail APIを使用してメールを取得
   - ラベル、送信者、キーワードでフィルタリング
   - 重要なメールは自動的に優先度「高」に設定

## セットアップ方法

### 1. Chatworkの設定

1. Chatworkの[APIトークン取得ページ](https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php)にアクセス
2. APIトークンを発行
3. アプリの「外部サービス連携」画面で「新規連携を追加」をクリック
4. サービスタイプで「Chatwork」を選択
5. APIトークンを入力して保存

### 2. Google Chatの設定

1. Google Cloud Consoleで新しいプロジェクトを作成
2. Google Chat APIを有効化
3. OAuth 2.0認証情報を作成
4. 必要なスコープ:
   ```
   - https://www.googleapis.com/auth/chat.spaces.readonly
   - https://www.googleapis.com/auth/chat.messages.readonly
   ```
5. アクセストークンを取得
6. アプリの「外部サービス連携」画面でトークンを設定

### 3. Gmailの設定

1. Google Cloud Consoleで新しいプロジェクトを作成（または既存のものを使用）
2. Gmail APIを有効化
3. OAuth 2.0認証情報を作成
4. 必要なスコープ:
   ```
   - https://www.googleapis.com/auth/gmail.readonly
   - https://www.googleapis.com/auth/gmail.labels
   ```
5. アクセストークンを取得
6. アプリの「外部サービス連携」画面でトークンを設定

## 使い方

### 基本的な流れ

1. **外部サービスを連携**
   - サイドバーから「外部サービス連携」を選択
   - 「新規連携を追加」ボタンをクリック
   - サービス情報とAPIトークンを入力

2. **同期ルールを設定**
   - 連携済みサービスの「ルール」ボタンをクリック
   - フィルター条件を設定（キーワード、送信者、ラベルなど）
   - 自動タスク化の有効/無効を選択
   - デフォルト優先度と担当者を設定

3. **メッセージを同期**
   - 「同期」ボタンをクリックしてメッセージを取得
   - 自動同期を有効にすると定期的に取得

4. **メッセージをタスクに変換**
   - サイドバーから「メッセージプレビュー」を選択
   - タスク化するメッセージを選択
   - 「選択をタスクに変換」ボタンをクリック

### 同期ルールの設定

#### フィルタータイプ

- **すべて**: すべてのメッセージを対象
- **キーワード**: 特定のキーワードを含むメッセージのみ
- **送信者**: 特定の送信者からのメッセージのみ
- **ラベル**: 特定のラベルが付いたメッセージのみ（Gmailのみ）
- **ルーム**: 特定のルーム/スペースのメッセージのみ

#### フィルター値の設定例

- キーワード: `承認,urgent,重要` （カンマ区切りで複数指定）
- 送信者: `yamada@example.com,suzuki@example.com`
- ラベル: `IMPORTANT,STARRED`
- ルーム: Chatworkのルームid、Google ChatのスペースID

#### 自動タスク化

「自動的にタスク化」を有効にすると、ルールに一致したメッセージが自動的にタスクとして作成されます。

## データ構造

### ExternalServiceConnection（外部サービス接続）

```typescript
{
  id: string;                    // UUID
  service_type: string;          // 'chatwork' | 'google_chat' | 'gmail'
  service_name: string;          // サービス名
  account_email: string;         // アカウントメールアドレス
  api_token: string;             // APIトークン
  is_active: boolean;            // 有効/無効
  auto_sync_enabled: boolean;    // 自動同期の有効/無効
  sync_interval_minutes: number; // 同期間隔（分）
  last_sync_at: string;          // 最終同期日時
}
```

### SyncRule（同期ルール）

```typescript
{
  id: string;                    // UUID
  connection_id: string;         // 接続ID
  rule_name: string;             // ルール名
  filter_type: string;           // フィルタータイプ
  filter_value: string;          // フィルター値
  default_priority: string;      // デフォルト優先度
  default_assignee: string;      // デフォルト担当者
  auto_create_task: boolean;     // 自動タスク化
  is_active: boolean;            // ルールの有効/無効
}
```

### ExternalMessage（外部メッセージ）

```typescript
{
  id: string;                    // UUID
  connection_id: string;         // 接続ID
  external_message_id: string;   // 外部サービスのメッセージID
  message_type: string;          // メッセージタイプ
  sender_name: string;           // 送信者名
  sender_email: string;          // 送信者メールアドレス
  subject: string;               // 件名
  body: string;                  // 本文
  room_id: string;               // ルームID
  room_name: string;             // ルーム名
  labels: string[];              // ラベル配列
  is_converted_to_task: boolean; // タスク変換済みかどうか
  task_id: string;               // タスクID
  received_at: string;           // 受信日時
}
```

## API制限について

### Chatwork

- APIリクエスト制限: 100リクエスト/5分
- 推奨同期間隔: 15分以上

### Google Chat

- APIリクエスト制限: プロジェクトごとに異なる
- 推奨同期間隔: 15分以上

### Gmail

- APIリクエスト制限: 1日あたり1,000,000,000クォータユニット
- メッセージ取得: 5クォータユニット/リクエスト
- 推奨同期間隔: 15分以上

## トラブルシューティング

### APIトークンが無効

**症状**: 「API Error: 401」エラーが表示される

**解決方法**:
1. APIトークンが正しいか確認
2. トークンの有効期限が切れていないか確認
3. 必要なスコープが付与されているか確認

### メッセージが取得できない

**症状**: 同期ボタンを押してもメッセージが表示されない

**解決方法**:
1. 接続が「有効」になっているか確認
2. ブラウザのコンソールでエラーを確認
3. ネットワーク接続を確認

### タスク化されない

**症状**: ルールを設定してもタスクが自動作成されない

**解決方法**:
1. ルールが「有効」になっているか確認
2. フィルター条件が正しいか確認
3. 「自動的にタスク化」が有効になっているか確認

## セキュリティとプライバシー

- APIトークンはブラウザのLocalStorageに保存されます
- すべての通信はHTTPSで暗号化されます
- メッセージデータはローカルに保存され、外部サーバーには送信されません
- 本番環境では、より安全なストレージ方法の使用を推奨します

## 今後の予定

- [ ] Slack連携の追加
- [ ] Microsoft Teams連携の追加
- [ ] 自動同期のスケジューラー機能
- [ ] メッセージの既読管理
- [ ] より高度なフィルタリングルール
- [ ] Webhookによるリアルタイム同期

---

**開発者向け情報**

### ファイル構成

```
src/
├── services/external/
│   ├── chatworkService.js       # Chatwork APIクライアント
│   ├── googleChatService.js     # Google Chat APIクライアント
│   ├── gmailService.js          # Gmail APIクライアント
│   └── externalSyncService.js   # 統合同期サービス
├── Pages/
│   ├── ExternalIntegrations.jsx # 連携管理画面
│   └── MessagePreview.jsx       # メッセージプレビュー画面
└── Entities/
    ├── ExternalServiceConnection.json
    ├── SyncRule.json
    └── ExternalMessage.json
```

### 新しいサービスの追加方法

1. `src/services/external/`に新しいサービスクラスを作成
2. `externalSyncService.js`に同期メソッドを追加
3. `ExternalIntegrations.jsx`でUIを更新
4. ドキュメントを更新

---

Generated with Claude Code
