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
  newMemoId: string | null;
  onChangeAnnotation: (id: string, value: string) => void;
  onChangeBody: (id: string, value: string) => void;
  onMoveToExpiring: (id: string) => void;
  onMarkSent: (id: string) => void;
  onRestore: (id: string) => void;
  onRemove: (id: string) => void;
}

export function MemoList({
  memos,
  now,
  settings,
  newMemoId,
  onChangeAnnotation,
  onChangeBody,
  onMoveToExpiring,
  onMarkSent,
  onRestore,
  onRemove,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleSend = (memo: Memo) => {
    location.href = buildSendUrl(memo, settings);
    onMarkSent(memo.id);
  };

  return (
    <>
      <div>
        {memos.map((memo) => (
          <MemoRow
            key={memo.id}
            memo={memo}
            now={now}
            expanded={expandedId === memo.id}
            isNew={memo.id === newMemoId}
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
