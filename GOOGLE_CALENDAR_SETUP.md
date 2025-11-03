# Googleカレンダー多アカウント連携機能

このアプリケーションでは、複数のGoogleアカウントを連携し、すべてのカレンダーを一箇所で管理できます。

## 主な機能

### 1. 複数アカウント対応
- 仕事用とプライベート用など、複数のGoogleアカウントを同時に連携可能
- 各アカウントのすべてのカレンダーにアクセス
- アカウントごとに色分けとグループ化

### 2. カレンダー管理
- 各カレンダーの表示/非表示を個別に切り替え
- カスタムカラー設定
- アクセス権限（所有者、編集可、閲覧のみ）の表示

### 3. 統合表示
- タスクとGoogleカレンダーのイベントを同一ビューで表示
- カレンダーごとに色分けされたイベント表示
- サイドバーでの簡単な表示切替

### 4. タスク同期
- タスクの期日をGoogleカレンダーのイベントとして追加
- 任意のカレンダーに同期可能

## セットアップ手順

### 1. Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「ライブラリ」から以下のAPIを有効化：
   - Google Calendar API
   - Google People API（ユーザー情報取得用）

### 2. OAuth 2.0クライアントIDの作成

1. 「APIとサービス」→「認証情報」を開く
2. 「認証情報を作成」→「OAuth クライアントID」を選択
3. アプリケーションの種類：「ウェブアプリケーション」
4. 名前：任意の名前（例：「タスク管理アプリ」）
5. **承認済みのリダイレクトURI**に以下を追加：
   - 開発環境：`http://localhost:3000/oauth/callback`
   - 本番環境：`https://yourdomain.com/oauth/callback`
6. 「作成」をクリック
7. **クライアントID**と**クライアントシークレット**をメモ

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下を設定：

```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

**重要**: `.env` ファイルは `.gitignore` に追加して、Git管理外にしてください。

### 4. OAuth同意画面の設定

1. 「APIとサービス」→「OAuth同意画面」を開く
2. ユーザータイプ：「外部」を選択（組織内のみの場合は「内部」）
3. アプリ情報を入力：
   - アプリ名
   - ユーザーサポートメール
   - デベロッパーの連絡先情報
4. スコープの設定：
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. テストユーザーの追加（公開前）

## 使い方

### アカウントの追加

1. サイドバーから「カレンダー設定」を開く
2. 「Googleアカウントを追加」ボタンをクリック
3. Googleのログイン画面で連携するアカウントを選択
4. 権限の確認画面で「許可」をクリック
5. 自動的にカレンダーリストが取得されます

### カレンダーの表示切替

1. カレンダービューを開く
2. 左側のサイドバーでアカウントを展開
3. 各カレンダーの目アイコンをクリックして表示/非表示を切り替え

### カレンダーの色変更

1. カレンダー設定を開く
2. 各カレンダーの色アイコンをクリック
3. カラーパレットから任意の色を選択

### タスクの同期

1. タスク詳細モーダルを開く
2. 「Googleカレンダーに同期」セクションを展開
3. 同期先カレンダーを選択
4. 「イベントとして追加」をクリック

### アカウントの削除

1. カレンダー設定を開く
2. 削除したいアカウントのゴミ箱アイコンをクリック
3. 確認ダイアログで「OK」をクリック

## アーキテクチャ

### データ構造

#### GoogleAccount エンティティ
- `email`: Googleアカウントのメールアドレス
- `google_user_id`: GoogleユーザーID
- `display_name`: 表示名
- `profile_image`: プロフィール画像URL
- `access_token`: アクセストークン
- `refresh_token`: リフレッシュトークン
- `token_expiry`: トークン有効期限
- `is_active`: アカウントが有効かどうか

#### GoogleCalendar エンティティ
- `google_account_id`: 関連するGoogleAccountのID
- `calendar_id`: GoogleカレンダーID
- `calendar_name`: カレンダー名
- `color`: 表示色
- `is_visible`: 表示するかどうか
- `is_primary`: プライマリカレンダーかどうか
- `access_role`: アクセス権限（owner/writer/reader）
- `sync_enabled`: 同期を有効にするかどうか

### コンポーネント構成

```
Pages/
├── CalendarView.jsx          # カレンダービュー（統合表示）
├── CalendarSettings.jsx      # カレンダー設定ページ
└── OAuthCallback.jsx         # OAuth認証コールバック

Components/
├── calendar/
│   ├── CalendarSidebar.jsx   # カレンダー一覧サイドバー
│   └── TaskSyncPanel.jsx     # タスク同期パネル

services/
└── google/
    └── googleCalendarService.js  # Google Calendar API サービス

hooks/
└── useGoogleCalendar.js      # Googleカレンダー操作フック
```

## セキュリティ上の注意

1. **トークンの保護**
   - アクセストークンとリフレッシュトークンは機密情報です
   - Base44のデータベースに保存されますが、可能であれば暗号化を推奨
   - クライアントサイドでトークンを直接扱わないように設計

2. **CSRF対策**
   - OAuth認証時にランダムな`state`パラメータを生成
   - コールバック時に検証を実施

3. **スコープの最小化**
   - 必要最小限のスコープのみを要求
   - 読み取り専用が必要な場合は`.readonly`スコープを使用

4. **トークンの有効期限**
   - アクセストークンは1時間程度で期限切れ
   - 自動的にリフレッシュトークンで更新
   - リフレッシュトークンは長期間有効（手動で無効化しない限り）

## トラブルシューティング

### トークンエラー
- **症状**: 「トークンが無効です」エラー
- **対処**: カレンダー設定からアカウントを削除し、再度追加

### 認証エラー
- **症状**: OAuth認証時にエラー
- **対処**:
  - リダイレクトURIがGoogle Cloud Consoleの設定と一致しているか確認
  - スコープが正しく設定されているか確認

### カレンダーが表示されない
- **症状**: アカウント追加後にカレンダーが表示されない
- **対処**: カレンダー設定の「更新」アイコンでカレンダーリストを再同期

### イベントが表示されない
- **症状**: Googleカレンダーのイベントが表示されない
- **対処**:
  - サイドバーでカレンダーが表示状態になっているか確認
  - ブラウザのコンソールでエラーログを確認

## API制限

- Google Calendar APIには利用制限（クオータ）があります
- 1日あたり100万リクエスト（無料枠）
- 大量のカレンダーを頻繁に同期する場合は注意が必要
- 増分同期（syncToken）を活用して効率化

## 参考リンク

- [Google Calendar API ドキュメント](https://developers.google.com/calendar)
- [OAuth 2.0 認証](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
