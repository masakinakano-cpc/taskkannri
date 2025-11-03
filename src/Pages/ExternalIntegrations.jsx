import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Settings, Mail, MessageSquare, Send } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Dialog } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import ExternalSyncService from '../services/external/externalSyncService';

const ExternalIntegrations = () => {
  const [connections, setConnections] = useState([]);
  const [syncRules, setSyncRules] = useState([]);
  const [externalMessages, setExternalMessages] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const syncService = new ExternalSyncService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setConnections(syncService.getConnections());
    setSyncRules(syncService.getSyncRules());
    setExternalMessages(syncService.getExternalMessages());
  };

  const handleAddConnection = (connectionData) => {
    syncService.addConnection(connectionData);
    loadData();
    setShowAddDialog(false);
  };

  const handleDeleteConnection = (connectionId) => {
    if (confirm('この接続を削除してもよろしいですか?')) {
      syncService.deleteConnection(connectionId);
      loadData();
    }
  };

  const handleSyncMessages = async (connectionId) => {
    setSyncing(true);
    try {
      await syncService.syncMessages(connectionId);
      loadData();
      alert('メッセージの同期が完了しました');
    } catch (error) {
      console.error('Sync failed:', error);
      alert(`同期に失敗しました: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleActive = (connectionId) => {
    const connection = connections.find(c => c.id === connectionId);
    syncService.updateConnection(connectionId, {
      is_active: !connection.is_active,
    });
    loadData();
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'chatwork':
        return <MessageSquare className="w-5 h-5" />;
      case 'google_chat':
        return <Send className="w-5 h-5" />;
      case 'gmail':
        return <Mail className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getServiceLabel = (serviceType) => {
    switch (serviceType) {
      case 'chatwork':
        return 'Chatwork';
      case 'google_chat':
        return 'Google Chat';
      case 'gmail':
        return 'Gmail';
      default:
        return serviceType;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">外部サービス連携</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新規連携を追加
        </Button>
      </div>

      {/* 接続一覧 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">接続済みサービス</h2>
        {connections.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-500">まだサービスが連携されていません</p>
            <Button onClick={() => setShowAddDialog(true)} className="mt-4">
              最初の連携を追加
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection) => (
              <Card key={connection.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(connection.service_type)}
                    <div>
                      <h3 className="font-semibold">{connection.service_name}</h3>
                      <p className="text-sm text-slate-500">
                        {getServiceLabel(connection.service_type)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={connection.is_active ? 'success' : 'secondary'}>
                    {connection.is_active ? '有効' : '無効'}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-slate-600">{connection.account_email}</p>
                  {connection.last_sync_at && (
                    <p className="text-xs text-slate-500">
                      最終同期: {new Date(connection.last_sync_at).toLocaleString('ja-JP')}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSyncMessages(connection.id)}
                    disabled={syncing || !connection.is_active}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                    同期
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedConnection(connection);
                      setShowRuleDialog(true);
                    }}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    ルール
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(connection.id)}
                  >
                    {connection.is_active ? '無効化' : '有効化'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteConnection(connection.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 同期ルール */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">同期ルール</h2>
        {syncRules.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-500">同期ルールが設定されていません</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {syncRules.map((rule) => {
              const connection = connections.find(c => c.id === rule.connection_id);
              return (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{rule.rule_name}</h3>
                        <Badge variant={rule.is_active ? 'success' : 'secondary'}>
                          {rule.is_active ? '有効' : '無効'}
                        </Badge>
                        {rule.auto_create_task && (
                          <Badge variant="info">自動タスク化</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        サービス: {connection?.service_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-600">
                        フィルター: {rule.filter_type} - {rule.filter_value || 'すべて'}
                      </p>
                      <p className="text-sm text-slate-600">
                        優先度: {rule.default_priority}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('このルールを削除してもよろしいですか?')) {
                          syncService.deleteSyncRule(rule.id);
                          loadData();
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 取得済みメッセージ */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">取得済みメッセージ</h2>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              総メッセージ数: {externalMessages.length}
            </p>
            <p className="text-sm text-slate-600">
              タスク化済み:{' '}
              {externalMessages.filter(m => m.is_converted_to_task).length}
            </p>
            <p className="text-sm text-slate-600">
              未処理:{' '}
              {externalMessages.filter(m => !m.is_converted_to_task).length}
            </p>
          </div>
        </Card>
      </div>

      {/* 接続追加ダイアログ */}
      <AddConnectionDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddConnection}
      />

      {/* ルール追加ダイアログ */}
      <AddRuleDialog
        open={showRuleDialog}
        onClose={() => {
          setShowRuleDialog(false);
          setSelectedConnection(null);
        }}
        connection={selectedConnection}
        onAdd={(ruleData) => {
          syncService.addSyncRule(ruleData);
          loadData();
          setShowRuleDialog(false);
        }}
      />
    </div>
  );
};

// 接続追加ダイアログ
const AddConnectionDialog = ({ open, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    service_type: 'chatwork',
    service_name: '',
    account_email: '',
    api_token: '',
    is_active: true,
    auto_sync_enabled: false,
    sync_interval_minutes: 15,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      service_type: 'chatwork',
      service_name: '',
      account_email: '',
      api_token: '',
      is_active: true,
      auto_sync_enabled: false,
      sync_interval_minutes: 15,
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} title="新規連携を追加">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>サービスタイプ</Label>
          <select
            className="w-full border rounded-md p-2"
            value={formData.service_type}
            onChange={(e) =>
              setFormData({ ...formData, service_type: e.target.value })
            }
          >
            <option value="chatwork">Chatwork</option>
            <option value="google_chat">Google Chat</option>
            <option value="gmail">Gmail</option>
          </select>
        </div>

        <div>
          <Label>サービス名</Label>
          <Input
            value={formData.service_name}
            onChange={(e) =>
              setFormData({ ...formData, service_name: e.target.value })
            }
            placeholder="例: 仕事用Chatwork"
            required
          />
        </div>

        <div>
          <Label>アカウントメールアドレス</Label>
          <Input
            type="email"
            value={formData.account_email}
            onChange={(e) =>
              setFormData({ ...formData, account_email: e.target.value })
            }
            placeholder="example@example.com"
            required
          />
        </div>

        <div>
          <Label>APIトークン</Label>
          <Input
            type="password"
            value={formData.api_token}
            onChange={(e) =>
              setFormData({ ...formData, api_token: e.target.value })
            }
            placeholder="APIトークンを入力"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto_sync"
            checked={formData.auto_sync_enabled}
            onChange={(e) =>
              setFormData({ ...formData, auto_sync_enabled: e.target.checked })
            }
          />
          <Label htmlFor="auto_sync">自動同期を有効化</Label>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit">追加</Button>
        </div>
      </form>
    </Dialog>
  );
};

// ルール追加ダイアログ
const AddRuleDialog = ({ open, onClose, connection, onAdd }) => {
  const [formData, setFormData] = useState({
    rule_name: '',
    filter_type: 'all',
    filter_value: '',
    default_priority: 'medium',
    default_assignee: '',
    auto_create_task: false,
    is_active: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      connection_id: connection?.id,
    });
    setFormData({
      rule_name: '',
      filter_type: 'all',
      filter_value: '',
      default_priority: 'medium',
      default_assignee: '',
      auto_create_task: false,
      is_active: true,
    });
  };

  if (!open || !connection) return null;

  return (
    <Dialog open={open} onClose={onClose} title="同期ルールを追加">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>ルール名</Label>
          <Input
            value={formData.rule_name}
            onChange={(e) =>
              setFormData({ ...formData, rule_name: e.target.value })
            }
            placeholder="例: 重要なメッセージ"
            required
          />
        </div>

        <div>
          <Label>フィルタータイプ</Label>
          <select
            className="w-full border rounded-md p-2"
            value={formData.filter_type}
            onChange={(e) =>
              setFormData({ ...formData, filter_type: e.target.value })
            }
          >
            <option value="all">すべて</option>
            <option value="keyword">キーワード</option>
            <option value="sender">送信者</option>
            <option value="label">ラベル</option>
            <option value="room">ルーム</option>
          </select>
        </div>

        {formData.filter_type !== 'all' && (
          <div>
            <Label>フィルター値</Label>
            <Input
              value={formData.filter_value}
              onChange={(e) =>
                setFormData({ ...formData, filter_value: e.target.value })
              }
              placeholder="カンマ区切りで複数指定可能"
            />
          </div>
        )}

        <div>
          <Label>デフォルト優先度</Label>
          <select
            className="w-full border rounded-md p-2"
            value={formData.default_priority}
            onChange={(e) =>
              setFormData({ ...formData, default_priority: e.target.value })
            }
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <div>
          <Label>デフォルト担当者</Label>
          <Input
            value={formData.default_assignee}
            onChange={(e) =>
              setFormData({ ...formData, default_assignee: e.target.value })
            }
            placeholder="担当者名"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto_create"
            checked={formData.auto_create_task}
            onChange={(e) =>
              setFormData({ ...formData, auto_create_task: e.target.checked })
            }
          />
          <Label htmlFor="auto_create">自動的にタスク化</Label>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit">追加</Button>
        </div>
      </form>
    </Dialog>
  );
};

export default ExternalIntegrations;
