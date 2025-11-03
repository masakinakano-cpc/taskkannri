/**
 * モックBase44クライアント
 * 実際のBase44 BaaSの代わりにローカルストレージを使用
 */

class MockBase44 {
  constructor() {
    this.entities = {
      Task: this.createEntityHandler('tasks'),
      Template: this.createEntityHandler('templates'),
      GoogleAccount: this.createEntityHandler('googleAccounts'),
      GoogleCalendar: this.createEntityHandler('googleCalendars'),
    };
  }

  createEntityHandler(storageKey) {
    return {
      list: async (sortBy = '') => {
        const items = this.getFromStorage(storageKey);

        // ソート処理（簡易版）
        if (sortBy) {
          const isDesc = sortBy.startsWith('-');
          const field = isDesc ? sortBy.substring(1) : sortBy;

          items.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];

            if (aVal < bVal) return isDesc ? 1 : -1;
            if (aVal > bVal) return isDesc ? -1 : 1;
            return 0;
          });
        }

        return items;
      },

      get: async (id) => {
        const items = this.getFromStorage(storageKey);
        return items.find(item => item.id === id);
      },

      create: async (data) => {
        const items = this.getFromStorage(storageKey);
        const newItem = {
          id: this.generateId(),
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        items.push(newItem);
        this.saveToStorage(storageKey, items);
        return newItem;
      },

      update: async (id, data) => {
        const items = this.getFromStorage(storageKey);
        const index = items.findIndex(item => item.id === id);

        if (index === -1) {
          throw new Error(`Item with id ${id} not found`);
        }

        items[index] = {
          ...items[index],
          ...data,
          updated_at: new Date().toISOString(),
        };

        this.saveToStorage(storageKey, items);
        return items[index];
      },

      delete: async (id) => {
        const items = this.getFromStorage(storageKey);
        const filtered = items.filter(item => item.id !== id);
        this.saveToStorage(storageKey, filtered);
        return { success: true };
      },
    };
  }

  getFromStorage(key) {
    try {
      const data = localStorage.getItem(`base44_${key}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return [];
    }
  }

  saveToStorage(key, data) {
    try {
      localStorage.setItem(`base44_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to storage (${key}):`, error);
    }
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 初期データをロード
  loadInitialData() {
    // タスクの初期データ
    if (this.getFromStorage('tasks').length === 0) {
      const sampleTasks = [
        {
          title: '経費精算書の提出',
          description: '11月分の出張経費をまとめて提出',
          status: 'pending',
          priority: 'high',
          category: '経費申請',
          due_date: '2025-11-10',
          approver: '山田太郎',
          memo: '領収書はすべて添付済み',
          comments: [],
          attachments: [],
        },
        {
          title: '新規取引先との契約書確認',
          description: '法務部の確認を経て社長承認待ち',
          status: 'preparation',
          priority: 'urgent',
          category: '契約稟議',
          due_date: '2025-11-08',
          approver: '社長',
          memo: '重要案件',
          comments: [],
          attachments: [],
        },
        {
          title: '年末休暇申請',
          description: '12/28-1/5の休暇申請',
          status: 'approved',
          priority: 'medium',
          category: '休暇申請',
          due_date: '2025-11-15',
          approver: '鈴木花子',
          memo: '',
          comments: [],
          attachments: [],
        },
      ];

      sampleTasks.forEach(task => {
        this.entities.Task.create(task);
      });
    }
  }
}

// シングルトンインスタンスをエクスポート
export const base44 = new MockBase44();

// 初期データをロード
base44.loadInitialData();
