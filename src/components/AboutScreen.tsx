interface Props {
  onBack: () => void;
}

interface LinkItemProps {
  label: string;
  text: string;
  href: string;
}

function LinkItem({ label, text, href }: LinkItemProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-gray-400">{label}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-[15px] text-blue-500 active:opacity-60"
      >
        {text}
      </a>
    </div>
  );
}

export function AboutScreen({ onBack }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <header className="flex items-center h-12 px-3 border-b border-gray-200 shrink-0">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center text-gray-600 text-xl"
          onClick={onBack}
          aria-label="戻る"
        >
          ←
        </button>
        <h1 className="text-base font-medium text-gray-900 ml-1">
          このアプリについて
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-7 text-[15px] text-gray-800 leading-relaxed">

        {/* お手紙パート */}
        <p className="mb-5">
          メモは便利。{'\n'}
          だけど整理しないと、よくわからないメモが山のように溜まってしまう。
        </p>
        <p className="mb-5">
          そんな状況をなんとかしたくて{'\n'}
          「とりあえず一週間だけ置いといて、自動的に消えちゃうメモツール」を作りました。
        </p>
        <p className="mb-5">
          まずは書いてみて、追記したくなったら追記欄に記入。{'\n'}
          「このメモ大事かも！」と思えたなら、右スワイプで自分のメールアドレスへ一瞬で送信。
        </p>
        <p className="mb-8">
          まずは一週間、消えていくメモを体感してみてください！
        </p>

        {/* 区切り */}
        <div className="flex items-center gap-3 mb-8">
          <hr className="flex-1 border-gray-200" />
          <span className="text-gray-300 text-sm select-none">──</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        {/* 導線3つ */}
        <p className="text-[15px] text-gray-800 mb-6">
          このアプリは TENT の青木が作りました。
        </p>

        <div className="space-y-6">
          <LinkItem
            label="なぜ作ったのか、どう作ったのか ▸"
            text="「メモというゴミの山、解決大作戦！」を読む"
            href="https://note.com/aoki_tent/n/nc643a488181c"
          />
          <LinkItem
            label="TENTの他のプロダクト ▸"
            text="TENTのTEMPO"
            href="https://tempo.tent1000.com/"
          />
          <LinkItem
            label="お問い合わせ・感想 ▸"
            text="@aoki_TENT"
            href="https://twitter.com/aoki_TENT"
          />
        </div>

        {/* バージョン */}
        <p className="mt-10 text-xs text-gray-300 text-center select-none">
          v0.1.0
        </p>

        <div className="h-8" />
      </main>
    </div>
  );
}
