interface Props {
  onBack: () => void;
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

      <main className="flex-1 overflow-y-auto px-5 py-6 text-[15px] text-gray-800 leading-relaxed">
        <h2 className="text-xl font-medium text-gray-900 mb-2">One Week Note</h2>
        <p className="text-sm text-gray-500 mb-6">一週間で消える、自分だけのノート。</p>

        <p className="mb-6">
          メモは便利。だけど整理しないと、よくわからないメモが山のように溜まってしまう。そんな状況をなんとかしたくて「とりあえず一週間だけおいといて、自動的に消えちゃうメモツール」を作りました。
        </p>

        <p className="mb-8">
          まずは書いてみて。追記したくなったら追記欄に記入。「このメモ大事かも！」と思えたなら右スワイプで自分のメールアドレスに一瞬で送信できます！
        </p>

        <h3 className="text-base font-medium text-gray-900 mt-8 mb-3">
          ユーザーが覚えることは3つだけ
        </h3>
        <ol className="list-decimal pl-5 space-y-1 mb-8">
          <li>書く</li>
          <li>外に送る（右スワイプ）、または消す（左スワイプ）</li>
          <li>大事なものは消える前にもう一度書くか、外に送る</li>
        </ol>

        <h3 className="text-base font-medium text-gray-900 mt-8 mb-3">
          操作ガイド
        </h3>

        <div className="space-y-4">
          <div>
            <div className="font-medium text-gray-900">書く</div>
            <p className="text-sm">
              一覧の最上段の入力欄に文字を打ち込み、Enterで確定。改行は不可。追記は第二階層で。
            </p>
          </div>

          <div>
            <div className="font-medium text-gray-900">メール送信（右スワイプ）</div>
            <p className="text-sm">
              メモを右にスワイプするとGmailの作成画面が新しいタブで開きます。送信ボタンを押すと送信完了。送ったメモには青い <span className="text-blue-500">↗</span> マークが付きます。
            </p>
          </div>

          <div>
            <div className="font-medium text-gray-900">翌日削除（左スワイプ）</div>
            <p className="text-sm">
              メモを左にスワイプすると「消失寸前状態」になり、1日後に自動消去されます。取り消したい時は第二階層を開いて「復帰」ボタン。
            </p>
          </div>

          <div>
            <div className="font-medium text-gray-900">いま削除（消失寸前メモを再度左スワイプ）</div>
            <p className="text-sm">
              すでに消失寸前状態のメモをもう一度左スワイプすると即完全削除されます。
            </p>
          </div>

          <div>
            <div className="font-medium text-gray-900">第二階層（∨をタップ）</div>
            <p className="text-sm">
              メモ右端の下向きシェブロン <span className="text-gray-400">∨</span> をタップすると追記欄と作成日時が表示されます。もう一度タップで閉じます。
            </p>
          </div>

          <div>
            <div className="font-medium text-gray-900">見出しの編集（ダブルタップ）</div>
            <p className="text-sm">
              メモ本文をダブルタップすると見出しを編集できます。Enterで保存、空にしてEnterで削除確認。
            </p>
          </div>

          <div>
            <div className="font-medium text-gray-900">並び替え（長押し＋上下ドラッグ）</div>
            <p className="text-sm">
              メモを約0.6秒長押しすると浮き上がり、そのまま上下にドラッグで並び替えできます。見た目のみで寿命には影響しません。
            </p>
          </div>
        </div>

        <h3 className="text-base font-medium text-gray-900 mt-8 mb-3">
          メモの寿命
        </h3>
        <p className="mb-4 text-sm">
          作成から日が経つにつれて文字が薄くなり、7日目で消失寸前（超薄いグレー）、その24時間後に完全消去されます。手動編集や並び替えでは寿命は延びません。
        </p>

        <div className="h-10" />
      </main>
    </div>
  );
}
