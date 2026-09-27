import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 「この道具はどうやって復習の日を決めているのか」の説明。
 *
 * 覚える君は画面のあちこちで FSRS の言葉(保持率・期限切れ・目標保持率)を
 * そのまま出しているのに、**どこにも意味が書かれていなかった**。
 * 「平均保持率 78%」とだけ出ても、何を見ればいいのか分からない。
 *
 * トップページには解説記事へのカードがあったが、
 * 記事を読みに行かないと分からない状態だったので、道具の中で説明する。
 *
 * 中身は実装(useFsrs.ts)と一致させること。数字を変えたらここも直す。
 */

const HIGHLIGHTS = [
  {
    term: '期限切れ',
    body: '「そろそろ忘れるころ」と見積もられたカード。ここから出すのがいちばん効率がよい。',
  },
  {
    term: '保持率',
    body: 'いま思い出せる見込み。100%に近いほど「まだ覚えている」。時間がたつほど下がる。',
  },
  {
    term: '目標保持率',
    body: 'どこまで下がったら復習するかの設定。設定タブで変えられる。',
  },
];

export default function FsrsExplainer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">この道具の考え方</CardTitle>
        <CardDescription>復習する日を、忘れかけたころに合わせて決めています。</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-base leading-relaxed text-[var(--color-text)]">
        <p>
          おぼえた内容は、時間がたつと思い出しにくくなります。
          だからといって毎日ぜんぶ見直すのは時間がかかりすぎますし、
          まだよく覚えているものを見ても復習にはなりません。
          <strong className="font-semibold text-[var(--color-text)]">
            少し迷うくらいのときに思い出す
          </strong>
          のが、いちばん記憶に残ります。
        </p>
        <p>
          そこでこの道具は、カードごとに「いつごろ忘れそうか」を見積もり、
          その手前で出します。この決め方を <strong className="font-semibold">FSRS</strong>（
          Free Spaced Repetition Scheduler）といいます。
        </p>

        <dl className="space-y-2 rounded-lg border bg-[var(--color-background)] p-4">
          {HIGHLIGHTS.map((item) => (
            <div key={item.term}>
              <dt className="font-semibold text-[var(--color-text)]">{item.term}</dt>
              <dd className="mt-0.5">{item.body}</dd>
            </div>
          ))}
        </dl>

        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-semibold text-[var(--color-text)]">
            採点ボタンの選び方
          </summary>
          <div className="mt-3 space-y-2">
            <p>
              答え合わせのあとに押すボタンで、次に出る時期が変わります。
              <strong className="font-semibold">正直に押すほど予定が自分に合ってきます。</strong>
              まちがえたことを気にして甘くつけると、覚えていないカードが出てこなくなります。
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong className="font-semibold">Unknown</strong>（1）… 思い出せなかった。すぐまた出る
              </li>
              <li>
                <strong className="font-semibold">Hard</strong>（2）… 思い出せたが時間がかかった。少し先
              </li>
              <li>
                <strong className="font-semibold">Good</strong>（3）… ふつうに思い出せた。ふつうに先
              </li>
              <li>
                <strong className="font-semibold">Easy</strong>（4）… すぐ出てきた。ずっと先
              </li>
            </ul>
          </div>
        </details>

        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-semibold text-[var(--color-text)]">
            目標保持率と試験日を変えるとどうなるか
          </summary>
          <div className="mt-3 space-y-2">
            <p>
              <strong className="font-semibold">目標保持率</strong>は 70〜97%
              のあいだで決められます（既定は90%）。
              高くするほど早めに復習がまわってくるので忘れにくくなりますが、
              1日にこなす枚数は増えます。低くすると枚数は減りますが、忘れる分も増えます。
              まずは既定のままで構いません。
            </p>
            <p>
              <strong className="font-semibold">試験日</strong>を入れると、
              復習の間隔がその日を飛び越えないように調整されます。
              「試験の前に一度も出てこないまま本番」を防ぐためのものです。
            </p>
          </div>
        </details>

        <p className="text-[var(--color-text-muted)]">
          忘却曲線や分散学習の背景をもっと詳しく知りたいときは、
          <a
            href="/guides/spaced-repetition-fsrs/"
            className="rounded text-[var(--color-accent)] underline underline-offset-4"
          >
            FSRSとは？暗記効率を上げる分散学習の仕組み
          </a>
          にまとめてあります。
        </p>
      </CardContent>
    </Card>
  );
}
