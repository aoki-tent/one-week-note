import { useEffect, useRef, useState } from 'react';
import type { Memo } from '../lib/memo';
import { deriveStatus, formatCreatedAt } from '../lib/memo';

interface Props {
  memo: Memo;
  now: Date;
  opacity: number;
  onChangeAnnotation: (value: string) => void;
  onRestore: () => void;
  onClose: () => void;
}

/** テキスト内の URL を検出して <a> リンクに変換する */
function renderWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function MemoAccordion({
  memo,
  now,
  opacity,
  onChangeAnnotation,
  onRestore,
  onClose,
}: Props) {
  const status = deriveStatus(memo, now);
  // 見出しが 0.5 未満のとき追記欄テキストも 0.5 に底上げ（編集中は除く）
  const annotationOpacity = Math.max(0.5, opacity);
  const readOnly = status === 'expiring';
  const [value, setValue] = useState(memo.annotation);
  const [isEditingAnnotation, setIsEditingAnnotation] = useState(false);
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
  }, [value, isEditingAnnotation]);

  useEffect(() => {
    if (isEditingAnnotation) {
      const el = taRef.current;
      if (!el) return;
      el.focus();
      // カーソルを末尾へ
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditingAnnotation]);

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
      {/* 追記エリア：編集中は textarea、それ以外はリンク付きテキスト表示 */}
      {!readOnly && isEditingAnnotation ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setIsEditingAnnotation(false)}
          placeholder="追記"
          className="w-full resize-none bg-transparent outline-none text-sm text-gray-800 placeholder-gray-300 min-h-[3rem] leading-relaxed"
        />
      ) : (
        <div
          className="w-full text-sm text-gray-800 min-h-[3rem] leading-relaxed whitespace-pre-wrap"
          style={{ opacity: annotationOpacity }}
          onClick={() => {
            if (!readOnly) setIsEditingAnnotation(true);
          }}
        >
          {value ? (
            renderWithLinks(value)
          ) : (
            !readOnly && (
              <span className="text-gray-300">追記</span>
            )
          )}
        </div>
      )}

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
