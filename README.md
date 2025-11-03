# 承認タスク管理アプリ with Googleカレンダー多アカウント連携

React + Vite + TailwindCSSで構築された、承認ワークフロー管理とGoogleカレンダー統合機能を持つタスク管理アプリケーションです。

## 🌟 主な機能

### 📋 タスク管理
- カンバンボード形式のタスク管理
- 承認ステータスの可視化（準備中、承認待、差戻、承認済、完了）
- 優先度とカテゴリでの分類
- 期日管理とリマインダー

### 📅 Googleカレンダー多アカウント連携
- 複数のGoogleアカウントを同時に連携可能
- アカウントごとのカレンダー表示/非表示切替
- カスタムカラー設定
- タスクの期日をGoogleカレンダーに自動同期
- タスクとカレンダーイベントの統合表示

### 📊 各種ビュー
- **ダッシュボード**: 統計情報と通知の一覧表示
- **カンバンボード**: ドラッグ&ドロップでタスク管理
- **カレンダービュー**: 月次カレンダーでタスクとイベントを表示
- **タイムライン**: 時系列でタスクを確認
- **テンプレート**: よく使うタスクをテンプレート化

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# または
yarn install
```

### 環境変数の設定

プロジェクトルートに `.env` ファイルを作成：

```env
# Google Calendar API設定
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

詳細な設定方法は [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md) を参照してください。

### 開発サーバーの起動

```bash
npm run dev

# または
yarn dev
```

ブラウザで http://localhost:3000 を開きます。

### ビルド

```bash
npm run build

# または
yarn build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

## 📁 プロジェクト構造

```
個人タスク管理/
├── src/
│   ├── main.jsx                 # エントリーポイント
│   ├── App.jsx                  # ルーティング設定
│   ├── api/
│   │   └── base44Client.js      # モックデータストア
│   ├── components/
│   │   └── ui/                  # 共通UIコンポーネント
│   ├── styles/
│   │   └── index.css            # グローバルスタイル
│   └── utils/
│       └── index.js             # ユーティリティ関数
├── Pages/                       # ページコンポーネント
│   ├── Dashboard.jsx
│   ├── KanbanBoard.jsx
│   ├── CalendarView.jsx
│   ├── TimelineView.jsx
│   ├── Templates.jsx
│   ├── CalendarSettings.jsx
│   └── OAuthCallback.jsx
├── Components/                  # 機能別コンポーネント
│   ├── dashboard/
│   ├── kanban/
│   └── calendar/
│       ├── CalendarSidebar.jsx
│       └── TaskSyncPanel.jsx
├── services/                    # 外部サービス連携
│   └── google/
│       └── googleCalendarService.js
├── hooks/                       # カスタムフック
│   └── useGoogleCalendar.js
├── Entities/                    # データモデル定義
│   ├── Task.json
│   ├── Template.json
│   ├── GoogleAccount.json
│   └── GoogleCalendar.json
├── Layout.js                    # 共通レイアウト
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎯 使い方

### 1. 基本的なタスク管理

1. ダッシュボードまたはカンバンボードでタスクを作成
2. タスクの詳細を入力（タイトル、説明、期日、承認者など）
3. ステータスを更新して承認フローを管理

### 2. Googleカレンダー連携

#### アカウントの追加
1. サイドバーから「カレンダー設定」を開く
2. 「Googleアカウントを追加」ボタンをクリック
3. Googleの認証画面でアカウントを選択
4. 権限を許可すると自動的にカレンダーが読み込まれます

#### カレンダーの表示切替
1. カレンダービューを開く
2. 左サイドバーでアカウントを展開
3. 各カレンダーの目アイコンで表示/非表示を切替

#### タスクの同期
1. タスク詳細モーダルを開く
2. 「Googleカレンダーに同期」セクションで同期先を選択
3. 「イベントとして追加」をクリック

### 3. カスタマイズ

- カレンダーの色変更: カレンダー設定で色アイコンをクリック
- テンプレート作成: よく使うタスクをテンプレートとして保存

## 🔧 開発情報

### 技術スタック

- **フロントエンド**: React 18
- **ビルドツール**: Vite
- **スタイリング**: TailwindCSS
- **ルーティング**: React Router v6
- **データ管理**: TanStack Query (React Query)
- **日付処理**: date-fns
- **アイコン**: lucide-react
- **データストア**: LocalStorage（モック）/ Base44 BaaS（本番）

### モックデータについて

開発・テスト用に、LocalStorageを使用したモックBase44クライアントを実装しています。
実際のBase44 BaaSに切り替える場合は、`src/api/base44Client.js` を本物のクライアントに置き換えてください。

### Google Calendar API設定

詳細は [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md) を参照してください。

主な手順：
1. Google Cloud Consoleでプロジェクト作成
2. Calendar APIを有効化
3. OAuth 2.0クライアントIDを作成
4. リダイレクトURIを設定
5. 環境変数を設定

## 🐛 トラブルシューティング

### ビルドエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules
npm install
```

### Googleカレンダーが表示されない

1. 環境変数が正しく設定されているか確認
2. ブラウザのコンソールでエラーを確認
3. Google Cloud ConsoleでAPI制限を確認
4. カレンダー設定で「更新」ボタンをクリック

### OAuth認証エラー

1. リダイレクトURIがGoogle Cloud Consoleの設定と一致しているか確認
2. ブラウザのCookieとキャッシュをクリア
3. 別のブラウザで試してみる

## 📝 ライセンス

MIT License

## 🙏 謝辞

このプロジェクトは以下を参考にしています：
- Notion Calendar - UI/UXデザイン
- Google Calendar API - カレンダー連携
- TailwindCSS - スタイリング

## 📧 お問い合わせ

質問や提案がある場合は、Issueを作成してください。

---

**Happy Task Managing! 🎉**
