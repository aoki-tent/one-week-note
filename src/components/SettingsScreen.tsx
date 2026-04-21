import { useState } from 'react';
import type { Settings } from '../lib/memo';
import { AboutScreen } from './AboutScreen';

interface Props {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
  onClose: () => void;
  onResetTutorial: () => void;
}

export function SettingsScreen({
  settings,
  onUpdate,
  onClose,
  onResetTutorial,
}: Props) {
  const [view, setView] = useState<'settings' | 'about'>('settings');
  const [emailDraft, setEmailDraft] = useState(settings.email);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  if (view === 'about') {
    return <AboutScreen onBack={() => setView('settings')} />;
  }

  const commitEmail = () => {
    const trimmed = emailDraft.trim();
    if (trimmed !== settings.email) {
      onUpdate({ email: trimmed });
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      <header className="flex items-center h-12 px-3 border-b border-gray-200 shrink-0">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center text-gray-600 text-xl"
          onClick={onClose}
          aria-label="戻る"
        >
          ←
        </button>
        <h1 className="text-base font-medium text-gray-900 ml-1">設定</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        <section className="pt-6">
          <div className="px-4 text-xs text-gray-500 mb-2 uppercase tracking-wide">
            メール送信
          </div>
          <div className="bg-white border-y border-gray-200">
            <div className="flex items-center px-4 h-14 border-b border-gray-100 last:border-b-0">
              <label className="text-sm text-gray-600 w-28 shrink-0">
                送信先アドレス
              </label>
              <input
                type="email"
                inputMode="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                onBlur={commitEmail}
                className="flex-1 bg-transparent outline-none text-base text-gray-900 text-right"
                placeholder="you@example.com"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <div className="flex items-center px-4 h-14">
              <label
                htmlFor="quickSend"
                className="flex-1 text-sm text-gray-600"
              >
                確認なしで即送信
              </label>
              <button
                id="quickSend"
                type="button"
                role="switch"
                aria-checked={settings.quickSend}
                onClick={() => onUpdate({ quickSend: !settings.quickSend })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.quickSend ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.quickSend ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="px-4 pt-2 text-[11px] text-gray-400 leading-relaxed">
            MVPでは設定値のみ保存され、実動作は変わりません。
          </div>
        </section>

        <section className="pt-8">
          <div className="bg-white border-y border-gray-200">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 h-14 active:bg-gray-50"
              onClick={() => setView('about')}
            >
              <span className="text-base text-gray-900">このアプリについて</span>
              <span className="text-gray-300">›</span>
            </button>
          </div>
        </section>

        <section className="pt-10 pb-8">
          <div className="px-4 flex justify-center">
            <button
              type="button"
              className="text-xs text-gray-400 underline underline-offset-4 active:text-gray-600"
              onClick={() => setResetConfirmOpen(true)}
            >
              チュートリアルをもう一度見る
            </button>
          </div>
        </section>
      </main>

      {resetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-8"
          onClick={() => setResetConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 text-center text-sm text-gray-800 leading-relaxed">
              現在のメモが全て置き換わります。
              <br />
              チュートリアルに戻しますか？
              <div className="mt-3 text-xs text-gray-400">
                大事なメモは右スワイプでメール送信して残しておけます。
              </div>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                type="button"
                className="flex-1 py-3 text-gray-500 active:bg-gray-50"
                onClick={() => setResetConfirmOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="flex-1 py-3 text-red-500 border-l border-gray-100 font-medium active:bg-gray-50"
                onClick={() => {
                  setResetConfirmOpen(false);
                  onResetTutorial();
                }}
              >
                戻す
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
