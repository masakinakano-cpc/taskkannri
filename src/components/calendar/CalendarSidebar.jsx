import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleCalendar } from "../../hooks/useGoogleCalendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";

/**
 * カレンダー一覧サイドバーコンポーネント
 * アカウントごとにグループ化されたカレンダーを表示し、色分けと表示切替を提供
 */
export default function CalendarSidebar() {
  const navigate = useNavigate();
  const {
    googleAccounts,
    googleCalendars,
    toggleCalendarVisibility,
    isLoading,
  } = useGoogleCalendar();

  const [expandedAccounts, setExpandedAccounts] = useState(
    googleAccounts.reduce((acc, account) => ({ ...acc, [account.id]: true }), {})
  );

  // アカウントの展開/折りたたみを切り替え
  const toggleAccountExpanded = (accountId) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  // アカウントごとにカレンダーをグループ化
  const calendarsByAccount = googleAccounts.map(account => ({
    account,
    calendars: googleCalendars.filter(cal => cal.google_account_id === account.id),
  }));

  // 表示中のカレンダー数をカウント
  const visibleCount = googleCalendars.filter(cal => cal.is_visible).length;

  if (isLoading) {
    return (
      <div className="w-72 bg-white border-r border-slate-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-200 rounded" />
          <div className="h-6 bg-slate-200 rounded" />
          <div className="h-6 bg-slate-200 rounded" />
          <div className="h-6 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-900">カレンダー</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/calendar-settings')}
            title="カレンダー設定"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>{visibleCount} / {googleCalendars.length} 表示中</span>
        </div>
      </div>

      {/* カレンダーリスト */}
      <div className="flex-1 overflow-y-auto p-2">
        {googleAccounts.length === 0 ? (
          // 空の状態
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Googleカレンダーを連携していません
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/calendar-settings')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="w-3 h-3 mr-1" />
              アカウントを追加
            </Button>
          </div>
        ) : (
          // アカウントごとのカレンダーリスト
          <div className="space-y-1">
            {calendarsByAccount.map(({ account, calendars }) => (
              <div key={account.id} className="mb-2">
                {/* アカウントヘッダー */}
                <button
                  onClick={() => toggleAccountExpanded(account.id)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {expandedAccounts[account.id] ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}

                  {account.profile_image ? (
                    <img
                      src={account.profile_image}
                      alt={account.display_name}
                      className="w-6 h-6 rounded-full ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {account.display_name?.[0] || account.email[0].toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {account.display_name || account.email}
                    </p>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {calendars.length}
                  </Badge>
                </button>

                {/* カレンダーリスト */}
                {expandedAccounts[account.id] && (
                  <div className="ml-6 mt-1 space-y-1">
                    {calendars.length === 0 ? (
                      <p className="text-xs text-slate-500 px-2 py-1">
                        カレンダーなし
                      </p>
                    ) : (
                      calendars.map((calendar) => (
                        <div
                          key={calendar.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors ${
                            !calendar.is_visible ? 'opacity-50' : ''
                          }`}
                        >
                          {/* カラーインジケーター */}
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: calendar.color }}
                          />

                          {/* カレンダー名 */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${
                              calendar.is_visible ? 'text-slate-900' : 'text-slate-500'
                            }`}>
                              {calendar.calendar_name}
                            </p>
                          </div>

                          {/* プライマリバッジ */}
                          {calendar.is_primary && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              メイン
                            </Badge>
                          )}

                          {/* 表示切替ボタン */}
                          <button
                            onClick={() => toggleCalendarVisibility({
                              calendarId: calendar.id,
                              isVisible: !calendar.is_visible,
                            })}
                            className="flex-shrink-0 p-1 hover:bg-slate-200 rounded transition-colors"
                            title={calendar.is_visible ? 'カレンダーを非表示' : 'カレンダーを表示'}
                          >
                            {calendar.is_visible ? (
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="p-3 border-t border-slate-200">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center"
          onClick={() => navigate('/calendar-settings')}
        >
          <Settings className="w-4 h-4 mr-2" />
          カレンダー設定
        </Button>
      </div>
    </div>
  );
}
