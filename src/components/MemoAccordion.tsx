import { useEffect, useRef, useState } from 'react';
import type { Memo } from '../lib/memo';
import { deriveStatus, formatCreatedAt } from '../lib/memo';

interface Props {
  memo: Memo;
  now: Date;
  onChangeAnnotation: (value: string) => void;
  onRestore: () => void;
  onClose: () => void;
}

export function MemoAccordion({
  memo,
  now,
  onChangeAnnotation,
  onRestore,
  onClose,
}: Props) {
  const status = deriveStatus(memo, now);
  const readOnly = status === 'expiring';
  const [value, setValue] = useState(memo.annotation);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    setValue(memo.annotation);
  }, [memo.id, memo.annotation]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const commit = (next: string) => {
    setValue(next);
    onChangeAnnotation(next);
  };

  return (
    <div
      className="px-4 py-3 bg-white border-t border-gray-200"
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0].clientY;
      }}
      onTouchEnd={(e) => {
        if (touchStartY.current === null) return;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        touchStartY.current = null;
        if (dy > 40) onClose();
      }}
    >
      <textarea
        ref={taRef}
        value={value}
        readOnly={readOnly}
        onChange={(e) => commit(e.target.value)}
        placeholder={readOnly ? '' : '追記'}
        className="w-full resize-none bg-transparent outline-none text-sm text-gray-800 placeholder-gray-300 min-h-[3rem] leading-relaxed"
      />
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          {status === 'expiring' && (
            <button
              className="text-xs px-3 py-1.5 rounded-full bg-gray-900 text-white active:opacity-70"
              onClick={onRestore}
            >
              復帰
            </button>
          )}
        </div>
        <div className="text-[11px] text-gray-400 text-right leading-tight">
          <div>{formatCreatedAt(memo.createdAt)}</div>
          {memo.sentAt && (
            <div>送信：{formatCreatedAt(memo.sentAt)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
