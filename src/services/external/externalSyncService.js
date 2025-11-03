/**
 * External Sync Service
 * 外部サービス（Chatwork、Google Chat、Gmail）からのメッセージ取得とタスク変換を統合管理
 */

import ChatworkService from './chatworkService';
import GoogleChatService from './googleChatService';
import GmailService from './gmailService';

export class ExternalSyncService {
  constructor() {
    this.storageKey = 'external_sync_data';
  }

  /**
   * LocalStorageから外部サービス接続情報を取得
   */
  getConnections() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.connections || [];
  }

  /**
   * LocalStorageに外部サービス接続情報を保存
   */
  saveConnections(connections) {
    const data = { connections };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  /**
   * 新しい接続を追加
   */
  addConnection(connectionData) {
    const connections = this.getConnections();
    const newConnection = {
      id: `conn_${Date.now()}`,
      ...connectionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_sync_at: null,
    };
    connections.push(newConnection);
    this.saveConnections(connections);
    return newConnection;
  }

  /**
   * 接続を更新
   */
  updateConnection(connectionId, updates) {
    const connections = this.getConnections();
    const index = connections.findIndex(c => c.id === connectionId);
    if (index === -1) throw new Error('Connection not found');

    connections[index] = {
      ...connections[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.saveConnections(connections);
    return connections[index];
  }

  /**
   * 接続を削除
   */
  deleteConnection(connectionId) {
    const connections = this.getConnections();
    const filtered = connections.filter(c => c.id !== connectionId);
    this.saveConnections(filtered);
  }

  /**
   * 同期ルールを取得
   */
  getSyncRules() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.syncRules || [];
  }

  /**
   * 同期ルールを保存
   */
  saveSyncRules(rules) {
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    data.syncRules = rules;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  /**
   * 同期ルールを追加
   */
  addSyncRule(ruleData) {
    const rules = this.getSyncRules();
    const newRule = {
      id: `rule_${Date.now()}`,
      ...ruleData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    rules.push(newRule);
    this.saveSyncRules(rules);
    return newRule;
  }

  /**
   * 同期ルールを更新
   */
  updateSyncRule(ruleId, updates) {
    const rules = this.getSyncRules();
    const index = rules.findIndex(r => r.id === ruleId);
    if (index === -1) throw new Error('Rule not found');

    rules[index] = {
      ...rules[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.saveSyncRules(rules);
    return rules[index];
  }

  /**
   * 同期ルールを削除
   */
  deleteSyncRule(ruleId) {
    const rules = this.getSyncRules();
    const filtered = rules.filter(r => r.id !== ruleId);
    this.saveSyncRules(filtered);
  }

  /**
   * 外部メッセージを取得
   */
  getExternalMessages() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.externalMessages || [];
  }

  /**
   * 外部メッセージを保存
   */
  saveExternalMessages(messages) {
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    data.externalMessages = messages;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  /**
   * 特定の接続からメッセージを同期
   */
  async syncMessages(connectionId) {
    const connection = this.getConnections().find(c => c.id === connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (!connection.is_active) {
      throw new Error('Connection is not active');
    }

    let messages = [];

    try {
      switch (connection.service_type) {
        case 'chatwork':
          messages = await this.syncChatworkMessages(connection);
          break;
        case 'google_chat':
          messages = await this.syncGoogleChatMessages(connection);
          break;
        case 'gmail':
          messages = await this.syncGmailMessages(connection);
          break;
        default:
          throw new Error(`Unsupported service type: ${connection.service_type}`);
      }

      // 最終同期日時を更新
      this.updateConnection(connectionId, {
        last_sync_at: new Date().toISOString(),
      });

      return messages;
    } catch (error) {
      console.error(`Failed to sync messages for connection ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * Chatworkメッセージを同期
   */
  async syncChatworkMessages(connection) {
    const service = new ChatworkService(connection.api_token);
    const rooms = await service.getRooms();

    const allMessages = [];
    for (const room of rooms.slice(0, 5)) {
      // 最大5ルームまで
      try {
        const messages = await service.getMessages(room.room_id);
        messages.forEach(msg => {
          allMessages.push({
            id: `msg_chatwork_${msg.message_id}`,
            connection_id: connection.id,
            external_message_id: msg.message_id.toString(),
            message_type: 'chatwork',
            sender_name: msg.account.name,
            sender_email: null,
            subject: null,
            body: msg.body,
            room_id: room.room_id.toString(),
            room_name: room.name,
            labels: [],
            is_converted_to_task: false,
            task_id: null,
            received_at: new Date(msg.send_time * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      } catch (error) {
        console.error(`Failed to sync messages from room ${room.room_id}:`, error);
      }
    }

    // 既存メッセージと統合
    const existingMessages = this.getExternalMessages();
    const newMessages = allMessages.filter(
      msg => !existingMessages.some(em => em.external_message_id === msg.external_message_id)
    );

    if (newMessages.length > 0) {
      this.saveExternalMessages([...existingMessages, ...newMessages]);
    }

    return newMessages;
  }

  /**
   * Google Chatメッセージを同期
   */
  async syncGoogleChatMessages(connection) {
    const service = new GoogleChatService(connection.api_token);
    const spaces = await service.getSpaces();

    const allMessages = [];
    for (const space of spaces.slice(0, 5)) {
      // 最大5スペースまで
      try {
        const messages = await service.getMessages(space.name);
        messages.forEach(msg => {
          const messageId = msg.name?.split('/').pop() || Date.now().toString();
          allMessages.push({
            id: `msg_gchat_${messageId}`,
            connection_id: connection.id,
            external_message_id: messageId,
            message_type: 'google_chat',
            sender_name: msg.sender?.displayName || 'Unknown',
            sender_email: msg.sender?.email || null,
            subject: null,
            body: msg.text || msg.argumentText || '',
            room_id: space.name,
            room_name: space.displayName,
            labels: [],
            is_converted_to_task: false,
            task_id: null,
            received_at: msg.createTime || new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      } catch (error) {
        console.error(`Failed to sync messages from space ${space.name}:`, error);
      }
    }

    // 既存メッセージと統合
    const existingMessages = this.getExternalMessages();
    const newMessages = allMessages.filter(
      msg => !existingMessages.some(em => em.external_message_id === msg.external_message_id)
    );

    if (newMessages.length > 0) {
      this.saveExternalMessages([...existingMessages, ...newMessages]);
    }

    return newMessages;
  }

  /**
   * Gmailメッセージを同期
   */
  async syncGmailMessages(connection) {
    const service = new GmailService(connection.api_token);

    // 未読メッセージを取得
    const messageList = await service.listMessages('me', {
      maxResults: 20,
      labelIds: ['INBOX', 'UNREAD'],
    });

    const messageIds = messageList.map(m => m.id);
    const messages = await service.getMessagesDetails(messageIds);

    const allMessages = messages.map(msg => {
      const subject = GmailService.getHeader(msg, 'Subject');
      const from = GmailService.getHeader(msg, 'From');
      const body = GmailService.getBody(msg);

      return {
        id: `msg_gmail_${msg.id}`,
        connection_id: connection.id,
        external_message_id: msg.id,
        message_type: 'gmail',
        sender_name: from.split('<')[0].trim(),
        sender_email: from.match(/<(.+)>/)?.[1] || from,
        subject: subject,
        body: body.substring(0, 1000),
        room_id: null,
        room_name: null,
        labels: msg.labelIds || [],
        is_converted_to_task: false,
        task_id: null,
        received_at: new Date(parseInt(msg.internalDate)).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // 既存メッセージと統合
    const existingMessages = this.getExternalMessages();
    const newMessages = allMessages.filter(
      msg => !existingMessages.some(em => em.external_message_id === msg.external_message_id)
    );

    if (newMessages.length > 0) {
      this.saveExternalMessages([...existingMessages, ...newMessages]);
    }

    return newMessages;
  }

  /**
   * ルールに基づいてメッセージをタスクに変換
   */
  convertMessagesToTasks(messages, rules) {
    const tasks = [];

    for (const message of messages) {
      // 既にタスクに変換済みの場合はスキップ
      if (message.is_converted_to_task) continue;

      // この接続に関連するルールを取得
      const applicableRules = rules.filter(
        r => r.connection_id === message.connection_id && r.is_active
      );

      for (const rule of applicableRules) {
        if (this.messageMatchesRule(message, rule)) {
          const task = this.createTaskFromMessage(message, rule);
          tasks.push(task);

          // メッセージを変換済みとしてマーク
          message.is_converted_to_task = true;
          message.task_id = task.id;
          break; // 1つのルールにマッチしたら他のルールは適用しない
        }
      }
    }

    // メッセージの更新を保存
    this.saveExternalMessages(this.getExternalMessages());

    return tasks;
  }

  /**
   * メッセージがルールにマッチするかチェック
   */
  messageMatchesRule(message, rule) {
    switch (rule.filter_type) {
      case 'all':
        return true;

      case 'keyword':
        const keywords = rule.filter_value?.split(',').map(k => k.trim().toLowerCase()) || [];
        const text = `${message.subject || ''} ${message.body}`.toLowerCase();
        return keywords.some(keyword => text.includes(keyword));

      case 'sender':
        const senders = rule.filter_value?.split(',').map(s => s.trim().toLowerCase()) || [];
        return senders.some(sender =>
          message.sender_name?.toLowerCase().includes(sender) ||
          message.sender_email?.toLowerCase().includes(sender)
        );

      case 'label':
        const labels = rule.filter_value?.split(',').map(l => l.trim()) || [];
        return labels.some(label => message.labels?.includes(label));

      case 'room':
        return message.room_id === rule.filter_value;

      default:
        return false;
    }
  }

  /**
   * メッセージからタスクを作成
   */
  createTaskFromMessage(message, rule) {
    const taskTitle =
      message.subject ||
      message.body.split('\n')[0].substring(0, 100) ||
      `${message.message_type}メッセージ`;

    const taskDescription = `[${message.message_type.toUpperCase()}] ${message.room_name || ''}\n送信者: ${message.sender_name}\n\n${message.body.substring(0, 500)}`;

    return {
      id: `task_${message.message_type}_${message.external_message_id}`,
      title: taskTitle,
      description: taskDescription,
      status: 'pending',
      priority: rule.default_priority || 'medium',
      assignee: rule.default_assignee || `${message.message_type}から自動作成`,
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      external_source: {
        type: message.message_type,
        messageId: message.external_message_id,
        connectionId: message.connection_id,
      },
    };
  }
}

export default ExternalSyncService;
