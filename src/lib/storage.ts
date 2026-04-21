import type { Memo, Settings } from './memo';
import { newMemoId } from './memo';

const MEMOS_KEY = 'meemo:memos';
const SETTINGS_KEY = 'meemo:settings';
const INITIALIZED_KEY = 'meemo:initialized';

export const defaultSettings: Settings = {
  email: '',
  quickSend: false,
};

const tutorialItems: Array<{ body: string; annotation: string }> = [
  { body: '↑この白いところに文字を記入できます', annotation: '' },
  { body: '文字を書いてEnterすればメモ入力完了', annotation: '' },
  { body: 'メモをダブルタップすると修正できます', annotation: '' },
  {
    body: '右側の三角形を押すと詳細を追記できます',
    annotation:
      'ここが追記欄です。たくさんの文字を書くことができます。三角形を押せば閉じられます。',
  },
  {
    body: '書いたメモは7日後に消えます',
    annotation: '古いメモほど文字が薄く表示されています。',
  },
  { body: '右スワイプでメモをメールへ送付できます', annotation: '' },
  {
    body: '左スワイプでメモを明日削除できます',
    annotation: 'さらに左スワイプすると、今すぐ削除できます',
  },
  {
    body: '時間が経過したメモの復帰方法は？',
    annotation:
      '追記欄の下側にある「復帰ボタン」を押せば、メモは復活。7日後に消える状態に戻ります。',
  },
  {
    body: 'ONE WEEK NOTE',
    annotation:
      '一週間で消える、自分だけのノート。\n\nメモは便利。だけど整理しないと、よくわからないメモが山のように溜まってしまう。そんな状況をなんとかしたくて「とりあえず一週間だけおいといて、自動的に消えちゃうメモツール」を作りました。\nまずは書いてみて。追記したくなったら追記欄に記入。「このメモ大事かも！」と思えたなら右スワイプで自分のメールアドレスに一瞬で送信できます！',
  },
];

export function createTutorialMemos(): Memo[] {
  const base = Date.now();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const RESTORE_DEMO_BODY = '時間が経過したメモの復帰方法は？';
  return tutorialItems.map((item, i) => {
    const isRestoreDemo = item.body === RESTORE_DEMO_BODY;
    return {
      id: newMemoId(),
      body: item.body,
      annotation: item.annotation,
      // Stagger 1 second apart so insertion order is stable; restore demo is 3 days old
      createdAt: new Date(
        base - (isRestoreDemo ? THREE_DAYS_MS : i * 1000),
      ).toISOString(),
      // Put restore-demo memo into expiring state so 復帰 button is shown
      expiringAt: isRestoreDemo ? new Date(base).toISOString() : null,
      sentAt: null,
      customOrder: null,
    };
  });
}

export function loadMemos(): Memo[] {
  try {
    const raw = localStorage.getItem(MEMOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Memo[];
    }
    if (!localStorage.getItem(INITIALIZED_KEY)) {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      return createTutorialMemos();
    }
    return [];
  } catch {
    return [];
  }
}

export function saveMemos(memos: Memo[]): void {
  localStorage.setItem(MEMOS_KEY, JSON.stringify(memos));
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
