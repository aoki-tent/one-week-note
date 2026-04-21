# One Week Note — Claude Code 向け実装ブリーフ（現行版）

このドキュメントは「One Week Note」（略称 **OWN**）というiPhone向けPWAプロトタイプの現行仕様です。プロジェクトルートに `CLAUDE.md` として配置され、Claude Code が自動参照します。

元々は「meemo」という名前で始まり、ブランド変更後も一部の内部識別子（localStorage キー、プロジェクトディレクトリ名等）は `meemo` のまま維持しています（既存データ保護のため）。

---

## 1. プロジェクト概要

### 1.1 プロダクトの一行説明

> **一週間で消える、自分だけのノート。**

### 1.2 解こうとしている問題

メモは便利だが、整理しないとよくわからないメモが山のように溜まってしまう。OWNは「とりあえず一週間だけおいておけば、自動で消える」という運用にすることで、**書く時の分類・整理の認知負荷をゼロ**にする。本当に残したいものだけ、メール経由で外部に送り出す。

### 1.3 プロトタイプとしての位置づけ

- 開発者本人 + 家族・友人が iPhone 実機の PWA で日常的に使いながら改善点を見つけるのが目的
- Mac / Xcode / Apple Developer Account は使わない
- App Store 公開は視野に入れない（将来ネイティブ化する可能性はある）

---

## 2. 技術スタックと開発フロー

### 2.1 技術スタック

| レイヤー | 選定 | 理由 |
|---------|------|------|
| フレームワーク | React 19 + TypeScript | 型安全と開発速度 |
| ビルドツール | Vite | 起動・HMRが速い |
| スタイル | Tailwind CSS v3 | ミニマルUIを素早く書ける |
| アニメーション | Framer Motion | スワイプ・フェード等 |
| 並び替え | 手動ポインター実装（Framer Motion の `Reorder` は撤去済み） | 挙動の完全制御のため |
| 永続化 | localStorage | プロトタイプには十分 |
| メール送信 | Gmail compose URL（`mailto:` ではない） | 新タブで Gmail 作成画面が開く |
| 配信 | PWA（manifest のみ、Service Worker は未実装） | ホーム画面追加で全画面起動 |
| ホスティング | Vercel 予定 | GitHub 連携で自動デプロイ |

### 2.2 開発フロー

1. ローカルで `npm run dev` → `http://localhost:5173` で確認
2. `git push` → Vercel が自動デプロイ
3. iPhone で PWA を再読み込みして最新版を反映

### 2.3 npm キャッシュの注意

開発環境で `npm install` が root 所有ディレクトリで失敗する場合は、プロジェクト専用キャッシュを使う：
```bash
npm install --cache /tmp/npm-cache-meemo
```

---

## 3. プロダクト仕様

### 3.1 基本思想

- **判断ゼロで書ける**：アプリを開いた瞬間にキーボードが立ち上がり、すぐ書ける
- **例外のないシンプルなルール**：全メモ等しく7日で消える
- **すべての操作は1日以内に取り消し可能**：確認モーダルは最小限に
- **育てたくなったら、このアプリの外へ**：メール経由で他アプリに卒業させる

### 3.2 寿命と状態遷移

- 全メモは**作成から7日後**に自動消去される。例外なし
- 手動並び替えや追記編集では寿命は延びない
- メモの状態は3つ：

| 状態 | 見た目 | 判定条件 |
|------|--------|---------|
| 新鮮 | 通常の文字色 | 作成から1日以内 |
| 経年 | 段階的にフェード（age-based opacity） | 1日〜6日 |
| 消失寸前 | expiringAt 時点の opacity から24時間かけて 0.15 まで徐々に薄く | `expiringAt` セット済み or 6日以上経過 |

寿命はフェードのみで表現。残日数テキスト（「あと2日」等）は表示しない。

**消失寸前状態への入り口は3通り**：

1. **自然寿命**：作成から6日経過で自動遷移（7日目の1日間を消失寸前として過ごす）
2. **メール送信**：右スワイプ → Gmail 作成タブを開く → 即消失寸前＋送信済みフラグ
3. **明日削除**：左スワイプ → 即消失寸前

