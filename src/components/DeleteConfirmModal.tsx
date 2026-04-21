interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ open, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-8"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 text-center text-base text-gray-900">
          このメモを削除しますか？
        </div>
        <div className="flex border-t border-gray-100">
          <button
            className="flex-1 py-3 text-gray-500 active:bg-gray-50"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            className="flex-1 py-3 text-red-500 border-l border-gray-100 font-medium active:bg-gray-50"
            onClick={onConfirm}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
