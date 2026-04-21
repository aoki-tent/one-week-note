import { useEffect, useState } from 'react';
import { InputRow } from './components/InputRow';
import { MemoList } from './components/MemoList';
import { SettingsScreen } from './components/SettingsScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { useMemos } from './hooks/useMemos';
import { useSettings } from './hooks/useSettings';

function App() {
  const {
    memos,
    now,
    addMemo,
    updateAnnotation,
    updateBody,
    moveToExpiring,
    markSent,
    restore,
    remove,
    reorder,
    resetTutorial,
  } = useMemos();
  const { settings, update: updateSettings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!settings.email);

  useEffect(() => {
    if (showOnboarding && settings.email) {
      setShowOnboarding(false);
    }
  }, [settings.email, showOnboarding]);

  const handleOnboardingClose = (email?: string) => {
    if (email) {
      updateSettings({ email });
    }
    setShowOnboarding(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="relative flex items-center justify-end h-[60px] px-3 shrink-0 bg-black">
        <h1
          className="absolute left-1/2 -translate-x-1/2 text-[14px] font-bold text-white select-none"
          style={{
            fontFamily:
              "'DIN Condensed', 'DIN Alternate', 'Oswald', 'Barlow Condensed', 'Helvetica Neue', sans-serif",
            letterSpacing: '0.24em',
          }}
        >
          ONE WEEK NOTE
        </h1>
        <button
          type="button"
          className="text-white w-8 h-8 flex items-center justify-center text-lg relative"
          aria-label="設定"
          onClick={() => setSettingsOpen(true)}
        >
          ≡
        </button>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white">
          <InputRow onSubmit={addMemo} />
        </div>
        <div className="bg-gray-100 min-h-full">
          <MemoList
            memos={memos}
            now={now}
            settings={settings}
            onChangeAnnotation={updateAnnotation}
            onChangeBody={updateBody}
            onMoveToExpiring={moveToExpiring}
            onMarkSent={markSent}
            onRestore={restore}
            onRemove={remove}
            onReorder={reorder}
          />
        </div>
      </main>
      {showOnboarding && (
        <OnboardingModal onClose={handleOnboardingClose} />
      )}
      {settingsOpen && (
        <SettingsScreen
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setSettingsOpen(false)}
          onResetTutorial={() => {
            resetTutorial();
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