視覚的にはどの経路も最終的に「超薄いグレー（0.15）」に収束するが、遷移は滑らか。
- **左スワイプ時の immediate visual feedback** は、初期 opacity を最大 0.7 にキャップすることで確保
- 送信経由のみ右端に **青い ↗ マーク** が付く（フェード外で常時くっきり表示）

**復帰（蘇生）**：消失寸前状態のメモは「復帰」ボタンで**初日状態に戻る**。フェード、送信済みフラグ、寿命、全てリセット。押下時はアコーディオンも自動で閉じる。

**いま削除**：すでに消失寸前状態のメモをもう一度左スワイプすると、**即座に完全削除**（localStorage からも消滅）。ラベルが「明日削除」から「**いま削除**」に変わる。

### 3.3 第一階層：一覧画面

- **ヘッダー**：黒背景 (`bg-black`)、中央に白文字で `ONE WEEK NOTE`（DIN Condensed Bold、文字間 0.24em、11px）、右端に白いハンバーガーアイコン
- **入力行**：ヘッダー直下の白背景エリアに、空の入力行（起動時に自動フォーカス、キーボード出現）
- **一覧**：灰背景 (`bg-gray-100`)、各メモは灰背景の行として並ぶ
- 入力行で Enter → 直下に新規メモが追加
- 改行不可（多行は第二階層の追記で）
- デフォルト並び順：作成順、上が新しい
- 長押し＋ドラッグで手動並び替え可能。**見た目のみ変更、寿命には影響しない**
- 入力行（最上段）は並び替え対象外

### 3.4 第二階層：アコーディオン

- 各メモ行の**右端のシェブロン三角ボタン**をタップ → 直下に白背景パネルが展開
- シェブロンの色：
  - 追記が**空**：白い三角（行の薄灰背景に馴染む）
  - 追記**あり**：黒い三角（くっきり視認できる）
  - メモの opacity に追従してフェード
- 同時展開は1つだけ
- 閉じる：同じシェブロン（展開中は上向き）タップ、またはパネルを下スワイプ

**通常状態の展開内容**：
1. **追記**：自由記述欄（textarea、自動保存、保存ボタンなし）
2. **作成日時**：右下に小さく（例：`2026年4月20日 14:23`）

**消失寸前状態の展開内容**：
- 追記は**読み取り専用**
- 送信済みなら、作成日時に加えて**送信日時も併記**
- 左下に **「復帰」ボタン**（黒い Pill 型ボタン）

### 3.5 メモ見出しの編集

- 展開状態は関係なく、**メモ本文をダブルタップ**で編集モード（その場で input 化、キーボード出現）
- ダブルタップ判定は **320ms 以内**の2タップ
- 一部編集して Enter → 変更を保存
- **全消去して Enter** → 削除確認モーダル（アプリ内で唯一のモーダル、キャンセル可）
- 作成日時は編集しても変わらない

### 3.6 ジェスチャー一覧

| 操作 | 対象 | 結果 |
|------|------|------|
| 右端シェブロンタップ | 畳まれたメモ | 第二階層を展開 |
| 右端シェブロンタップ | 展開中のメモ | 第二階層を閉じる |
| 下スワイプ | 展開中の追記パネル | 第二階層を閉じる |
| **ダブルタップ**（320ms以内） | メモ本文（見出し） | 編集モードに入る |
| Enter（入力あり） | 入力行／編集モード | 確定・保存 |
| Enter（空の状態） | 編集モード | 削除確認モーダル |
| 左スワイプ（通常メモ） | メモ行 | 消失寸前状態へ。背景に **青色**・`明日削除` ラベル |
| 左スワイプ（消失寸前メモ） | メモ行 | 即完全削除。背景に **赤色**・`いま削除` ラベル |
| 右スワイプ | メモ行 | Gmail 作成タブ起動 → 消失寸前＋送信済みフラグ。背景に **緑色**・`メール送信` ラベル |
| **長押し 600ms + 上下ドラッグ** | メモ行 | 手動並び替え。長押し確定で浮き上がり（scale 1.04、影、白背景） |
| 「復帰」ボタン | 第二階層内 | 初日の状態に戻す＋アコーディオン自動閉じ |
| ≡ ハンバーガータップ | ヘッダー右 | 設定画面を開く |

