import { useCallback, useEffect, useRef, useState } from 'react';
import type { Memo } from '../lib/memo';
import { createMemo, shouldAutoDelete } from '../lib/memo';
import { createTutorialMemos, loadMemos, saveMemos } from '../lib/storage';
import { trackEvent } from '../lib/analytics';

export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>(() => loadMemos());
  const [now, setNow] = useState<Date>(() => new Date());
  const memosRef = useRef(memos);
  memosRef.current = memos;

  useEffect(() => {
    saveMemos(memos);
  }, [memos]);

  useEffect(() => {
    const tick = () => {
      const currentNow = new Date();
      setNow(currentNow);
      const filtered = memosRef.current.filter((m) => !shouldAutoDelete(m, currentNow));
      if (filtered.length !== memosRef.current.length) {
        setMemos(filtered);
      }
    };
    tick();
    const id = window.setInterval(tick, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const addMemo = useCallback((body: string): string | null => {
    const trimmed = body.trim();
    if (!trimmed) return null;
    const memo = createMemo(trimmed);
    setMemos((prev) => [memo, ...prev]);
    trackEvent('memo_created');
    return memo.id;
  }, []);

  const updateAnnotation = useCallback((id: string, annotation: string) => {
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, annotation } : m)),
    );
  }, []);

  const updateBody = useCallback((id: string, body: string) => {
    setMemos((prev) => prev.map((m) => (m.id === id ? { ...m, body } : m)));
  }, []);

  const moveToExpiring = useCallback((id: string) => {
    const iso = new Date().toISOString();
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, expiringAt: iso } : m)),
    );
  }, []);

  const markSent = useCallback((id: string) => {
    const iso = new Date().toISOString();
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, sentAt: iso, expiringAt: iso } : m,
      ),
    );
  }, []);

  const restore = useCallback((id: string) => {
    const iso = new Date().toISOString();
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, createdAt: iso, expiringAt: null, sentAt: null }
          : m,
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const resetTutorial = useCallback(() => {
    setMemos(createTutorialMemos());
  }, []);

  return {
    memos,
    now,
    addMemo,
    updateAnnotation,
    updateBody,
    moveToExpiring,
    markSent,
    restore,
    remove,
    resetTutorial,
  };
}
