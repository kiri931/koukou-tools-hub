import { Badge } from "@/components/ui/badge";

import { computedPassRate, junior1Note, type LevelGuide } from "../data/levels";
import { terms as allTerms } from "../data/terms";
import { examRules, fields, levelLabels } from "../lib/fields";

/**
 * 級ごとの案内。
 *
 * **数値はすべて実測値**で、合格率と受験者数は協会の実施結果（第26〜30回）、
 * 出題型の内訳は5年分1125設問を自分で数えたもの。推定値は載せない。
 */
export default function GdLevelGuide({ guide }: { guide: LevelGuide }) {
  const total = guide.breakdown.term + guide.breakdown.statement;
  const termPercent = Math.round((guide.breakdown.term / total) * 100);
  const statementPercent = 100 - termPercent;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
        グラフィックデザイン検定
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
        {guide.label}で問われること
      </h1>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <Fact label="想定されている程度">{guide.standard}</Fact>
        <Fact label="試験の形">{guide.format}</Fact>
        <Fact label="解答のしかた">
          問1〜問{examRules.totalQuestions}のうち{examRules.answerQuestions}
          題を選んで解答（{examRules.answerQuestions * examRules.subQuestions}設問）。
          {examRules.answerQuestions + 1}題以上に手を付けると失格。
        </Fact>
        <Fact label="合格点">{examRules.passingScore}点以上</Fact>
      </dl>

      <div className="mt-8 space-y-4">
        {guide.character.map((paragraph) => (
          <p
            key={paragraph}
            className="text-base leading-relaxed text-slate-800 dark:text-slate-200"
          >
            <Emphasis text={paragraph} />
          </p>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="border-b border-slate-300 pb-2 text-2xl font-bold text-slate-900 dark:border-slate-800 dark:text-slate-50">
          設問の型（5年分{total}設問を数えた結果）
        </h2>

        <div className="mt-5">
          <div className="flex h-8 w-full overflow-hidden rounded border border-slate-400 dark:border-slate-600">
            <div
              className="flex items-center justify-center bg-sky-700 text-sm font-medium text-white"
              style={{ width: `${termPercent}%` }}
            >
              {termPercent}%
            </div>
            <div
              className="flex items-center justify-center bg-amber-600 text-sm font-medium text-white"
              style={{ width: `${statementPercent}%` }}
            >
              {statementPercent}%
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-base text-slate-800 dark:text-slate-200">
              <span
                aria-hidden="true"
                className="mr-2 inline-block h-3 w-3 rounded-sm bg-sky-700 align-middle"
              />
              <strong className="font-bold">用語型</strong> {guide.breakdown.term}設問 —
              説明文に当てはまる用語を4択から選ぶ
            </p>
            <p className="text-base text-slate-800 dark:text-slate-200">
              <span
                aria-hidden="true"
                className="mr-2 inline-block h-3 w-3 rounded-sm bg-amber-600 align-middle"
              />
              <strong className="font-bold">記述判定型</strong> {guide.breakdown.statement}設問 —
              4つの記述から選ぶ（正しいもの{guide.breakdown.correct}／間違っているもの
              {guide.breakdown.incorrect}）
            </p>
          </div>
          <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
            記述判定型では、<strong className="font-bold text-slate-900 dark:text-slate-50">
              「正しいもの」と「間違っているもの」のどちらを問われているか
            </strong>
            の読み落としが失点につながります。ドリルでは、この区別を問題文とは別の帯で出しています。
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="border-b border-slate-300 pb-2 text-2xl font-bold text-slate-900 dark:border-slate-800 dark:text-slate-50">
          実施結果（第26〜30回）
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-base">
            <thead>
              <tr className="border-b border-slate-400 dark:border-slate-600">
                <th scope="col" className="py-2 pr-4 text-left font-bold">
                  年度
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-bold">
                  受験者
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-bold">
                  合格者
                </th>
                <th scope="col" className="py-2 text-right font-bold">
                  合格率
                </th>
              </tr>
            </thead>
            <tbody>
              {guide.results.map((row) => (
                <tr key={row.exam} className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-2 pr-4">
                    {row.year}（第{row.exam}回）
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {row.examinees.toLocaleString("ja-JP")}名
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {row.passed.toLocaleString("ja-JP")}名
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums">
                    {row.passRate}%{row.note && <span className="ml-1 font-normal">※</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {guide.results.some((r) => r.note) && (
          <div className="mt-4 rounded-lg border border-amber-400 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950">
            <p className="text-base font-bold text-amber-950 dark:text-amber-100">
              ※ 報告書の数値が合わないところ
            </p>
            {guide.results
              .filter((r) => r.note)
              .map((r) => (
                <p
                  key={r.exam}
                  className="mt-1 text-base leading-relaxed text-amber-950 dark:text-amber-100"
                >
                  第{r.exam}回: {r.note}（このページは報告書の値をそのまま載せ、
                  計算し直した{computedPassRate(r)}%に書き換えてはいません）
                </p>
              ))}
          </div>
        )}
        {guide.level === "1" && (
          <p className="mt-4 rounded-lg border border-slate-300 bg-white p-4 text-base leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            合格率は実技を含んだ数字です。{junior1Note}
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="border-b border-slate-300 pb-2 text-2xl font-bold text-slate-900 dark:border-slate-800 dark:text-slate-50">
          分野ごとの用語の数
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
          用語辞典のうち、{guide.label}で出題が確かめられた語の数です。問数の配分と合わせて、
          どこから手を付けるかを決めてください。
        </p>
        <ul className="mt-4 space-y-3">
          {fields.map((field) => {
            const count = allTerms.filter(
              (t) => t.field === field.id && t.levels.includes(guide.level),
            ).length;
            return (
              <li key={field.id} className="flex flex-wrap items-center gap-3">
                <a
                  href={`/study/graphic-design/${field.id}/`}
                  className="text-base font-bold text-sky-800 underline underline-offset-4 hover:no-underline dark:text-sky-300"
                >
                  {field.label}
                </a>
                <Badge variant="secondary">問{field.questionNumbers.join("・問")}</Badge>
                <span className="text-base text-slate-700 dark:text-slate-300">{count}語</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12 rounded-lg border border-emerald-400 bg-emerald-50 p-6 dark:border-emerald-700 dark:bg-emerald-950">
        <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-100">
          {guide.label}に向けた進め方
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {guide.plan.map((step) => (
            <li
              key={step}
              className="text-base leading-relaxed text-emerald-950 dark:text-emerald-100"
            >
              {step}
            </li>
          ))}
        </ol>
      </section>

      <nav className="mt-10 flex flex-wrap gap-3">
        {(["3", "2", "1"] as const)
          .filter((l) => l !== guide.level)
          .map((l) => (
            <a
              key={l}
              href={`/study/graphic-design/level-${l}/`}
              className="min-h-11 rounded-full border border-slate-300 px-4 py-2 text-base text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {levelLabels[l]}のページ
            </a>
          ))}
        <a
          href="/study/graphic-design/"
          className="min-h-11 rounded-full border border-slate-300 px-4 py-2 text-base text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          分野ごとの解説へ
        </a>
      </nav>

      <p className="mt-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        受験者数・合格者数・合格率は、公益社団法人 全国工業高等学校長協会が公開している
        <a
          href="https://zenkoukyo.or.jp/index_kentei/exam_result/"
          target="_blank"
          rel="noreferrer noopener"
          className="mx-1 underline underline-offset-2 hover:no-underline"
        >
          検定試験の実施結果
        </a>
        に載っている数字です。設問の型の内訳は、同じ資料の第26〜30回の問題を数えたものです。
        問題そのものは掲載していません。
      </p>
    </main>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-base leading-relaxed text-slate-900 dark:text-slate-100">
        {children}
      </dd>
    </div>
  );
}

function Emphasis({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-bold text-slate-900 dark:text-slate-50">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
