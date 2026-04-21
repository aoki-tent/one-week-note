import { motion, useMotionValue } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Memo } from '../lib/memo';
import { calculateOpacity, deriveStatus } from '../lib/memo';
import { MemoAccordion } from './MemoAccordion';

interface Props {
  memo: Memo;
  index: number;
  totalCount: number;
  now: Date;
  expanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChangeAnnotation: (value: string) => void;
  onChangeBody: (value: string) => void;
  onRequestDelete: () => void;
  onSwipeDelete: () => void;
  onSwipeSend: () => void;
  onRestore: () => void;
  onReorderFromTo: (fromIndex: number, toIndex: number) => void;
}

const LEFT_SWIPE_THRESHOLD = 0.45;
const RIGHT_SWIPE_THRESHOLD = 0.5;
const LONG_PRESS_MS = 600;
const LONG_PRESS_MOVE_TOLERANCE = 8;
const DOUBLE_TAP_MS = 320;

export function MemoRow({
  memo,
  index,
  totalCount,
  now,
  expanded,
  onToggle,
  onClose,
  onChangeAnnotation,
  onChangeBody,
  onRequestDelete,
  onSwipeDelete,
  onSwipeSend,
  onRestore,
  onReorderFromTo,
}: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const leftBgOpacity = useMotionValue(0);
  const rightBgOpacity = useMotionValue(0);
  const opacity = calculateOpacity(memo, now);
  const isExpiring = deriveStatus(memo, now) === 'expiring';
  const deleteLabel = isExpiring ? 'いま削除' : '明日削除';

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memo.body);
  const [isComposing, setIsComposing] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const pressTimer = useRef<number | null>(null);
  const pressStart = useRef<{ x: number; y: number; pointerId: number } | null>(
    null,
  );
  const isReorderingRef = useRef(false);
  const rowHeightRef = useRef(48);
  const indexRef = useRef(index);
  const totalCountRef = useRef(totalCount);
  const lastTapRef = useRef(0);

  const maxDragDistance = useMemo(
    () => window.innerWidth * 0.5,
    [],
  );

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    totalCountRef.current = totalCount;
  }, [totalCount]);

  useEffect(() => {
    setDraft(memo.body);
  }, [memo.body]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (isReordering) {
      x.set(0);
    }
  }, [isReordering, x]);

  const cancelPress = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setIsPressing(false);
  };

  const resetReorder = () => {
    isReorderingRef.current = false;
    setIsReordering(false);
    setIsPressing(false);
    y.set(0);
    x.set(0);
    pressStart.current = null;
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const finishReorder = () => {
    if (!isReorderingRef.current || !pressStart.current) {
      resetReorder();
      return;
    }
    const dy = y.get();
    const height = rowHeightRef.current || 48;
    const shift = Math.round(dy / height);
    const target = Math.max(
      0,
      Math.min(totalCountRef.current - 1, indexRef.current + shift),
    );
    const from = indexRef.current;
    resetReorder();
    if (target !== from) {
      onReorderFromTo(from, target);
    }
  };

  // Window-level pointer listeners while reordering — ensures we receive events
  // even when the pointer leaves the row's bounds (which is what caused the
  // "stuck reorder / blank row" bug).
  useEffect(() => {
    if (!isReordering) return;
    const expectedId = pressStart.current?.pointerId;
    const onMove = (e: PointerEvent) => {
      if (!pressStart.current) return;
      if (expectedId !== undefined && e.pointerId !== expectedId) return;
      y.set(e.clientY - pressStart.current.y);
    };
    const onUp = (e: PointerEvent) => {
      if (expectedId !== undefined && e.pointerId !== expectedId) return;
      finishReorder();
    };
    const onCancel = () => {
      resetReorder();
      cancelPress();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReordering]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    pressStart.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
    };
    // Measure actual row height now (before any scale transform is applied)
    const rect = rowRef.current?.getBoundingClientRect();
    if (rect && rect.height > 0) rowHeightRef.current = rect.height;
    setIsPressing(true);
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      isReorderingRef.current = true;
      setIsReordering(true);
      if ('vibrate' in navigator) navigator.vibrate(15);
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pressStart.current || isReorderingRef.current) return;
    const dx = e.clientX - pressStart.current.x;
    const dy = e.clientY - pressStart.current.y;
    if (
      Math.abs(dx) > LONG_PRESS_MOVE_TOLERANCE ||
      Math.abs(dy) > LONG_PRESS_MOVE_TOLERANCE
    ) {
      cancelPress();
    }
  };

  const onPointerUp = () => {
    // If reorder is active, the window-level listener handles it.
    if (!isReorderingRef.current) {
      cancelPress();
      pressStart.current = null;
    }
  };

  const onPointerCancel = () => {
    if (isReorderingRef.current) {
      resetReorder();
    }
    cancelPress();
    pressStart.current = null;
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
    <motion.div
      ref={rowRef}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      animate={{
        scale: isReordering ? 1.04 : isPressing ? 1.015 : 1,
        boxShadow: isReordering
          ? '0 18px 36px rgba(0,0,0,0.22)'
          : isPressing
            ? '0 3px 10px rgba(0,0,0,0.08)'
            : '0 0 0 rgba(0,0,0,0)',
      }}
      style={{
        y,
        position: 'relative',
        zIndex: isReordering ? 100 : isPressing ? 2 : 'auto',
        backgroundColor: isReordering ? '#ffffff' : 'transparent',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="relative overflow-hidden border-b border-gray-200">
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
          className={`w-full relative overflow-hidden ${isReordering ? 'bg-white' : 'bg-gray-100'}`}
          drag={editing || isReordering ? false : 'x'}
          dragDirectionLock
          dragElastic={0.2}
          style={{ x }}
          onDrag={(_, info) => {
            const w = window.innerWidth;
            const leftThreshold = w * LEFT_SWIPE_THRESHOLD;
            const rightThreshold = w * RIGHT_SWIPE_THRESHOLD;
            const leftDist = Math.max(0, -info.offset.x);
            const rightDist = Math.max(0, info.offset.x);
            leftBgOpacity.set(
              leftDist >= leftThreshold ? 1 : (leftDist / leftThreshold) * 0.6,
            );
            rightBgOpacity.set(
              rightDist >= rightThreshold
                ? 1
                : (rightDist / rightThreshold) * 0.6,
            );
          }}
          onDragEnd={(_, info) => {
            leftBgOpacity.set(0);
            rightBgOpacity.set(0);
            if (isReorderingRef.current) {
              x.set(0);
              return;
            }
            const w = window.innerWidth;
            if (info.offset.x < -w * LEFT_SWIPE_THRESHOLD) {
              onSwipeDelete();
              x.set(0);
            } else if (info.offset.x > w * RIGHT_SWIPE_THRESHOLD) {
              onSwipeSend();
              x.set(0);
            } else {
              x.set(0, { transition: { duration: 0.15 } });
            }
          }}
        >
          <div className="flex items-center px-4 h-12">
            <div className="flex-1 min-w-0 flex items-center" style={{ opacity }}>
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
                  className="flex-1 bg-transparent outline-none text-base text-gray-900"
                />
              ) : (
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left truncate text-base text-gray-900"
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
              style={{ opacity }}
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
                fill="currentColor"
                aria-hidden="true"
              >
                {expanded ? (
                  <path d="M7 0 L14 12 L0 12 Z" />
                ) : (
                  <path d="M0 0 L14 0 L7 12 Z" />
                )}
              </svg>
            </button>
          </div>
        </motion.div>

        {expanded && (
          <MemoAccordion
            memo={memo}
            now={now}
            onChangeAnnotation={onChangeAnnotation}
            onRestore={onRestore}
            onClose={onClose}
          />
        )}
      </div>
    </motion.div>
  );
}
