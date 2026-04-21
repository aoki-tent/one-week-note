export type MemoStatus = 'fresh' | 'aging' | 'expiring';

export interface Memo {
  id: string;
  body: string;
  annotation: string;
  createdAt: string;
  expiringAt: string | null;
  sentAt: string | null;
  customOrder: number | null;
}

export interface Settings {
  email: string;
  quickSend: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SIX_DAYS_MS = 6 * DAY_MS;
const SEVEN_DAYS_MS = 7 * DAY_MS;

export function deriveStatus(memo: Memo, now: Date): MemoStatus {
  if (memo.expiringAt) return 'expiring';
  const ageMs = now.getTime() - new Date(memo.createdAt).getTime();
  if (ageMs >= SIX_DAYS_MS) return 'expiring';
  if (ageMs < DAY_MS) return 'fresh';
  return 'aging';
}

export function calculateOpacity(memo: Memo, now: Date): number {
  if (memo.expiringAt) return 0.3;
  const ageMs = now.getTime() - new Date(memo.createdAt).getTime();
  if (ageMs < DAY_MS) {
    return 1.0 - (ageMs / DAY_MS) * 0.2;
  }
  const aging = Math.min(1, (ageMs - DAY_MS) / (SIX_DAYS_MS - DAY_MS));
  return 0.8 - aging * 0.5;
}

export function shouldAutoDelete(memo: Memo, now: Date): boolean {
  if (memo.expiringAt) {
    const elapsed = now.getTime() - new Date(memo.expiringAt).getTime();
    return elapsed >= DAY_MS;
  }
  const ageMs = now.getTime() - new Date(memo.createdAt).getTime();
  return ageMs >= SEVEN_DAYS_MS;
}

export function newMemoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createMemo(body: string): Memo {
  return {
    id: newMemoId(),
    body,
    annotation: '',
    createdAt: new Date().toISOString(),
    expiringAt: null,
    sentAt: null,
    customOrder: null,
  };
}

export function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}年${m}月${day}日 ${hh}:${mm}`;
}
