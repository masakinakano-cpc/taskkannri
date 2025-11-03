import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

/**
 * GoogleカレンダーOAuth認証のコールバックページ
 * 認証コードを受け取り、トークンを取得してアカウントを登録する
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addGoogleAccountAsync } = useGoogleCalendar();

  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('認証処理中...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URLパラメータから認証コードとステートを取得
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        // エラーチェック
        if (error) {
          throw new Error(`認証エラー: ${error}`);
        }

        if (!code) {
          throw new Error('認証コードが見つかりません');
        }

        // ステート検証（CSRF対策）
        const savedState = sessionStorage.getItem('google_oauth_state');
        if (savedState && state !== savedState) {
          throw new Error('セキュリティエラー: ステートが一致しません');
        }

        // ステートをクリア
        sessionStorage.removeItem('google_oauth_state');

        setMessage('アカウント情報を取得中...');

        // アカウントを追加（カスタムフックを使用）
        await addGoogleAccountAsync(code);

        setStatus('success');
        setMessage('Googleアカウントの連携が完了しました！');

        // 3秒後にカレンダー設定ページへリダイレクト
        setTimeout(() => {
          navigate('/calendar-settings');
        }, 3000);

      } catch (error) {
        console.error('OAuth認証エラー:', error);
        setStatus('error');
        setMessage(error.message || '認証に失敗しました。もう一度お試しください。');

        // 5秒後にカレンダー設定ページへリダイレクト
        setTimeout(() => {
          navigate('/calendar-settings');
        }, 5000);
      }
    };

    handleCallback();
  }, [searchParams, addGoogleAccountAsync, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* アイコン */}
          {status === 'processing' && (
            <div className="relative">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full animate-pulse" />
              </div>
            </div>
          )}
          {status === 'success' && (
            <div className="relative">
              <CheckCircle className="w-16 h-16 text-green-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full animate-ping opacity-25" />
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="relative">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
          )}

          {/* タイトル */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {status === 'processing' && 'Google認証処理中'}
              {status === 'success' && '連携成功！'}
              {status === 'error' && 'エラーが発生しました'}
            </h2>
            <p className="text-slate-600">{message}</p>
          </div>

          {/* プログレスバー（処理中のみ） */}
          {status === 'processing' && (
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse" style={{ width: '70%' }} />
            </div>
          )}

          {/* 追加情報 */}
          <div className="text-sm text-slate-500 mt-4">
            {status === 'success' && (
              <p>カレンダー設定ページへ自動的に移動します...</p>
            )}
            {status === 'error' && (
              <p>カレンダー設定ページへ戻ります...</p>
            )}
          </div>

          {/* 手動リンク */}
          {status !== 'processing' && (
            <button
              onClick={() => navigate('/calendar-settings')}
              className="text-blue-600 hover:text-blue-700 font-medium underline mt-4"
            >
              今すぐカレンダー設定へ移動
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
