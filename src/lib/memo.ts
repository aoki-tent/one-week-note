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

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const SIX_DAYS_MS = 6 * DAY_MS;
const SEVEN_DAYS_MS = 7 * DAY_MS;

// フェーズ2の1日あたりの不透明度低下量（5段階で1.0→0.20）
const AGING_STEP = 0.16;
// フェーズ3（expiring）突入時の不透明度
const EXPIRING_START = 0.20;
// フェーズ3終了時（削除直前）の不透明度
const EXPIRING_END = 0.02;

export function deriveStatus(memo: Memo, now: Date): MemoStatus {
  if (memo.expiringAt) return 'expiring';
  const ageMs = now.getTime() - new Date(memo.createdAt).getTime();
  if (ageMs >= SIX_DAYS_MS) return 'expiring';
  if (ageMs < DAY_MS) return 'fresh';
  return 'aging';
}

export function calculateOpacity(memo: Memo, now: Date): number {
  const ageMs = now.getTime() - new Date(memo.createdAt).getTime();

  // フェーズ3（expiring）突入からの経過時間を求める
  let sinceExpire: number | null = null;
  if (memo.expiringAt) {
    sinceExpire = Math.max(0, now.getTime() - new Date(memo.expiringAt).getTime());
  } else if (ageMs >= SIX_DAYS_MS) {
    // 自然寿命：6日経過時点が expiring 開始
    sinceExpire = ageMs - SIX_DAYS_MS;
  }

  // フェーズ3：1時間ごとに等間隔で 0.20 → 0.02 まで低下（24段階）
  if (sinceExpire !== null) {
    const h = Math.min(24, Math.floor(sinceExpire / HOUR_MS));
    return Math.max(EXPIRING_END, EXPIRING_START - h * ((EXPIRING_START - EXPIRING_END) / 24));
  }

  // フェーズ1：作成後 24h は 1.0 固定
  if (ageMs < DAY_MS) return 1.0;

  // フェーズ2：1〜5日目、24時間ごとに1段階ずつ低下（5段階で 0.84 → 0.20）
  const dayStep = Math.min(4, Math.floor((ageMs - DAY_MS) / DAY_MS));
  return Math.max(EXPIRING_START, 1.0 - (dayStep + 1) * AGING_STEP);
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
