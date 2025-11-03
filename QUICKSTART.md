# 🚀 クイックスタートガイド

このガイドに従って、5分でアプリを起動できます！

## ステップ1: 依存関係のインストール

プロジェクトディレクトリで以下を実行：

```bash
npm install
```

> Node.js 18以上が必要です。まだインストールしていない場合は [nodejs.org](https://nodejs.org/) からダウンロードしてください。

## ステップ2: 環境変数の設定（オプション）

Googleカレンダー連携を使う場合のみ必要です。テストだけなら**スキップ可能**です。

`.env.example` を `.env` にコピー：

```bash
cp .env.example .env
```

`.env` ファイルを編集して、Google Cloud Consoleから取得したクライアントIDとシークレットを設定：

```env
REACT_APP_GOOGLE_CLIENT_ID=あなたのクライアントID
REACT_APP_GOOGLE_CLIENT_SECRET=あなたのクライアントシークレット
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

詳細は [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md) を参照してください。

## ステップ3: 開発サーバーの起動

```bash
npm run dev
```

自動的にブラウザが開き、 http://localhost:3000 が表示されます。

## ステップ4: アプリを使ってみる

### 基本的な機能を試す

1. **ダッシュボード**: アプリが開いたら、サンプルタスクが3つ表示されます
2. **カンバンボード**: サイドバーから「カンバンボード」を選択
3. **カレンダー**: 「カレンダー」でタスクをカレンダー形式で表示

### タスクを作成してみる

1. カンバンボードまたはダッシュボードで「+ 新規タスク」をクリック
2. タイトル、説明、期日などを入力
3. 「保存」をクリック

### Googleカレンダー連携を試す（環境変数設定済みの場合）

1. サイドバーから「カレンダー設定」を開く
2. 「Googleアカウントを追加」をクリック
3. Googleの認証画面で連携するアカウントを選択
4. カレンダービューでタスクとGoogleカレンダーのイベントが統合表示されます

## 🎉 完了！

これで承認タスク管理アプリが使えるようになりました。

## 次のステップ

- 📖 [README.md](./README.md) で全機能の詳細を確認
- 📅 [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md) でGoogleカレンダー連携の詳細設定
- 🛠️ `src/api/base44Client.js` を実際のBase44クライアントに置き換えて本番利用

## トラブルシューティング

### ポート3000が既に使用されている

```bash
# ポートを変更して起動
PORT=3001 npm run dev
```

または `vite.config.js` の `server.port` を変更してください。

### インストールエラーが出る

```bash
# キャッシュをクリアして再インストール
rm -rf node_modules package-lock.json
npm install
```

### ページが真っ白

1. ブラウザのコンソール（F12）でエラーを確認
2. `npm run dev` を再起動
3. ブラウザのキャッシュをクリア（Ctrl+Shift+R / Cmd+Shift+R）

## 📧 ヘルプ

問題が解決しない場合は、GitHubのIssueを作成してください。

---

Happy Coding! 💻✨
