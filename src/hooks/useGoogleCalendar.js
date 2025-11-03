import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import googleCalendarService from "@/services/google/googleCalendarService";

/**
 * Google Calendar連携のためのカスタムフック
 * 複数アカウント対応のGoogleカレンダー機能を提供
 */
export function useGoogleCalendar() {
  const queryClient = useQueryClient();

  // Googleアカウント一覧を取得
  const {
    data: googleAccounts = [],
    isLoading: isLoadingAccounts,
    error: accountsError,
  } = useQuery({
    queryKey: ['google-accounts'],
    queryFn: async () => {
      const accounts = await base44.entities.GoogleAccount.list("-connected_at");
      return accounts.filter(acc => acc.is_active);
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });

  // Googleカレンダー一覧を取得
  const {
    data: googleCalendars = [],
    isLoading: isLoadingCalendars,
    error: calendarsError,
  } = useQuery({
    queryKey: ['google-calendars'],
    queryFn: async () => {
      const calendars = await base44.entities.GoogleCalendar.list("display_order");
      return calendars;
    },
    enabled: googleAccounts.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // 表示中のカレンダーのみフィルタリング
  const visibleCalendars = googleCalendars.filter(cal => cal.is_visible);

  /**
   * アクセストークンを取得（期限切れの場合は自動更新）
   */
  const getValidAccessToken = async (accountId) => {
    const account = googleAccounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new Error('アカウントが見つかりません');
    }

    const now = new Date();
    const expiry = new Date(account.token_expiry);

    // トークンが期限切れまたは5分以内に期限切れの場合、リフレッシュ
    if (expiry <= new Date(now.getTime() + 5 * 60 * 1000)) {
      const newTokenData = await googleCalendarService.refreshAccessToken(
        account.refresh_token
      );

      // 更新されたトークンをBase44に保存
      await base44.entities.GoogleAccount.update(accountId, {
        access_token: newTokenData.access_token,
        token_expiry: newTokenData.token_expiry,
      });

      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ['google-accounts'] });

      return newTokenData.access_token;
    }

    return account.access_token;
  };

  // Googleアカウントを追加
  const addGoogleAccountMutation = useMutation({
    mutationFn: async (code) => {
      // 認証コードからトークンを取得
      const tokenData = await googleCalendarService.getAccessToken(code);

      // ユーザー情報を取得
      const userInfo = await googleCalendarService.getUserInfo(tokenData.access_token);

      // 既存アカウントチェック
      const existingAccounts = await base44.entities.GoogleAccount.list();
      const existing = existingAccounts.find(
        acc => acc.google_user_id === userInfo.google_user_id
      );

      if (existing) {
        // 既存アカウントの場合は更新
        return await base44.entities.GoogleAccount.update(existing.id, {
          ...userInfo,
          ...tokenData,
          is_active: true,
          connected_at: new Date().toISOString(),
        });
      }

      // 新規アカウントを作成
      return await base44.entities.GoogleAccount.create({
        ...userInfo,
        ...tokenData,
        is_active: true,
        connected_at: new Date().toISOString(),
      });
    },
    onSuccess: async (account) => {
      // カレンダーリストを取得して保存
      await syncCalendarListMutation.mutateAsync(account.id);
      queryClient.invalidateQueries({ queryKey: ['google-accounts'] });
    },
  });

  // カレンダーリストを同期
  const syncCalendarListMutation = useMutation({
    mutationFn: async (accountId) => {
      const accessToken = await getValidAccessToken(accountId);
      const calendars = await googleCalendarService.getCalendarList(accessToken);

      // 既存のカレンダーを取得
      const existingCalendars = await base44.entities.GoogleCalendar.list();
      const existingForAccount = existingCalendars.filter(
        cal => cal.google_account_id === accountId
      );

      // カレンダーを保存または更新
      for (const calendar of calendars) {
        const existing = existingForAccount.find(
          cal => cal.calendar_id === calendar.calendar_id
        );

        if (existing) {
          await base44.entities.GoogleCalendar.update(existing.id, {
            ...calendar,
            google_account_id: accountId,
            color: existing.color || calendar.background_color,
          });
        } else {
          await base44.entities.GoogleCalendar.create({
            ...calendar,
            google_account_id: accountId,
            color: calendar.background_color,
            is_visible: true,
            sync_enabled: true,
            display_order: existingCalendars.length,
          });
        }
      }

      return calendars;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
    },
  });

  // Googleアカウントを削除
  const removeGoogleAccountMutation = useMutation({
    mutationFn: async (accountId) => {
      const account = googleAccounts.find(acc => acc.id === accountId);
      if (account) {
        // トークンを無効化
        try {
          await googleCalendarService.revokeToken(account.access_token);
        } catch (error) {
          console.error('トークン無効化エラー:', error);
        }

        // 関連するカレンダーを削除
        const relatedCalendars = googleCalendars.filter(
          cal => cal.google_account_id === accountId
        );
        for (const calendar of relatedCalendars) {
          await base44.entities.GoogleCalendar.delete(calendar.id);
        }

        // アカウントを削除
        await base44.entities.GoogleAccount.delete(accountId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
    },
  });

  // カレンダーの表示/非表示を切り替え
  const toggleCalendarVisibilityMutation = useMutation({
    mutationFn: async ({ calendarId, isVisible }) => {
      return await base44.entities.GoogleCalendar.update(calendarId, {
        is_visible: isVisible,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
    },
  });

  // カレンダーの色を変更
  const updateCalendarColorMutation = useMutation({
    mutationFn: async ({ calendarId, color }) => {
      return await base44.entities.GoogleCalendar.update(calendarId, {
        color: color,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
    },
  });

  // イベントを取得（複数カレンダー対応）
  const fetchEventsForDateRange = async (startDate, endDate) => {
    const allEvents = [];

    for (const calendar of visibleCalendars) {
      if (!calendar.sync_enabled) continue;

      try {
        const accessToken = await getValidAccessToken(calendar.google_account_id);
        const { events } = await googleCalendarService.getEvents(
          accessToken,
          calendar.calendar_id,
          startDate,
          endDate
        );

        // カレンダー情報を付与
        const eventsWithCalendar = events.map(event => ({
          ...event,
          calendar_id: calendar.id,
          calendar_name: calendar.calendar_name,
          calendar_color: calendar.color,
          source: 'google',
        }));

        allEvents.push(...eventsWithCalendar);
      } catch (error) {
        console.error(`カレンダー ${calendar.calendar_name} のイベント取得エラー:`, error);
      }
    }

    return allEvents;
  };

  // タスクからイベントを作成
  const createEventFromTaskMutation = useMutation({
    mutationFn: async ({ task, calendarId }) => {
      const calendar = googleCalendars.find(cal => cal.id === calendarId);
      if (!calendar) {
        throw new Error('カレンダーが見つかりません');
      }

      const accessToken = await getValidAccessToken(calendar.google_account_id);

      const eventData = {
        title: task.title,
        description: task.description || '',
        start: task.due_date,
        end: task.due_date,
        all_day: true,
      };

      return await googleCalendarService.createEvent(
        accessToken,
        calendar.calendar_id,
        eventData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-events'] });
    },
  });

  return {
    // データ
    googleAccounts,
    googleCalendars,
    visibleCalendars,

    // ローディング状態
    isLoadingAccounts,
    isLoadingCalendars,
    isLoading: isLoadingAccounts || isLoadingCalendars,

    // エラー
    accountsError,
    calendarsError,

    // ミューテーション
    addGoogleAccount: addGoogleAccountMutation.mutate,
    addGoogleAccountAsync: addGoogleAccountMutation.mutateAsync,
    removeGoogleAccount: removeGoogleAccountMutation.mutate,
    syncCalendarList: syncCalendarListMutation.mutate,
    toggleCalendarVisibility: toggleCalendarVisibilityMutation.mutate,
    updateCalendarColor: updateCalendarColorMutation.mutate,
    createEventFromTask: createEventFromTaskMutation.mutate,

    // ユーティリティ
    fetchEventsForDateRange,
    getValidAccessToken,
  };
}
