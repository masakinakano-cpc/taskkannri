import React, { useState } from "react";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import googleCalendarService from "../services/google/googleCalendarService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Mail,
  CheckCircle,
  Calendar as CalendarIcon
} from "lucide-react";

/**
 * カレンダー設定ページ
 * Googleアカウントとカレンダーの管理を行う
 */
export default function CalendarSettings() {
  const {
    googleAccounts,
    googleCalendars,
    isLoading,
    removeGoogleAccount,
    syncCalendarList,
    toggleCalendarVisibility,
    updateCalendarColor,
  } = useGoogleCalendar();

  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(null);

  // Googleアカウント追加ボタンクリック
  const handleAddGoogleAccount = () => {
    // ステートを生成して保存（CSRF対策）
    const state = googleCalendarService.generateState();
    sessionStorage.setItem('google_oauth_state', state);

    // 認証URLへリダイレクト
    const authUrl = googleCalendarService.getAuthUrl(state);
    window.location.href = authUrl;
  };

  // アカウント削除確認
  const handleRemoveAccount = (accountId, email) => {
    if (window.confirm(`${email} の連携を解除してもよろしいですか？\n関連するカレンダー情報も削除されます。`)) {
      removeGoogleAccount(accountId);
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
      }
    }
  };

  // カレンダーリストの再同期
  const handleSyncCalendars = (accountId) => {
    syncCalendarList(accountId);
  };

  // カラーパレット
  const colorPalette = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#6366F1', // indigo
  ];

  // アカウントごとにカレンダーをグループ化
  const calendarsByAccount = googleAccounts.map(account => ({
    account,
    calendars: googleCalendars.filter(cal => cal.google_account_id === account.id),
  }));

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">カレンダー情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">カレンダー設定</h2>
            <p className="text-sm text-slate-600 mt-1">Googleカレンダーアカウントとカレンダーを管理</p>
          </div>
          <Button
            onClick={handleAddGoogleAccount}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Googleアカウントを追加
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {googleAccounts.length === 0 ? (
          // 空の状態
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Googleカレンダーを連携しましょう
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              複数のGoogleアカウントを追加して、すべてのカレンダーを一箇所で管理できます。
            </p>
            <Button
              onClick={handleAddGoogleAccount}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              最初のアカウントを追加
            </Button>
          </div>
        ) : (
          // アカウント一覧
          <div className="space-y-6">
            {calendarsByAccount.map(({ account, calendars }) => (
              <div key={account.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* アカウントヘッダー */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 border-b border-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* プロフィール画像 */}
                      {account.profile_image ? (
                        <img
                          src={account.profile_image}
                          alt={account.display_name}
                          className="w-12 h-12 rounded-full ring-2 ring-white shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                          <span className="text-white font-bold text-lg">
                            {account.display_name?.[0] || account.email[0].toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* アカウント情報 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 truncate">
                          {account.display_name || account.email}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <p className="text-sm text-slate-600 truncate">{account.email}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {calendars.length} カレンダー
                          </Badge>
                          {account.is_active && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              連携中
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncCalendars(account.id)}
                        title="カレンダーリストを再同期"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAccount(account.id, account.email)}
                        className="text-red-600 hover:bg-red-50"
                        title="連携を解除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* カレンダーリスト */}
                <div className="p-4 md:p-6">
                  {calendars.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">カレンダーが見つかりません</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleSyncCalendars(account.id)}
                        className="mt-2"
                      >
                        再同期
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {calendars.map((calendar) => (
                        <div
                          key={calendar.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          {/* カラーインジケーター */}
                          <div className="relative">
                            <button
                              onClick={() => setColorPickerOpen(
                                colorPickerOpen === calendar.id ? null : calendar.id
                              )}
                              className="w-6 h-6 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                              style={{ backgroundColor: calendar.color }}
                              title="色を変更"
                            />
                            {/* カラーピッカー */}
                            {colorPickerOpen === calendar.id && (
                              <div className="absolute top-8 left-0 bg-white rounded-lg shadow-xl p-2 z-10 grid grid-cols-5 gap-1">
                                {colorPalette.map(color => (
                                  <button
                                    key={color}
                                    onClick={() => {
                                      updateCalendarColor({ calendarId: calendar.id, color });
                                      setColorPickerOpen(null);
                                    }}
                                    className="w-6 h-6 rounded-full border-2 border-slate-200 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* カレンダー名 */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {calendar.calendar_name}
                            </p>
                            {calendar.description && (
                              <p className="text-xs text-slate-500 truncate">
                                {calendar.description}
                              </p>
                            )}
                          </div>

                          {/* バッジ */}
                          <div className="flex items-center gap-2">
                            {calendar.is_primary && (
                              <Badge variant="outline" className="text-xs">
                                メイン
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {calendar.access_role === 'owner' ? '所有者' :
                               calendar.access_role === 'writer' ? '編集可' :
                               calendar.access_role === 'reader' ? '閲覧のみ' : calendar.access_role}
                            </Badge>
                          </div>

                          {/* 表示切替ボタン */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCalendarVisibility({
                              calendarId: calendar.id,
                              isVisible: !calendar.is_visible,
                            })}
                            title={calendar.is_visible ? 'カレンダーを非表示' : 'カレンダーを表示'}
                          >
                            {calendar.is_visible ? (
                              <Eye className="w-4 h-4 text-blue-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ヘルプセクション */}
        <div className="bg-blue-50 rounded-xl p-6 mt-6 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">使い方のヒント</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>複数のGoogleアカウントを追加して、すべてのカレンダーを一つのビューで管理できます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>カレンダーの色アイコンをクリックして、表示色をカスタマイズできます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>目のアイコンをクリックして、カレンダーの表示/非表示を切り替えられます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>更新アイコンでカレンダーリストを再同期できます</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
