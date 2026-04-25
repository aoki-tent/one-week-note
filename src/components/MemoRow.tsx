import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Memo } from '../lib/memo';
import { calculateOpacity, deriveStatus } from '../lib/memo';
import { MemoAccordion } from './MemoAccordion';

interface Props {
  memo: Memo;
  now: Date;
  expanded: boolean;
  isNew?: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChangeAnnotation: (value: string) => void;
  onChangeBody: (value: string) => void;
  onRequestDelete: () => void;
  onSwipeDelete: () => void;
  onSwipeSend: () => void;
  onRestore: () => void;
}

const LEFT_SWIPE_THRESHOLD = 0.45;
const RIGHT_SWIPE_THRESHOLD = 0.5;
const DOUBLE_TAP_MS = 320;

export function MemoRow({
  memo,
  now,
  expanded,
  isNew = false,
  onToggle,
  onClose,
  onChangeAnnotation,
  onChangeBody,
  onRequestDelete,
  onSwipeDelete,
  onSwipeSend,
  onRestore,
}: Props) {
  const x = useMotionValue(0);
  const leftBgOpacity = useMotionValue(0);
  const rightBgOpacity = useMotionValue(0);
  const [flashYellow, setFlashYellow] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const opacity = calculateOpacity(memo, now);
  // アコーディオンが開いているときは見出し・シェブロンを最低 0.5 に引き上げて視認性確保
  const displayOpacity = expanded ? Math.max(0.5, opacity) : opacity;
  const isExpiring = deriveStatus(memo, now) === 'expiring';
  const deleteLabel = isExpiring ? 'いま削除' : '翌日削除';

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memo.body);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLButtonElement>(null);
  const annotationRef = useRef(memo.annotation);
  annotationRef.current = memo.annotation; // 毎レンダリングで最新値を保持
  const lastTapRef = useRef(0);

  const touchSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const swipeDirection = useRef<'horizontal' | 'vertical' | null>(null);

  useEffect(() => {
    setDraft(memo.body);
  }, [memo.body]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // 見出しが実際に見切れているとき、追記欄に全文を自動コピー
  useEffect(() => {
    if (editing) return; // 編集中は判定しない
    const el = bodyRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (!el) return;
      if (el.scrollWidth > el.clientWidth) {
        const body = memo.body;
        const existing = annotationRef.current;
        // 追記欄の先頭がすでに本文と同じなら何もしない（二重登録防止）
        if (!existing.startsWith(body)) {
          const next = existing ? `${body}\n\n${existing}` : body;
          onChangeAnnotation(next);
        }
      }
    });
  }, [memo.body, editing, onChangeAnnotation]);

  const triggerFlash = () => {
    setFlashYellow(true);
    setFlashKey((k) => k + 1);
  };

  // 新規メモ追加時の黄色フラッシュ
  useEffect(() => {
    if (isNew) triggerFlash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  const onTouchStartSwipe = (e: React.TouchEvent) => {
    if (editing) return;
    touchSwipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    swipeDirection.current = null;
  };

  const onTouchMoveSwipe = (e: React.TouchEvent) => {
    if (!touchSwipeStart.current) return;
    const dx = e.touches[0].clientX - touchSwipeStart.current.x;
    const dy = e.touches[0].clientY - touchSwipeStart.current.y;
    if (swipeDirection.current === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      swipeDirection.current = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
    }
    if (swipeDirection.current === 'vertical') return;
    e.preventDefault();
    x.set(dx);
    const w = window.innerWidth;
    const leftDist = Math.max(0, -dx);
    const rightDist = Math.max(0, dx);
    const leftThreshold = w * LEFT_SWIPE_THRESHOLD;
    const rightThreshold = w * RIGHT_SWIPE_THRESHOLD;
    leftBgOpacity.set(leftDist >= leftThreshold ? 1 : (leftDist / leftThreshold) * 0.6);
    rightBgOpacity.set(rightDist >= rightThreshold ? 1 : (rightDist / rightThreshold) * 0.6);
  };

  const onTouchEndSwipe = () => {
    if (!touchSwipeStart.current || swipeDirection.current !== 'horizontal') {
      touchSwipeStart.current = null;
      swipeDirection.current = null;
      return;
    }
    const currentX = x.get();
    leftBgOpacity.set(0);
    rightBgOpacity.set(0);
    x.set(0);
    touchSwipeStart.current = null;
    swipeDirection.current = null;
    const w = window.innerWidth;
    if (currentX < -w * LEFT_SWIPE_THRESHOLD) {
      triggerFlash();
      onSwipeDelete();
    } else if (currentX > w * RIGHT_SWIPE_THRESHOLD) {
      triggerFlash();
      onSwipeSend();
    }
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      setEditing(false);
      setDraft(memo.body);
      onRequestDelete();
      return;
    }
    if (trimmed !== memo.body) {
      onChangeBody(trimmed);
    }
    setEditing(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="relative overflow-hidden border-b border-gray-200">
        {/* 黄色フラッシュオーバーレイ */}
        <AnimatePresence>
          {flashYellow && (
            <motion.div
              key={flashKey}
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: '#fde047', zIndex: 20 }}
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              onAnimationComplete={() => setFlashYellow(false)}
            />
          )}
        </AnimatePresence>
        <motion.div
          className={`absolute inset-0 ${isExpiring ? 'bg-red-500' : 'bg-blue-400'} flex items-center justify-end pr-6 text-white text-sm font-medium pointer-events-none`}
          style={{ opacity: leftBgOpacity }}
        >
          {deleteLabel}
        </motion.div>
        <motion.div
          className="absolute inset-0 bg-green-500 flex items-center justify-start pl-6 text-white text-sm font-medium pointer-events-none"
          style={{ opacity: rightBgOpacity }}
        >
          メール送信
        </motion.div>

        <motion.div
          className="relative bg-gray-100"
          style={{ x, touchAction: 'pan-y' }}
          onTouchStart={onTouchStartSwipe}
          onTouchMove={onTouchMoveSwipe}
          onTouchEnd={onTouchEndSwipe}
        >
          <div className="flex items-center px-4 h-[72px]">
            <div className="flex-1 min-w-0 flex items-center" style={{ opacity: displayOpacity }}>
              {editing ? (
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isComposing) {
                      e.preventDefault();
                      commitEdit();
                    }
                  }}
                  className="flex-1 bg-transparent outline-none text-xl text-gray-900"
                />
              ) : (
                <button
                  ref={bodyRef}
                  type="button"
                  className="flex-1 min-w-0 text-left truncate text-xl text-gray-900"
                  onClick={() => {
                    const now = Date.now();
                    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
                      lastTapRef.current = 0;
                      setEditing(true);
                    } else {
                      lastTapRef.current = now;
                    }
                  }}
                >
                  {memo.body}
                </button>
              )}
            </div>
            {memo.sentAt && (
              <span
                className="ml-2 text-sm text-blue-500 font-medium select-none"
                aria-label="送信済み"
                title="送信済み"
              >
                ↗
              </span>
            )}
            <button
              type="button"
              style={{ opacity: displayOpacity }}
              className={`ml-2 w-8 h-8 flex items-center justify-center select-none ${
                memo.annotation.trim() ? 'text-black' : 'text-white'
              }`}
              onClick={() => {
                if (editing) {
                  commitEdit();
                  return;
                }
                if (expanded) onClose();
                else onToggle();
              }}
              aria-label={expanded ? '閉じる' : '開く'}
            >
              <svg
                width="14"
                height="12"
                viewBox="0 0 14 12"
                aria-hidden="true"
              >
                {expanded ? (
                  <path
                    d="M7 1 L13 11 L1 11 Z"
                    fill={memo.annotation.trim() ? 'black' : 'white'}
                    stroke="black"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M1 1 L13 1 L7 11 Z"
                    fill={memo.annotation.trim() ? 'black' : 'white'}
                    stroke="black"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="accordion"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <MemoAccordion
                memo={memo}
                now={now}
                opacity={opacity}
                onChangeAnnotation={onChangeAnnotation}
                onRestore={onRestore}
                onClose={onClose}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
