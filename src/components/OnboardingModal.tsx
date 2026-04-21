import { useState } from 'react';

interface OnboardingModalProps {
  onClose: (email?: string) => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [email, setEmail] = useState('');

  const handleSet = () => {
    onClose(email);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold mb-4">One Week Note へようこそ</h2>
        <p className="text-sm text-gray-700 mb-6">
          あなたのメモの送付先となるメールアドレスを入力してください。
        </p>
        <p className="text-xs text-gray-500 mb-4">
          （後から設定から変更も可能です）
        </p>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-black"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            スキップ
          </button>
          <button
            type="button"
            onClick={handleSet}
            disabled={!email}
            className="flex-1 px-4 py-2 text-sm text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            設定
          </button>
        </div>
      </div>
    </div>
  );
}