**スワイプの発動閾値**：
- 左スワイプ：画面幅の 45%
- 右スワイプ：画面幅の 50%
- 閾値に達するまでは背景色が 0〜60% で徐々に濃くなり、**閾値に達した瞬間に100%にスナップ**して視覚的に「ここで離せば発動」と分かる

**長押し検出の仕様**：
- 600ms ホールドで発火（8px以上の指ブレで自動キャンセル）
- 発火時は haptic（`navigator.vibrate(15)`）
- 長押し発火以降は **window レベル**で pointermove/up/cancel を捕捉 → 指が行の範囲外に出ても並び替えが中断されない（`setPointerCapture` は使わない）
- 発火後は内側の横スワイプを完全無効化（`blockSwipeRef` ガード）

### 3.7 メール送信仕様

- **トリガー**：右スワイプ → Gmail の compose URL を新しいタブで開く（`window.open` の `_blank`）
- **URL 形式**：`https://mail.google.com/mail/?view=cm&fs=1&to=<email>&su=<subject>&body=<body>`
- **送信先**：設定画面で登録した1つのアドレス（デフォルト `aoki@tent1000.com`）
- **件名フォーマット**：`OWN: <メモ本文>`
- **本文フォーマット**：
  ```
  <メモ本文>
  
  <追記>
  
  ---
  2026年4月20日 14:23 に作成
  One Week Noteから送信
  ```
  追記がない場合、その行と前後の空行は省略。日時は**作成時刻**
- **送信後の挙動**：新タブを開いた時点で消失寸前状態へ遷移＋送信済み（↗）フラグ。キャンセルした場合は手動で復帰ボタン
- **クイック送信モード**：設定にトグルがあるが MVP では保存のみ（Gmail Web でもワンクリック送信までは自動化できない）

### 3.8 設定画面

ハンバーガータップで開く全画面オーバーレイ。以下のセクション：

1. **メール送信**
   - 送信先アドレス（入力、onBlur で保存）
   - 確認なしで即送信：トグル（緑 ON / 灰 OFF、保存のみ）
2. **このアプリについて**（画面遷移）
   - プロダクトコンセプト
   - ユーザーが覚えることは3つだけ
   - 操作ガイド（書く / メール送信 / 明日削除 / いま削除 / 第二階層 / 見出し編集 / 並び替え）
   - メモの寿命の説明
3. **画面最下部**（目立たない灰色テキストリンク）
   - 「チュートリアルをもう一度見る」→ 確認モーダル → 全メモをチュートリアル9件に置き換え

### 3.9 チュートリアル（初回起動）

初回起動時（`meemo:initialized` フラグがない & メモ配列が空）に、以下の9件のメモを自動挿入：

1. `↑この白いところに文字を記入できます`
2. `文字を書いてEnterすればメモ入力完了`
3. `メモをダブルタップすると修正できます`
4. `右側の三角形を押すと詳細を追記できます` + 追記
5. `書いたメモは7日後に消えます` + 追記
6. `右スワイプでメモをメールへ送付できます`
7. `左スワイプでメモを明日削除できます` + 追記
8. `時間が経過したメモの復帰方法は？` + 追記（**3日前作成 + expiringAt セット済み**で復帰ボタン表示のデモ）
9. `ONE WEEK NOTE` + 追記（プロダクト紹介文）

初期化後は `meemo:initialized = 'true'` フラグを立て、ユーザーが全削除しても再表示しない。設定画面の「チュートリアルをもう一度見る」で再表示可能。

---

## 4. データモデル

### 4.1 TypeScript 型定義

