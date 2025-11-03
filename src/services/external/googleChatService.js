/**
 * Google Chat API Service
 * Google Chat APIを使用してメッセージを取得し、タスクに変換する
 */

const GOOGLE_CHAT_API_BASE = 'https://chat.googleapis.com/v1';

export class GoogleChatService {
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
   * スペース（チャットルーム）一覧を取得
   */
  async getSpaces() {
    try {
      const response = await fetch(`${GOOGLE_CHAT_API_BASE}/spaces`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Google Chat API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.spaces || [];
    } catch (error) {
      console.error('Failed to get Google Chat spaces:', error);
      throw error;
    }
  }

  /**
   * 特定のスペースのメッセージを取得
   * @param {string} spaceName - スペース名 (例: "spaces/AAAA")
   * @param {number} pageSize - 取得するメッセージ数（デフォルト: 50）
   */
  async getMessages(spaceName, pageSize = 50) {
    try {
      const url = new URL(`${GOOGLE_CHAT_API_BASE}/${spaceName}/messages`);
      url.searchParams.append('pageSize', pageSize.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Google Chat API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error(`Failed to get Google Chat messages from space ${spaceName}:`, error);
      throw error;
    }
  }

  /**
   * 複数のスペースからメッセージを取得
   * @param {string[]} spaceNames - スペース名の配列
   */
  async getMessagesFromSpaces(spaceNames) {
    const results = [];

    for (const spaceName of spaceNames) {
      try {
        const messages = await this.getMessages(spaceName);
        const spaces = await this.getSpaces();
        const space = spaces.find(s => s.name === spaceName);

        results.push({
          spaceName,
          displayName: space?.displayName || 'Unknown Space',
          messages,
        });
      } catch (error) {
        console.error(`Failed to fetch messages from space ${spaceName}:`, error);
      }
    }

    return results;
  }

  /**
   * Google Chatメッセージをタスクデータに変換
   * @param {object} message - Google Chatのメッセージオブジェクト
   * @param {string} spaceName - スペース表示名
   * @param {string} defaultPriority - デフォルト優先度
   */
  static convertMessageToTask(message, spaceName, defaultPriority = 'medium') {
    const messageText = message.text || message.argumentText || '';
    const taskTitle = messageText.split('\n')[0].substring(0, 100); // 最初の行をタイトルに
    const senderName = message.sender?.displayName || 'Unknown';

    const taskDescription = `[Google Chat] ${spaceName}\n送信者: ${senderName}\n\n${messageText}`;

    return {
      id: `gchat_${message.name?.split('/').pop() || Date.now()}`,
      title: taskTitle || 'Google Chatメッセージ',
      description: taskDescription,
      status: 'pending',
      priority: defaultPriority,
      assignee: 'Google Chatから自動作成',
      due_date: null,
      created_at: message.createTime || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      external_source: {
        type: 'google_chat',
        messageId: message.name,
        spaceName: spaceName,
        senderName: senderName,
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
      const text = (message.text || message.argumentText || '').toLowerCase();
      return keywords.some(keyword => text.includes(keyword.toLowerCase()));
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
      const email = message.sender?.email || '';
      return senderEmails.some(senderEmail => email === senderEmail);
    });
  }
}

export default GoogleChatService;
