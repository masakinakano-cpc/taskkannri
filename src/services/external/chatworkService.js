/**
 * Chatwork API Service
 * Chatwork APIを使用してメッセージを取得し、タスクに変換する
 */

const CHATWORK_API_BASE = 'https://api.chatwork.com/v2';

export class ChatworkService {
  constructor(apiToken) {
    this.apiToken = apiToken;
  }

  /**
   * APIリクエストのヘッダーを取得
   */
  getHeaders() {
    return {
      'X-ChatWorkToken': this.apiToken,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 自分の情報を取得
   */
  async getMe() {
    try {
      const response = await fetch(`${CHATWORK_API_BASE}/me`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Chatwork API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Chatwork user info:', error);
      throw error;
    }
  }

  /**
   * ルーム一覧を取得
   */
  async getRooms() {
    try {
      const response = await fetch(`${CHATWORK_API_BASE}/rooms`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Chatwork API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Chatwork rooms:', error);
      throw error;
    }
  }

  /**
   * 特定のルームのメッセージを取得
   * @param {string} roomId - ルームID
   * @param {boolean} force - 未読メッセージのみ取得するか（false: すべて取得）
   */
  async getMessages(roomId, force = false) {
    try {
      const url = new URL(`${CHATWORK_API_BASE}/rooms/${roomId}/messages`);
      if (force) {
        url.searchParams.append('force', '1');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Chatwork API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to get Chatwork messages from room ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * 複数のルームからメッセージを取得
   * @param {string[]} roomIds - ルームIDの配列
   */
  async getMessagesFromRooms(roomIds) {
    const results = [];

    for (const roomId of roomIds) {
      try {
        const messages = await this.getMessages(roomId);
        const rooms = await this.getRooms();
        const room = rooms.find(r => r.room_id === parseInt(roomId));

        results.push({
          roomId,
          roomName: room?.name || 'Unknown Room',
          messages,
        });
      } catch (error) {
        console.error(`Failed to fetch messages from room ${roomId}:`, error);
      }
    }

    return results;
  }

  /**
   * Chatworkメッセージをタスクデータに変換
   * @param {object} message - Chatworkのメッセージオブジェクト
   * @param {string} roomName - ルーム名
   * @param {string} defaultPriority - デフォルト優先度
   */
  static convertMessageToTask(message, roomName, defaultPriority = 'medium') {
    const taskTitle = message.body.split('\n')[0].substring(0, 100); // 最初の行をタイトルに
    const taskDescription = `[Chatwork] ${roomName}\n送信者: ${message.account.name}\n\n${message.body}`;

    return {
      id: `chatwork_${message.message_id}`,
      title: taskTitle,
      description: taskDescription,
      status: 'pending',
      priority: defaultPriority,
      assignee: 'Chatworkから自動作成',
      due_date: null, // メッセージから期限を抽出する場合は別途実装
      created_at: new Date(message.send_time * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      external_source: {
        type: 'chatwork',
        messageId: message.message_id,
        roomName: roomName,
        senderName: message.account.name,
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
      const body = message.body.toLowerCase();
      return keywords.some(keyword => body.includes(keyword.toLowerCase()));
    });
  }
}

export default ChatworkService;
