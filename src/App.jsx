import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ページコンポーネント
import Dashboard from '@/Pages/Dashboard';
import KanbanBoard from '@/Pages/KanbanBoard';
import CalendarView from '@/Pages/CalendarView';
import TimelineView from '@/Pages/TimelineView';
import Templates from '@/Pages/Templates';
import CalendarSettings from '@/Pages/CalendarSettings';
import OAuthCallback from '@/Pages/OAuthCallback';
import ExternalIntegrations from '@/Pages/ExternalIntegrations';
import MessagePreview from '@/Pages/MessagePreview';

// レイアウト
import Layout from '@/Layout';

// QueryClientの作成
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* OAuth コールバック（レイアウトなし） */}
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* レイアウト付きページ */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <Layout currentPageName="ダッシュボード">
                <Dashboard />
              </Layout>
            }
          />

          <Route
            path="/kanban-board"
            element={
              <Layout currentPageName="カンバンボード">
                <KanbanBoard />
              </Layout>
            }
          />

          <Route
            path="/calendar-view"
            element={
              <Layout currentPageName="カレンダー">
                <CalendarView />
              </Layout>
            }
          />

          <Route
            path="/timeline-view"
            element={
              <Layout currentPageName="タイムライン">
                <TimelineView />
              </Layout>
            }
          />

          <Route
            path="/templates"
            element={
              <Layout currentPageName="テンプレート">
                <Templates />
              </Layout>
            }
          />

          <Route
            path="/calendar-settings"
            element={
              <Layout currentPageName="カレンダー設定">
                <CalendarSettings />
              </Layout>
            }
          />

          <Route
            path="/external-integrations"
            element={
              <Layout currentPageName="外部サービス連携">
                <ExternalIntegrations />
              </Layout>
            }
          />

          <Route
            path="/message-preview"
            element={
              <Layout currentPageName="メッセージプレビュー">
                <MessagePreview />
              </Layout>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
