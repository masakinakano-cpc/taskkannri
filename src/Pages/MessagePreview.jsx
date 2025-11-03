import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import ExternalSyncService from '../services/external/externalSyncService';
import { base44 } from '../api/base44Client';

const MessagePreview = () => {
  const [externalMessages, setExternalMessages] = useState([]);
  const [connections, setConnections] = useState([]);
  const [syncRules, setSyncRules] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [filterType, setFilterType] = useState('all');

  const syncService = new ExternalSyncService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setExternalMessages(syncService.getExternalMessages());
    setConnections(syncService.getConnections());
    setSyncRules(syncService.getSyncRules());
  };

  const filteredMessages = externalMessages.filter((msg) => {
    if (filterType === 'all') return true;
    if (filterType === 'converted') return msg.is_converted_to_task;
    if (filterType === 'unconverted') return !msg.is_converted_to_task;
    return true;
  });

  const handleToggleMessage = (messageId) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleConvertToTasks = async () => {
    const messagesToConvert = externalMessages.filter((msg) =>
      selectedMessages.has(msg.id)
    );

    if (messagesToConvert.length === 0) {
      alert('タスクに変換するメッセージを選択してください');
      return;
    }

    const tasks = syncService.convertMessagesToTasks(messagesToConvert, syncRules);

    // タスクをbase44に保存
    for (const task of tasks) {
      await base44.entities.Task.create(task);
    }

    // メッセージをタスク化済みとしてマーク
    const updatedMessages = externalMessages.map((msg) => {
      if (selectedMessages.has(msg.id)) {
        return {
          ...msg,
          is_converted_to_task: true,
          task_id: tasks.find(t => t.id.includes(msg.external_message_id))?.id,
        };
      }
      return msg;
    });

    syncService.saveExternalMessages(updatedMessages);

    alert(`${tasks.length}件のタスクを作成しました`);
    setSelectedMessages(new Set());
    loadData();
  };

  const getConnectionName = (connectionId) => {
    const connection = connections.find((c) => c.id === connectionId);
    return connection?.service_name || 'Unknown';
  };

  const getServiceLabel = (messageType) => {
    switch (messageType) {
      case 'chatwork':
        return 'Chatwork';
      case 'google_chat':
        return 'Google Chat';
      case 'gmail':
        return 'Gmail';
      default:
        return messageType;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">メッセージプレビュー</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleConvertToTasks}
            disabled={selectedMessages.size === 0}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            選択をタスクに変換 ({selectedMessages.size})
          </Button>
        </div>
      </div>

      {/* フィルター */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filterType === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilterType('all')}
          >
            すべて ({externalMessages.length})
          </Button>
          <Button
            size="sm"
            variant={filterType === 'unconverted' ? 'primary' : 'outline'}
            onClick={() => setFilterType('unconverted')}
          >
            未処理 (
            {externalMessages.filter((m) => !m.is_converted_to_task).length})
          </Button>
          <Button
            size="sm"
            variant={filterType === 'converted' ? 'primary' : 'outline'}
            onClick={() => setFilterType('converted')}
          >
            タスク化済み (
            {externalMessages.filter((m) => m.is_converted_to_task).length})
          </Button>
        </div>
      </Card>

      {/* メッセージ一覧 */}
      {filteredMessages.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-500">メッセージがありません</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`p-4 transition-all ${
                selectedMessages.has(message.id)
                  ? 'border-blue-500 bg-blue-50'
                  : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* チェックボックス */}
                {!message.is_converted_to_task && (
                  <input
                    type="checkbox"
                    checked={selectedMessages.has(message.id)}
                    onChange={() => handleToggleMessage(message.id)}
                    className="mt-1"
                  />
                )}

                {/* メッセージ内容 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{getServiceLabel(message.message_type)}</Badge>
                    {message.is_converted_to_task && (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        タスク化済み
                      </Badge>
                    )}
                    {message.room_name && (
                      <Badge variant="secondary">{message.room_name}</Badge>
                    )}
                  </div>

                  <h3 className="font-semibold mb-1">
                    {message.subject || message.body.split('\n')[0].substring(0, 100)}
                  </h3>

                  <p className="text-sm text-slate-600 mb-2">
                    送信者: {message.sender_name}
                    {message.sender_email && ` (${message.sender_email})`}
                  </p>

                  <p className="text-sm text-slate-700 mb-2 line-clamp-3">
                    {message.body}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      受信: {new Date(message.received_at).toLocaleString('ja-JP')}
                    </span>
                    <span>接続: {getConnectionName(message.connection_id)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagePreview;
