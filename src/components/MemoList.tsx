import { useState } from 'react';
import type { Memo, Settings } from '../lib/memo';
import { deriveStatus } from '../lib/memo';
import { buildSendUrl } from '../lib/mailto';
import { MemoRow } from './MemoRow';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface Props {
  memos: Memo[];
  now: Date;
  settings: Settings;
  onChangeAnnotation: (id: string, value: string) => void;
  onChangeBody: (id: string, value: string) => void;
  onMoveToExpiring: (id: string) => void;
  onMarkSent: (id: string) => void;
  onRestore: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (next: Memo[]) => void;
}

export function MemoList({
  memos,
  now,
  settings,
  onChangeAnnotation,
  onChangeBody,
  onMoveToExpiring,
  onMarkSent,
  onRestore,
  onRemove,
  onReorder,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleSend = (memo: Memo) => {
    location.href = buildSendUrl(memo, settings);
    onMarkSent(memo.id);
  };

  const reorderFromTo = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...memos];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    onReorder(next);
  };

  return (
    <>
      <div>
        {memos.map((memo, index) => (
          <MemoRow
            key={memo.id}
            memo={memo}
            index={index}
            totalCount={memos.length}
            now={now}
            expanded={expandedId === memo.id}
            onToggle={() => setExpandedId(memo.id)}
            onClose={() => setExpandedId(null)}
            onChangeAnnotation={(v) => onChangeAnnotation(memo.id, v)}
            onChangeBody={(v) => onChangeBody(memo.id, v)}
            onRequestDelete={() => setPendingDeleteId(memo.id)}
            onSwipeDelete={() => {
              if (deriveStatus(memo, now) === 'expiring') {
                onRemove(memo.id);
              } else {
                onMoveToExpiring(memo.id);
              }
            }}
            onSwipeSend={() => handleSend(memo)}
            onRestore={() => {
              onRestore(memo.id);
              setExpandedId(null);
            }}
            onReorderFromTo={reorderFromTo}
          />
        ))}
      </div>
      <DeleteConfirmModal
        open={pendingDeleteId !== null}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) onRemove(pendingDeleteId);
          setPendingDeleteId(null);
          setExpandedId(null);
        }}
      />
    </>
  );
}
