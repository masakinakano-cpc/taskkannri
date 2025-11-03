import React, { useState } from "react";
import { useGoogleCalendar } from "../../hooks/useGoogleCalendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

/**
 * タスクをGoogleカレンダーに同期するパネル
 * タスク詳細モーダル内で使用
 */
export default function TaskSyncPanel({ task }) {
  const { googleCalendars, createEventFromTask } = useGoogleCalendar();
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null); // 'success' | 'error' | null

  // 書き込み可能なカレンダーのみフィルタ
  const writableCalendars = googleCalendars.filter(
    cal => cal.access_role === 'owner' || cal.access_role === 'writer'
  );

  // アカウントごとにグループ化
  const calendarsByAccount = writableCalendars.reduce((acc, calendar) => {
    const accountId = calendar.google_account_id;
    if (!acc[accountId]) {
      acc[accountId] = [];
    }
    acc[accountId].push(calendar);
    return acc;
  }, {});

  const handleSync = async () => {
    if (!selectedCalendarId) {
      alert('カレンダーを選択してください');
      return;
    }

    if (!task.due_date) {
      alert('期日が設定されていないタスクは同期できません');
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      await createEventFromTask({
        task,
        calendarId: selectedCalendarId,
      });

      setSyncResult('success');
      setTimeout(() => setSyncResult(null), 3000);
    } catch (error) {
      console.error('同期エラー:', error);
      setSyncResult('error');
      setTimeout(() => setSyncResult(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  if (writableCalendars.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              Googleカレンダー連携なし
            </p>
            <p className="text-xs text-slate-600">
              タスクをGoogleカレンダーに同期するには、カレンダー設定からGoogleアカウントを追加してください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <CalendarIcon className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-slate-900">Googleカレンダーに同期</h4>
      </div>

      {/* カレンダー選択 */}
      <div className="mb-3">
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          同期先カレンダーを選択
        </label>
        <select
          value={selectedCalendarId || ''}
          onChange={(e) => setSelectedCalendarId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">カレンダーを選択...</option>
          {Object.entries(calendarsByAccount).map(([accountId, calendars]) => (
            <optgroup key={accountId} label={calendars[0]?.calendar_name || 'カレンダー'}>
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.calendar_name}
                  {calendar.is_primary ? ' (メイン)' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* 同期ボタン */}
      <Button
        onClick={handleSync}
        disabled={!selectedCalendarId || syncing || !task.due_date}
        className="w-full"
        variant={syncResult === 'success' ? 'default' : 'outline'}
      >
        {syncing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            同期中...
          </>
        ) : syncResult === 'success' ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            同期完了！
          </>
        ) : syncResult === 'error' ? (
          <>
            <AlertCircle className="w-4 h-4 mr-2" />
            同期失敗
          </>
        ) : (
          <>
            <CalendarIcon className="w-4 h-4 mr-2" />
            イベントとして追加
          </>
        )}
      </Button>

      {/* 注意事項 */}
      {!task.due_date && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 rounded p-2 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>期日が設定されていないため、同期できません。</span>
        </div>
      )}

      {syncResult === 'success' && (
        <div className="mt-3 text-xs text-green-700 bg-green-50 rounded p-2">
          ✓ タスクがGoogleカレンダーのイベントとして追加されました
        </div>
      )}

      {syncResult === 'error' && (
        <div className="mt-3 text-xs text-red-700 bg-red-50 rounded p-2">
          エラーが発生しました。もう一度お試しください。
        </div>
      )}
    </div>
  );
}
