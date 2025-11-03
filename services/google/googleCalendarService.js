/**
 * Google Calendar API サービスレイヤー
 * 複数アカウント対応のGoogle Calendar連携機能を提供
 */

// Google OAuth 2.0 設定（環境変数から取得することを推奨）
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/oauth/callback`;

// Google Calendar API のスコープ
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

class GoogleCalendarService {
  /**
   * OAuth認証URLを生成（複数アカウント対応）
   * @param {string} state - CSRF対策用のステート
   * @returns {string} 認証URL
   */
  getAuthUrl(state = '') {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: CALENDAR_SCOPES,
      access_type: 'offline',
      prompt: 'select_account consent', // 毎回アカウント選択画面を表示 & リフレッシュトークン取得
      state: state || this.generateState(),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * CSRF対策用のランダムなステート生成
   * @returns {string} ランダム文字列
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * 認証コードからアクセストークンを取得
   * @param {string} code - 認証コード
   * @returns {Promise<Object>} トークン情報
   */
  async getAccessToken(code) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`トークン取得エラー: ${error.error_description || error.error}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope,
    };
  }

  /**
   * リフレッシュトークンから新しいアクセストークンを取得
   * @param {string} refreshToken - リフレッシュトークン
   * @returns {Promise<Object>} 新しいトークン情報
   */
  async refreshAccessToken(refreshToken) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`トークンリフレッシュエラー: ${error.error_description || error.error}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  }

  /**
   * ユーザー情報を取得
   * @param {string} accessToken - アクセストークン
   * @returns {Promise<Object>} ユーザー情報
   */
  async getUserInfo(accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('ユーザー情報の取得に失敗しました');
    }

    const data = await response.json();

    return {
      google_user_id: data.id,
      email: data.email,
      display_name: data.name,
      profile_image: data.picture,
    };
  }

  /**
   * カレンダーリストを取得
   * @param {string} accessToken - アクセストークン
   * @returns {Promise<Array>} カレンダーリスト
   */
  async getCalendarList(accessToken) {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('カレンダーリストの取得に失敗しました');
    }

    const data = await response.json();

    return data.items.map(cal => ({
      calendar_id: cal.id,
      calendar_name: cal.summary,
      description: cal.description || '',
      time_zone: cal.timeZone,
      background_color: cal.backgroundColor,
      foreground_color: cal.foregroundColor,
      is_primary: cal.primary || false,
      access_role: cal.accessRole,
    }));
  }

  /**
   * 指定期間のイベントを取得
   * @param {string} accessToken - アクセストークン
   * @param {string} calendarId - カレンダーID
   * @param {Date} timeMin - 開始日時
   * @param {Date} timeMax - 終了日時
   * @param {string} syncToken - 増分同期用トークン（オプション）
   * @returns {Promise<Object>} イベントリストと次回同期トークン
   */
  async getEvents(accessToken, calendarId, timeMin, timeMax, syncToken = null) {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });

    if (syncToken) {
      params.set('syncToken', syncToken);
      params.delete('timeMin');
      params.delete('timeMax');
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('イベントの取得に失敗しました');
    }

    const data = await response.json();

    return {
      events: data.items.map(event => this.formatEvent(event)),
      nextSyncToken: data.nextSyncToken,
    };
  }

  /**
   * イベントデータをフォーマット
   * @param {Object} event - Googleカレンダーのイベントオブジェクト
   * @returns {Object} フォーマット済みイベント
   */
  formatEvent(event) {
    return {
      id: event.id,
      title: event.summary || '(タイトルなし)',
      description: event.description || '',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      all_day: !event.start.dateTime,
      location: event.location || '',
      status: event.status,
      creator: event.creator?.email,
      organizer: event.organizer?.email,
      attendees: event.attendees?.map(a => ({
        email: a.email,
        response_status: a.responseStatus,
      })) || [],
      html_link: event.htmlLink,
    };
  }

  /**
   * イベントを作成
   * @param {string} accessToken - アクセストークン
   * @param {string} calendarId - カレンダーID
   * @param {Object} eventData - イベントデータ
   * @returns {Promise<Object>} 作成されたイベント
   */
  async createEvent(accessToken, calendarId, eventData) {
    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: eventData.all_day
        ? { date: eventData.start.split('T')[0] }
        : { dateTime: eventData.start, timeZone: eventData.timeZone || 'Asia/Tokyo' },
      end: eventData.all_day
        ? { date: eventData.end.split('T')[0] }
        : { dateTime: eventData.end, timeZone: eventData.timeZone || 'Asia/Tokyo' },
      location: eventData.location || '',
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('イベントの作成に失敗しました');
    }

    return this.formatEvent(await response.json());
  }

  /**
   * イベントを更新
   * @param {string} accessToken - アクセストークン
   * @param {string} calendarId - カレンダーID
   * @param {string} eventId - イベントID
   * @param {Object} eventData - 更新するイベントデータ
   * @returns {Promise<Object>} 更新されたイベント
   */
  async updateEvent(accessToken, calendarId, eventId, eventData) {
    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: eventData.all_day
        ? { date: eventData.start.split('T')[0] }
        : { dateTime: eventData.start, timeZone: eventData.timeZone || 'Asia/Tokyo' },
      end: eventData.all_day
        ? { date: eventData.end.split('T')[0] }
        : { dateTime: eventData.end, timeZone: eventData.timeZone || 'Asia/Tokyo' },
      location: eventData.location || '',
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('イベントの更新に失敗しました');
    }

    return this.formatEvent(await response.json());
  }

  /**
   * イベントを削除
   * @param {string} accessToken - アクセストークン
   * @param {string} calendarId - カレンダーID
   * @param {string} eventId - イベントID
   * @returns {Promise<void>}
   */
  async deleteEvent(accessToken, calendarId, eventId) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('イベントの削除に失敗しました');
    }
  }

  /**
   * トークンを無効化（連携解除時）
   * @param {string} accessToken - アクセストークン
   * @returns {Promise<void>}
   */
  async revokeToken(accessToken) {
    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.ok) {
      throw new Error('トークンの無効化に失敗しました');
    }
  }
}

export default new GoogleCalendarService();
