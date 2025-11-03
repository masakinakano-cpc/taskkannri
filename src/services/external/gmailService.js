/**
 * Gmail API Service
 * Gmail APIを使用してメールを取得し、タスクに変換する
 */

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

export class GmailService {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  /**
   * APIリクエストのヘッダーを取得
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * メール一覧を取得
   * @param {string} userId - ユーザーID（通常は 'me'）
   * @param {object} options - クエリオプション
   */
  async listMessages(userId = 'me', options = {}) {
    try {
      const url = new URL(`${GMAIL_API_BASE}/users/${userId}/messages`);

      // クエリパラメータの設定
      if (options.maxResults) {
        url.searchParams.append('maxResults', options.maxResults.toString());
      }
      if (options.q) {
        url.searchParams.append('q', options.q);
      }
      if (options.labelIds) {
        options.labelIds.forEach(labelId => {
          url.searchParams.append('labelIds', labelId);
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Gmail API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Failed to list Gmail messages:', error);
      throw error;
    }
  }

  /**
   * メールの詳細を取得
   * @param {string} messageId - メッセージID
   * @param {string} userId - ユーザーID（通常は 'me'）
   */
  async getMessage(messageId, userId = 'me') {
    try {
      const response = await fetch(
        `${GMAIL_API_BASE}/users/${userId}/messages/${messageId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Gmail API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to get Gmail message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * ラベル一覧を取得
   * @param {string} userId - ユーザーID（通常は 'me'）
   */
  async listLabels(userId = 'me') {
    try {
      const response = await fetch(
        `${GMAIL_API_BASE}/users/${userId}/labels`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Gmail API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.labels || [];
    } catch (error) {
      console.error('Failed to list Gmail labels:', error);
      throw error;
    }
  }

  /**
   * メールの詳細情報を複数取得
   * @param {string[]} messageIds - メッセージIDの配列
   * @param {string} userId - ユーザーID
   */
  async getMessagesDetails(messageIds, userId = 'me') {
    const messages = [];

    for (const messageId of messageIds) {
      try {
        const message = await this.getMessage(messageId, userId);
        messages.push(message);
      } catch (error) {
        console.error(`Failed to fetch message ${messageId}:`, error);
      }
    }

    return messages;
  }

  /**
   * メールヘッダーから特定の値を取得
   * @param {object} message - Gmailメッセージオブジェクト
   * @param {string} headerName - ヘッダー名
   */
  static getHeader(message, headerName) {
    const headers = message.payload?.headers || [];
    const header = headers.find(h => h.name.toLowerCase() === headerName.toLowerCase());
    return header ? header.value : '';
  }

  /**
   * メール本文を取得
   * @param {object} message - Gmailメッセージオブジェクト
   */
  static getBody(message) {
    const payload = message.payload;

    // シンプルなメール（テキストのみ）
    if (payload.body?.data) {
      return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }

    // マルチパートメール
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }

      // text/plainが見つからない場合はtext/htmlを使用
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }
    }

    return '';
  }

  /**
   * Gmailメッセージをタスクデータに変換
   * @param {object} message - Gmailのメッセージオブジェクト
   * @param {string} defaultPriority - デフォルト優先度
   */
  static convertMessageToTask(message, defaultPriority = 'medium') {
    const subject = this.getHeader(message, 'Subject');
    const from = this.getHeader(message, 'From');
    const date = this.getHeader(message, 'Date');
    const body = this.getBody(message);

    // 件名をタイトルに
    const taskTitle = subject || 'Gmailメッセージ';

    // 本文の最初の500文字を説明に
    const bodyPreview = body.substring(0, 500);
    const taskDescription = `[Gmail] ${from}\n日時: ${date}\n\n件名: ${subject}\n\n${bodyPreview}${body.length > 500 ? '...' : ''}`;

    // ラベルから優先度を判定
    const labelIds = message.labelIds || [];
    let priority = defaultPriority;
    if (labelIds.includes('IMPORTANT') || labelIds.includes('STARRED')) {
      priority = 'high';
    }

    return {
      id: `gmail_${message.id}`,
      title: taskTitle,
      description: taskDescription,
      status: 'pending',
      priority: priority,
      assignee: 'Gmailから自動作成',
      due_date: null,
      created_at: new Date(parseInt(message.internalDate)).toISOString(),
      updated_at: new Date().toISOString(),
      external_source: {
        type: 'gmail',
        messageId: message.id,
        subject: subject,
        from: from,
        labels: labelIds,
      },
    };
  }

  /**
   * キーワードでメッセージをフィルタリング
   * @param {object[]} messages - メッセージ配列
   * @param {string[]} keywords - 検索キーワード配列
   */
  static filterMessagesByKeywords(messages, keywords) {
    if (!keywords || keywords.length === 0) {
      return messages;
    }

    return messages.filter(message => {
      const subject = this.getHeader(message, 'Subject').toLowerCase();
      const body = this.getBody(message).toLowerCase();

      return keywords.some(keyword =>
        subject.includes(keyword.toLowerCase()) ||
        body.includes(keyword.toLowerCase())
      );
    });
  }

  /**
   * 送信者でメッセージをフィルタリング
   * @param {object[]} messages - メッセージ配列
   * @param {string[]} senderEmails - 送信者メールアドレス配列
   */
  static filterMessagesBySender(messages, senderEmails) {
    if (!senderEmails || senderEmails.length === 0) {
      return messages;
    }

    return messages.filter(message => {
      const from = this.getHeader(message, 'From').toLowerCase();
      return senderEmails.some(email => from.includes(email.toLowerCase()));
    });
  }

  /**
   * ラベルでメッセージをフィルタリング
   * @param {object[]} messages - メッセージ配列
   * @param {string[]} labelIds - ラベルID配列
   */
  static filterMessagesByLabels(messages, labelIds) {
    if (!labelIds || labelIds.length === 0) {
      return messages;
    }

    return messages.filter(message => {
      const messageLabelIds = message.labelIds || [];
      return labelIds.some(labelId => messageLabelIds.includes(labelId));
    });
  }
}

export default GmailService;
