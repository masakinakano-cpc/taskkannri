# 承認タスク管理アプリケーション - 要件定義書

React + Vite + TailwindCSSで構築された、Googleカレンダー多アカウント連携機能を持つタスク管理アプリケーション。
Notion Calendarのようなユーザー体験を提供し、個人・チームでの承認フロー付きタスク管理を実現します。

**デプロイURL**: https://masakinakano-cpc.github.io/taskkannri/
**GitHubリポジトリ**: https://github.com/masakinakano-cpc/taskkannri

---

## 📋 目次

- [プロジェクト概要](#プロジェクト概要)
- [主要機能](#主要機能)
- [技術スタック](#技術スタック)
- [データ構造](#データ構造)
- [ディレクトリ構成](#ディレクトリ構成)
- [セットアップ方法](#セットアップ方法)
- [Google Calendar API設定](#google-calendar-api設定)
- [機能詳細仕様](#機能詳細仕様)
- [UI/UX デザイン仕様](#uiux-デザイン仕様)
- [トラブルシューティング](#トラブルシューティング)
- [今後の開発予定](#今後の開発予定)

---

## 🌟 プロジェクト概要

### ビジョン
複数のGoogleカレンダーアカウントを統合し、タスク管理と承認ワークフローを一元管理できるアプリケーション。

### 主な特徴
- ✅ **複数アカウント対応**: 複数のGoogleアカウントを同時に連携可能
- ✅ **承認ワークフロー**: タスクの承認フローを可視化・管理
- ✅ **統合カレンダー**: タスクとGoogleカレンダーイベントを統合表示
- ✅ **カスタマイズ可能**: カレンダーごとに色をカスタマイズ
- ✅ **オフライン対応**: LocalStorageによるデータ永続化

---

## 🎯 主要機能

### 1. タスク管理機能

#### 1.1 ダッシュボード
**概要**: タスクの全体像を把握するための統計・分析画面

**機能詳細**:
- **統計カード表示**
  - 総タスク数
  - 保留中タスク数（status: pending）
  - 完了タスク数（status: completed, approved）
  - 承認待ちタスク数（status: approval）

- **データ可視化**
  - ステータス別タスク分布（円グラフ）
  - 優先度別タスク分布（棒グラフ）
  - 期限別タスク分布（棒グラフ - 今日、明日、今週、今月）

- **通知パネル**
  - 期限が24時間以内のタスクを警告
  - 承認待ちタスクの件数表示
  - 期限超過タスクの警告

- **最近のタスク一覧**
  - 作成日時順で最新5件を表示
  - ステータス・優先度・期限をバッジで表示
  - クリックでタスク詳細モーダルを開く

#### 1.2 カンバンボード
**概要**: ドラッグ&ドロップでタスクを視覚的に管理

**機能詳細**:
- **ドラッグ&ドロップ**
  - @hello-pangea/dnd ライブラリを使用
  - タスクを別のステータスカラムに移動
  - ドロップ時に自動的にステータス更新

- **ステータスカラム**（5種類）
  1. 未着手 (pending) - グレー
  2. 進行中 (in_progress) - ブルー
  3. 承認待ち (approval) - イエロー
  4. 完了 (completed) - グリーン
  5. 承認済み (approved) - インディゴ

- **フィルター機能**
  - 優先度フィルター（High / Medium / Low）
  - ステータスフィルター
  - キーワード検索（タイトル・説明で検索）

- **タスクカード**
  - タイトル、説明（省略表示）
  - 優先度バッジ
  - 期限表示（期限超過は赤色）
  - 担当者表示

#### 1.3 カレンダービュー
**概要**: 月次カレンダーでタスクとGoogleカレンダーイベントを統合表示

**機能詳細**:
- **月表示カレンダー**
  - date-fns による日付計算
  - 前月・当月・次月の移動
  - 今日の日付をハイライト

- **タスク表示**
  - 期限日にタスクを表示
  - 優先度で色分け（High: 赤、Medium: 黄、Low: 緑）
  - 複数タスクは縦に並べて表示

- **Googleカレンダー統合**
  - 複数アカウントのイベントを統合表示
  - カレンダーごとに設定した色で表示
  - イベントタイトルの表示

- **サイドバー**
  - アカウント別にカレンダーをグループ表示
  - カレンダーの表示/非表示切り替え（目アイコン）
  - アカウントの展開/折りたたみ

- **タスク操作**
  - 日付クリックで新規タスク作成
  - タスククリックで詳細モーダル表示

#### 1.4 タイムラインビュー
**概要**: 期限順でタスクを時系列表示

**機能詳細**:
- **期限グループ分け**
  - 今日（期限が本日）
  - 明日（期限が明日）
  - 今週（期限が7日以内）
  - 今月（期限が30日以内）
  - 期限なし

- **視覚的フィードバック**
  - 期限超過タスクは赤色背景
  - 期限が近いタスク（24時間以内）は黄色背景
  - 期限が3日以内のタスクはオレンジ背景

- **タスク詳細**
  - タイトル、説明、優先度、担当者を表示
  - クリックで詳細モーダルを開く

#### 1.5 テンプレート機能
**概要**: 頻繁に使うタスクをテンプレート化して効率化

**機能詳細**:
- **テンプレート作成**
  - テンプレート名
  - 説明
  - カテゴリ分類
  - デフォルト優先度
  - デフォルト担当者
  - デフォルト期限（作成日から何日後）

- **テンプレート管理**
  - テンプレート一覧表示
  - テンプレート編集
  - テンプレート削除
  - テンプレートコピー

- **テンプレートからタスク作成**
  - テンプレートを選択して新規タスクを作成
  - デフォルト値が自動入力される
  - 必要に応じて値を変更可能

---

### 2. Google カレンダー連携機能

#### 2.1 認証・アカウント管理
**概要**: OAuth 2.0による安全な認証と複数アカウント対応

**技術仕様**:
- **OAuth 2.0 フロー**
  - Authorization Code Flow を使用
  - `prompt=select_account` で複数アカウント選択を強制
  - `prompt=consent` で権限再確認

- **スコープ**
  ```
  - calendar.readonly: カレンダーの読み取り
  - calendar.events: イベントの作成・編集・削除
  - userinfo.email: メールアドレス取得
  - userinfo.profile: プロフィール情報取得
  ```

- **トークン管理**
  - アクセストークンの自動リフレッシュ
  - トークン有効期限チェック（1時間前に更新）
  - LocalStorageに保存（開発環境）

#### 2.2 カレンダー同期
**概要**: Googleカレンダーのイベントを取得・表示

**機能詳細**:
- **カレンダー一覧取得**
  - 各アカウントのカレンダー一覧を自動取得
  - カレンダー名、色情報を保存

- **イベント取得**
  - カレンダービューの表示期間に応じて取得
  - 複数カレンダーから並行取得
  - イベントデータ: タイトル、開始日時、終了日時、説明

- **表示設定**
  - カレンダーごとに表示/非表示切り替え
  - カラーカスタマイズ（カラーピッカー）
  - 同期オン/オフ切り替え

#### 2.3 カレンダー設定画面
**概要**: Googleアカウントとカレンダーの管理

**機能詳細**:
- **アカウント管理セクション**
  - 「Googleアカウントを追加」ボタン
  - 接続済みアカウント一覧
  - アカウント削除ボタン
  - 同期状態表示（最終同期日時）

- **カレンダー管理セクション**
  - アカウント別にカレンダーをグループ表示
  - カレンダー名と現在の色を表示
  - カラーピッカーで色変更
  - 表示/非表示スイッチ
  - 同期有効/無効スイッチ

- **同期設定**
  - 「すべてのカレンダーを更新」ボタン
  - 自動同期間隔設定（今後実装予定）

---

## 🔧 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 18.x | UIフレームワーク |
| Vite | 5.4.x | ビルドツール・開発サーバー |
| React Router | 6.x | クライアントサイドルーティング |
| TanStack Query | 5.x | サーバーステート管理 |
| TailwindCSS | 3.x | CSSフレームワーク |
| date-fns | 3.x | 日付操作ライブラリ |
| Lucide React | - | アイコンライブラリ |
| @hello-pangea/dnd | - | ドラッグ&ドロップ |
| Recharts | 2.x | チャート・グラフ表示 |

### API・サービス
- **Google Calendar API v3**
  - カレンダー一覧取得
  - イベント一覧取得
  - イベント作成・更新・削除

### データ管理（開発環境）
- **LocalStorage**
  - タスクデータ
  - テンプレートデータ
  - Googleアカウント情報
  - カレンダー設定

### デプロイ・CI/CD
- **GitHub Pages**: 静的サイトホスティング
- **GitHub Actions**: 自動ビルド・デプロイ

---

## 📊 データ構造

### Task（タスク）
```typescript
interface Task {
  id: string;                    // UUID
  title: string;                 // タスク名
  description: string;           // 詳細説明
  status: 'pending' | 'in_progress' | 'approval' | 'completed' | 'approved';
  priority: 'low' | 'medium' | 'high';
  assignee: string;              // 担当者名
  due_date: string;              // ISO 8601形式 (YYYY-MM-DD)
  created_at: string;            // ISO 8601形式
  updated_at: string;            // ISO 8601形式
  approver?: string;             // 承認者名（オプション）
  approval_status?: string;      // 承認ステータス（オプション）
}
```

### Template（テンプレート）
```typescript
interface Template {
  id: string;                    // UUID
  name: string;                  // テンプレート名
  description: string;           // 説明
  category: string;              // カテゴリ
  default_priority: 'low' | 'medium' | 'high';
  default_assignee: string;      // デフォルト担当者
  default_due_days: number;      // 作成日から何日後が期限か
  created_at: string;            // ISO 8601形式
  updated_at: string;            // ISO 8601形式
}
```

### GoogleAccount（Googleアカウント）
```typescript
interface GoogleAccount {
  id: string;                    // UUID
  email: string;                 // Googleアカウントのメールアドレス
  google_user_id: string;        // Google User ID
  access_token: string;          // OAuth アクセストークン
  refresh_token: string;         // OAuth リフレッシュトークン
  token_expiry: string;          // トークン有効期限 (ISO 8601)
  is_active: boolean;            // アカウントの有効/無効
  created_at: string;            // ISO 8601形式
  updated_at: string;            // ISO 8601形式
}
```

### GoogleCalendar（Googleカレンダー設定）
```typescript
interface GoogleCalendar {
  id: string;                    // UUID
  google_account_id: string;     // GoogleAccountへの外部キー
  calendar_id: string;           // Googleカレンダーの実際のID
  calendar_name: string;         // カレンダー名
  color: string;                 // 表示色 (Hex色コード)
  is_visible: boolean;           // 表示/非表示
  sync_enabled: boolean;         // 同期有効/無効
  created_at: string;            // ISO 8601形式
  updated_at: string;            // ISO 8601形式
}
```

---

## 📁 ディレクトリ構成

```
個人タスク管理/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions デプロイワークフロー
├── public/                         # 静的アセット
├── src/
│   ├── api/
│   │   └── base44Client.js         # モックBase44クライアント（LocalStorage）
│   ├── components/
│   │   ├── ui/                     # 共通UIコンポーネント
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   ├── select.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── badge.jsx
│   │   │   └── sidebar.jsx
│   │   ├── calendar/               # カレンダー関連コンポーネント
│   │   │   ├── CalendarSidebar.jsx # カレンダー表示切替サイドバー
│   │   │   └── TaskSyncPanel.jsx   # タスク同期パネル
│   │   ├── dashboard/              # ダッシュボード関連
│   │   │   ├── StatsCard.jsx       # 統計カード
│   │   │   ├── NotificationPanel.jsx # 通知パネル
│   │   │   └── RecentTasksList.jsx # 最近のタスク一覧
│   │   └── kanban/                 # カンバンボード関連
│   │       ├── KanbanColumn.jsx    # カンバンカラム
│   │       ├── TaskCard.jsx        # タスクカード
│   │       └── TaskDetailModal.jsx # タスク詳細モーダル
│   ├── hooks/
│   │   └── useGoogleCalendar.js    # Googleカレンダーカスタムフック
│   ├── Pages/                      # ページコンポーネント
│   │   ├── Dashboard.jsx           # ダッシュボード画面
│   │   ├── KanbanBoard.jsx         # カンバンボード画面
│   │   ├── CalendarView.jsx        # カレンダービュー画面
│   │   ├── TimelineView.jsx        # タイムライン画面
│   │   ├── Templates.jsx           # テンプレート管理画面
│   │   ├── CalendarSettings.jsx   # カレンダー設定画面
│   │   └── OAuthCallback.jsx       # OAuth認証コールバック画面
│   ├── services/
│   │   └── google/
│   │       └── googleCalendarService.js # Google Calendar API サービス
│   ├── styles/
│   │   └── index.css               # グローバルスタイル（Tailwind設定）
│   ├── utils/
│   │   └── index.js                # ユーティリティ関数（cn, createPageUrl）
│   ├── App.jsx                     # ルーティング設定
│   ├── Layout.jsx                  # 共通レイアウト（サイドバー付き）
│   └── main.jsx                    # Reactエントリーポイント
├── Entities/                       # エンティティスキーマ定義（参考）
│   ├── Task.json
│   ├── Template.json
│   ├── GoogleAccount.json
│   └── GoogleCalendar.json
├── index.html                      # HTMLエントリーポイント
├── package.json                    # npm依存関係
├── vite.config.js                  # Vite設定
├── tailwind.config.js              # TailwindCSS設定
├── postcss.config.js               # PostCSS設定
├── .gitignore                      # Git除外設定
└── README.md                       # このファイル
```

---

## 🚀 セットアップ方法

### 前提条件
- **Node.js**: 18以上
- **npm** または **yarn**
- **Git**

### インストール手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/masakinakano-cpc/taskkannri.git
cd taskkannri
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境変数の設定（オプション）**

プロジェクトルートに`.env`ファイルを作成：

```env
# Google OAuth 2.0 設定
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

> **注意**: Viteでは`VITE_`プレフィックスが必要です。

4. **開発サーバーの起動**
```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

5. **本番ビルド**
```bash
npm run build
```

ビルドされたファイルは`dist/`ディレクトリに出力されます。

6. **ビルドのプレビュー**
```bash
npm run preview
```

---

## 🔐 Google Calendar API設定

### 1. Google Cloud Consoleでプロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトを選択

### 2. Google Calendar APIを有効化

1. 「APIとサービス」→「ライブラリ」を開く
2. "Google Calendar API"を検索
3. 「有効にする」をクリック

### 3. OAuth 2.0 認証情報の作成

1. 「APIとサービス」→「認証情報」を開く
2. 「認証情報を作成」→「OAuth クライアント ID」を選択
3. アプリケーションの種類: **ウェブアプリケーション**
4. 名前: 任意（例: "タスク管理アプリ"）
5. **承認済みのリダイレクトURI**を追加:
   - 開発環境: `http://localhost:3000/oauth/callback`
   - 本番環境: `https://masakinakano-cpc.github.io/taskkannri/oauth/callback`
6. 「作成」をクリック

### 4. クライアントIDとシークレットを取得

1. 作成されたOAuthクライアントをクリック
2. **クライアントID**と**クライアントシークレット**をコピー
3. `.env`ファイルに設定

### 5. OAuth同意画面の設定

1. 「APIとサービス」→「OAuth同意画面」を開く
2. ユーザータイプ: **外部** を選択
3. アプリ名、サポートメール、デベロッパー連絡先情報を入力
4. 「保存して次へ」
5. スコープを追加:
   ```
   - https://www.googleapis.com/auth/calendar.readonly
   - https://www.googleapis.com/auth/calendar.events
   - https://www.googleapis.com/auth/userinfo.email
   - https://www.googleapis.com/auth/userinfo.profile
   ```
6. テストユーザーに自分のGoogleアカウントを追加（開発中）

---

## 📖 機能詳細仕様

### タスクのステータス遷移フロー

```
┌─────────┐
│ pending │ 未着手
└────┬────┘
     │
     ↓
┌──────────────┐
│ in_progress  │ 進行中
└──────┬───────┘
       │
       ↓
  ┌─────────┐
  │ approval│ 承認待ち
  └────┬────┘
       │
   ┌───┴───┐
   ↓       ↓
┌──────┐ ┌─────────┐
│completed│ │approved │
└──────┘ └─────────┘
完了      承認済み
```

### 優先度レベル

| 優先度 | 色 | 説明 |
|--------|---|------|
| High | 赤 | 緊急対応が必要なタスク |
| Medium | 黄 | 通常の優先度 |
| Low | 緑 | 時間があるときに対応 |

### 期限管理ルール

| 条件 | 表示 |
|------|------|
| 期限超過 | 赤色背景で強調 |
| 24時間以内 | 黄色背景で警告 |
| 3日以内 | オレンジ色で注意 |
| それ以降 | 通常表示 |

---

## 🎨 UI/UX デザイン仕様

### デザインシステム

#### カラーパレット
```
- Primary: Blue (500-600) - #3B82F6
- Secondary: Indigo (500-600) - #6366F1
- Success: Green (500) - #22C55E
- Warning: Yellow (500) - #EAB308
- Error: Red (500) - #EF4444
- Background: Slate (50-100) - #F8FAFC ~ #F1F5F9
- Text: Slate (700-900) - #334155 ~ #0F172A
```

#### タイポグラフィ
- **見出し**: `font-bold text-lg ~ text-2xl`
- **本文**: `text-sm ~ text-base`
- **キャプション**: `text-xs`

#### スペーシング
- **余白**: `p-2 ~ p-6` (8px ~ 24px)
- **間隔**: `gap-2 ~ gap-6` (8px ~ 24px)
- **角丸**: `rounded-md ~ rounded-xl` (6px ~ 12px)

### レスポンシブブレークポイント

| サイズ | 幅 | デバイス |
|--------|-----|---------|
| sm | 640px | モバイル |
| md | 768px | タブレット |
| lg | 1024px | デスクトップ小 |
| xl | 1280px | デスクトップ大 |

---

## 🐛 トラブルシューティング

### ビルドエラー

**問題**: `npm run build`でエラーが発生

**解決策**:
```bash
# キャッシュをクリア
rm -rf node_modules dist .vite
npm install
npm run build
```

### Googleカレンダーが表示されない

**チェックリスト**:
- [ ] 環境変数が正しく設定されているか（`VITE_`プレフィックス）
- [ ] ブラウザのコンソールでエラーを確認
- [ ] Google Cloud ConsoleでAPI制限を確認
- [ ] リダイレクトURIが正しく設定されているか
- [ ] カレンダー設定で「更新」ボタンをクリック

### OAuth認証エラー

**問題**: `redirect_uri_mismatch`エラー

**解決策**:
1. Google Cloud Consoleの「承認済みのリダイレクトURI」を確認
2. `.env`ファイルの`VITE_GOOGLE_REDIRECT_URI`と一致しているか確認
3. ブラウザのCookieとキャッシュをクリア

**問題**: トークンの有効期限切れ

**解決策**:
- アプリが自動的にリフレッシュします
- 手動で再認証する場合: カレンダー設定でアカウントを削除→再追加

### ローカル開発で画面が真っ白

**解決策**:
1. ブラウザのコンソール（F12）でエラーを確認
2. `import.meta.env`を使用しているか確認（`process.env`ではない）
3. ハードリフレッシュ（Cmd+Shift+R または Ctrl+Shift+R）

---

## 📅 今後の開発予定

### Phase 2（短期）
- [ ] タスクのGoogleカレンダーへの双方向同期
- [ ] リアルタイム通知機能
- [ ] タスクのコメント機能
- [ ] ファイル添付機能
- [ ] モバイルレスポンシブ最適化

### Phase 3（中期）
- [ ] チームメンバー管理
- [ ] 権限管理（閲覧・編集・承認権限）
- [ ] タスクのサブタスク機能
- [ ] ガントチャート表示
- [ ] データエクスポート機能（CSV, JSON）

### Phase 4（長期）
- [ ] AIによるタスク優先度提案
- [ ] 自動スケジューリング機能
- [ ] 他のカレンダーサービス連携（Outlook, iCloud）
- [ ] モバイルアプリ（React Native）
- [ ] デスクトップアプリ（Electron）

---

## 📝 ライセンス

このプロジェクトは個人利用を目的としています。

---

## 🙏 謝辞

このプロジェクトは以下を参考にしています：
- **Notion Calendar** - UI/UXデザインインスピレーション
- **Google Calendar API** - カレンダー連携機能
- **TailwindCSS** - デザインシステム
- **shadcn/ui** - UIコンポーネントデザイン

---

## 📧 サポート

質問や問題がある場合は、GitHubのIssuesセクションで報告してください。

**GitHub Issues**: https://github.com/masakinakano-cpc/taskkannri/issues

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

**Happy Task Managing! 🎉**