```typescript
type MemoStatus = 'fresh' | 'aging' | 'expiring';

interface Memo {
  id: string;                  // UUID
  body: string;                // メモ本文（見出し）
  annotation: string;          // 追記（空文字列可）
  createdAt: string;           // ISO 8601
  expiringAt: string | null;   // 消失寸前状態に入った時刻。nullなら通常状態
  sentAt: string | null;       // 送信時刻。nullなら未送信
  customOrder: number | null;  // （予約フィールド、現在は未使用）
}

interface Settings {
  email: string;
  quickSend: boolean;
}
```

### 4.2 localStorage スキーマ

- `meemo:memos` → `Memo[]` をJSON化
- `meemo:settings` → `Settings` をJSON化
- `meemo:initialized` → `'true'`（チュートリアル初期化済みフラグ）

※キー名の `meemo:` プレフィックスは旧称の名残。ブランド変更時に既存データを保護するため維持。

### 4.3 状態判定ロジック

```typescript
function deriveStatus(memo: Memo, now: Date): MemoStatus {
  if (memo.expiringAt) return 'expiring';
  const ageMs = now.getTime() - new Date(memo.createdAt).getTime();
  if (ageMs >= SIX_DAYS_MS) return 'expiring';
  if (ageMs < DAY_MS) return 'fresh';
  return 'aging';
}

function calculateOpacity(memo: Memo, now: Date): number {
  const ageMs = now.getTime() - new Date(memo.createdAt).getTime();
  const ageRatio = Math.max(0, Math.min(1, ageMs / SIX_DAYS_MS));
  const ageOpacity = 1 - ageRatio * 0.75;  // 0日=1.0 → 6日=0.25

  if (!memo.expiringAt) return ageOpacity;

  // expiringAt セット済み：初期値をキャップして24時間かけて 0.15 に補間
  const sinceExpire = now.getTime() - new Date(memo.expiringAt).getTime();
  const expireRatio = Math.max(0, Math.min(1, sinceExpire / DAY_MS));
  const initialOpacity = Math.min(ageOpacity, 0.7);
  return initialOpacity + (0.15 - initialOpacity) * expireRatio;
}

function shouldAutoDelete(memo: Memo, now: Date): boolean {
  if (memo.expiringAt) {
    const elapsed = now.getTime() - new Date(memo.expiringAt).getTime();
    return elapsed >= DAY_MS;
  }
  const ageMs = now.getTime() - new Date(memo.createdAt).getTime();
  return ageMs >= SEVEN_DAYS_MS;
}
```

状態再計算は 1分おき `setInterval` + `visibilitychange` で実行。

---

## 5. 実装上の注意点

### 5.1 iOS Safari の落とし穴

- **`100vh` 問題**：`100dvh` を使用
- **フォーカス時のオートズーム**：input の font-size を **16px 以上**に維持
- **テキスト選択ハイライト**：`-webkit-tap-highlight-color: transparent` + 必要箇所に `user-select: none`

### 5.2 日本語入力（IME）対応

`compositionstart` / `compositionend` で Enter 誤確定を防ぐ：
```tsx
onCompositionStart={() => setIsComposing(true)}
onCompositionEnd={() => setIsComposing(false)}
onKeyDown={(e) => {
  if (e.key === 'Enter' && !isComposing) { /* 確定 */ }
}}
```

### 5.3 スワイプ実装（MemoRow 内側）

Framer Motion の `drag="x"` + `dragConstraints={{ left: 0, right: 0 }}` + `dragElastic={0.6}`：
- `onDrag` で `info.offset.x` を閾値と比較して `leftBgOpacity` / `rightBgOpacity` を更新（閾値到達で 1.0 にスナップ）
- `onDragEnd` で閾値越えを判定して `onSwipeDelete` / `onSwipeSend` 発火
- 並び替えモード中は `blockSwipeRef` ガードで無効化
- `isReordering` 切り替え時は `x.set(0)` で横位置を強制リセット（useEffect）— これをしないとドラッグ残留値で行が画面外にずれる

### 5.4 並び替え実装（手動）

