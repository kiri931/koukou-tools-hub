import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";

import { terms as allTerms } from "../data/terms";
import type { Lesson, LessonFigure } from "../data/lessons/types";
import { getField, levelLabels } from "../lib/fields";
import type { GdTerm } from "../types";

const termById = new Map<string, GdTerm>(allTerms.map((t) => [t.id, t]));

/**
 * 図解の SVG を文字列として読み込み、ページに直接埋め込む。
 * **`<img>` で読まないこと。** 外部ファイルとして読むと SVG の currentColor が
 * ページの文字色を継承せず、テーマを手で切り替えたときに線が見えなくなる。
 */
const figureSources = import.meta.glob("../figures/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function figureSvg(fileName: string): string | undefined {
  const key = Object.keys(figureSources).find((path) => path.endsWith(`/${fileName}`));
  return key ? figureSources[key] : undefined;
}

/**
 * 分野の解説を読む画面。
 *
 * 本文中の `[[term-id]]` は、押すと定義が開くボタンになる。
 * **用語辞典へページ遷移させない**（読んでいる途中で飛ばすと戻ってこないため。仕様書 §6.1）。
 * 定義は文の途中ではなく、**その段落の下**に開く。文の途中に差し込むと
 * 「ページ番号は ノンブル ［定義］ 、章や書名を…」と文が割れて読めなくなる。
 */
export default function GdLesson({ lesson }: { lesson: Lesson }) {
  const field = getField(lesson.field);
  const used = useMemo(() => collectTermIds(lesson), [lesson]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
        グラフィックデザイン検定
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
        {field.label}
      </h1>
      <p className="mt-3 text-base text-slate-700 dark:text-slate-300">{lesson.scope}</p>

      <div className="mt-6 space-y-4">
        {lesson.intro.map((paragraph) => (
          <Paragraph key={paragraph} text={paragraph} />
        ))}
      </div>

      {lesson.sections.map((section) => (
        <section key={section.heading} className="mt-14">
          <h2 className="border-b border-slate-300 pb-2 text-2xl font-bold text-slate-900 dark:border-slate-800 dark:text-slate-50">
            {section.heading}
          </h2>
          <div className="mt-5 space-y-4">
            {section.paragraphs.map((paragraph) => (
              <Paragraph key={paragraph} text={paragraph} />
            ))}
          </div>
          {section.figure && <Figure figure={section.figure} />}
        </section>
      ))}

      <section className="mt-14 rounded-lg border border-amber-400 bg-amber-50 p-6 dark:border-amber-700 dark:bg-amber-950">
        <h2 className="text-xl font-bold text-amber-950 dark:text-amber-100">
          取り違えやすいところ
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {lesson.pitfalls.map((pitfall) => (
            <li
              key={pitfall}
              className="text-base leading-relaxed text-amber-950 dark:text-amber-100"
            >
              {renderInline(pitfall, () => {})}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm text-slate-600 dark:text-slate-400">
        この解説で扱った用語は{used.length}語です。すべて
        <a
          href="/study/graphic-design/glossary/"
          className="mx-1 underline underline-offset-2 hover:no-underline"
        >
          用語辞典
        </a>
        にも載っています。
      </p>

      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        出題の傾向は、公益社団法人 全国工業高等学校長協会が公開している
        <a
          href="https://zenkoukyo.or.jp/index_kentei/exam_result/"
          target="_blank"
          rel="noreferrer noopener"
          className="mx-1 underline underline-offset-2 hover:no-underline"
        >
          検定試験の実施結果
        </a>
        （第26〜30回）をもとにしています。このページの文章と例はすべて書き下ろしたもので、
        過去問そのものは掲載していません。
      </p>
    </main>
  );
}

function Figure({ figure }: { figure: LessonFigure }) {
  const svg = figureSvg(figure.src);
  if (!svg) return null;
  return (
    <figure className="mt-6">
      <div
        role="img"
        aria-label={figure.alt}
        // 線と文字は currentColor。ここで文字色を決めるので、
        // ライトでもダークでも背景とのコントラストが保たれる
        className="w-full overflow-x-auto rounded-lg border border-slate-300 bg-white p-4 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {figure.caption}
      </figcaption>
    </figure>
  );
}

/** 1段落と、その下に開く用語の定義。 */
function Paragraph({ text }: { text: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = openId ? termById.get(openId) : undefined;

  return (
    <div>
      <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200">
        {renderInline(text, (id) => setOpenId((current) => (current === id ? null : id)), openId)}
      </p>
      {open && <TermPanel term={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

/** `[[term-id]]` を用語ボタンに、`**…**` を太字にする。 */
function renderInline(text: string, onToggle: (id: string) => void, openId?: string | null) {
  return text.split(/(\[\[[a-z0-9-]+\]\]|\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith("[[") && part.endsWith("]]")) {
      const id = part.slice(2, -2);
      const term = termById.get(id);
      // 用語が消えたときに本文から文字が丸ごと消えないよう、id をそのまま出す
      if (!term) return <span key={i}>{id}</span>;
      return (
        <button
          key={i}
          type="button"
          onClick={() => onToggle(id)}
          aria-expanded={openId === id}
          className="rounded font-bold text-sky-800 underline decoration-dotted underline-offset-4 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-950"
        >
          {term.term}
        </button>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-slate-50">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function TermPanel({ term, onClose }: { term: GdTerm; onClose: () => void }) {
  return (
    <div className="mt-3 rounded-lg border border-sky-300 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-bold text-slate-900 dark:text-slate-50">{term.term}</span>
        <span className="text-sm text-slate-600 dark:text-slate-400">{term.reading}</span>
        {term.levels.map((l) => (
          <Badge key={l} variant="outline">
            {levelLabels[l]}で出題
          </Badge>
        ))}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto min-h-11 rounded px-2 text-sm text-slate-700 underline underline-offset-2 hover:no-underline dark:text-slate-300"
        >
          閉じる
        </button>
      </div>
      <p className="mt-1 text-base leading-relaxed text-slate-900 dark:text-slate-100">
        {term.short}
      </p>
      {term.body && (
        <p className="mt-1 text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {term.body.replaceAll("**", "")}
        </p>
      )}
    </div>
  );
}

function collectTermIds(lesson: Lesson): string[] {
  const text = [
    ...lesson.intro,
    ...lesson.sections.flatMap((s) => s.paragraphs),
    ...lesson.pitfalls,
  ].join(" ");
  return [...new Set([...text.matchAll(/\[\[([a-z0-9-]+)\]\]/g)].map((m) => m[1]))];
}