Framer Motion の `Reorder` は使わない（内側の x ドラッグと競合するため撤去済み）。代わりに：
- `motion.div` 本体に `onPointerDown` / `onPointerMove` / `onPointerUp` / `onPointerCancel`
- 600ms 長押し検出でタイマー発火 → `isReordering=true`
- **window レベル**で `pointermove` / `pointerup` / `pointercancel` を捕捉（行の範囲外でも取れる）
- 離した時点で `y.get()` と実測した行の高さから新しい index を計算 → `splice` で配列を並び替え
- `isReordering` 中は内側の `x` 値を強制的に 0 にリセット + `onDragEnd` で `blockSwipeRef` ガード
- 長押し確定時のビジュアル：scale 1.04 + 影 + 白背景 + zIndex 100

### 5.5 Gmail 送信の実装

```typescript
function buildSendUrl(memo: Memo, settings: Settings): string {
  const subject = `OWN: ${memo.body}`;
  const annotationBlock = memo.annotation ? `\n\n${memo.annotation}` : '';
  const body = `${memo.body}${annotationBlock}\n\n---\n${formatCreatedAt(memo.createdAt)} に作成\nOne Week Noteから送信`;
  const params = new URLSearchParams({
    view: 'cm', fs: '1', to: settings.email, su: subject, body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

// 呼び出し側
window.open(buildSendUrl(memo, settings), '_blank', 'noopener,noreferrer');
onMarkSent(memo.id);
```

### 5.6 PWA 設定

**`public/manifest.json`**：
```json
{
  "name": "One Week Note",
  "short_name": "OWN",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "start_url": "/",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**`index.html`** の meta：
```html
<meta name="description" content="一週間で消える、自分だけのノート。">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="OWN">
<title>One Week Note</title>
```

アイコンは `public/icon.svg`（単色の `m`）から `sips` で PNG 生成した仮アイコン。正式デザイン差し替え予定。

---

## 6. プロジェクト構成

```
meemo/ （プロジェクトディレクトリ名は旧称のまま）
├── public/
│   ├── manifest.json
│   ├── icon-192.png / icon-512.png / apple-touch-icon.png  # 仮アイコン
│   └── icon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx                         # ヘッダー + 入力行 + 一覧 + 設定画面のルート
│   ├── components/
│   │   ├── InputRow.tsx                # 最上段の入力行
│   │   ├── MemoList.tsx                # 一覧 + 削除モーダル管理 + reorder ラッパ
│   │   ├── MemoRow.tsx                 # スワイプ / 長押し並び替え / アコーディオン連動
│   │   ├── MemoAccordion.tsx           # 追記欄 + 復帰ボタン + 日時
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── SettingsScreen.tsx          # 設定 + チュートリアル再表示リンク + 確認モーダル
│   │   └── AboutScreen.tsx             # このアプリについて
│   ├── hooks/
│   │   ├── useMemos.ts                 # CRUD + 並び替え + resetTutorial
│   │   └── useSettings.ts
│   ├── lib/
│   │   ├── memo.ts                     # 型 + deriveStatus + calculateOpacity + shouldAutoDelete
│   │   ├── storage.ts                  # localStorage + createTutorialMemos
│   │   └── mailto.ts                   # buildSendUrl (Gmail)
│   ├── index.css                       # Tailwind + iOS Safari 対策
│   └── vite-env.d.ts
├── index.html
├── package.json                        # "name": "one-week-note"
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 7. デザイン原則

- **モーダルは2箇所だけ**：
  1. 見出しを空にして Enter → 削除確認モーダル
  2. チュートリアル再表示の確認モーダル
- **ラベル・タグ・分類機能は持たない**
- **通知・リマインドは持たない**
- **視覚言語の一貫性**：寿命・送信・削除、すべて最終的に「超薄いグレー（0.15）」へ収束（遷移は滑らか）
- **フォントは sans-serif 1種類**（ただしヘッダータイトルのみ DIN Condensed Bold）
- **装飾より余白で情報階層を作る**
- **「引き算の美しさ」を目指す**

---

## 8. ユーザーが覚えるべきこと

1. **書く**
2. **外に送る（右スワイプ）、または消す（左スワイプ）**
3. **大事なものは、消える前にもう一度書くか、外に送る**

この3点が体験の核。実装中に機能を足したくなったら、これに貢献するか自問すること。
