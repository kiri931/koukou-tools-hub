import { useEffect, useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { compareAnswers } from "../lib/equivalence";
import {
  appendHistory,
  clearHistory,
  formatRecord,
  loadHistory,
  pendingWrongIds,
  type AttemptRecord,
} from "../lib/history";
import {
  DEFAULT_COUNT,
  MAX_COUNT,
  clampQuestionCount,
  feedbackMessage,
  pickQuestions,
  pickQuestionsByIds,
} from "../lib/quiz";
import type { RenderedQuestion } from "../types";
import MathLiveInput from "./MathLiveInput";
import PrintSheet from "./PrintSheet";

function renderMath(tex: string) {
  return katex.renderToString(tex, {
    throwOnError: false,
    strict: "ignore",
    output: "html",
  });
}

function renderInlineMixed(text: string) {
  const parts: string[] = [];
  let matched = false;
  let lastIndex = 0;
  const regex = /\\\((.+?)\\\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    matched = true;
    const [raw, math] = match;
    const start = match.index;
    if (start > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, start)));
    }
    parts.push(renderMath(math));
    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)));
  }

  if (!matched) {
    return escapeHtml(text);
  }

  return parts.join("");
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderInlineMixed(text), [text]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function MathChoice({ text }: { text: string }) {
  const html = useMemo(() => renderMath(text), [text]);
  return <span className="equation-choice-katex" dangerouslySetInnerHTML={{ __html: html }} />;
}

function parseFracBraces(s: string, start: number): [string, string, number] | null {
  let i = start;
  let depth = 1;

  while (i < s.length) {
    const ch = s[i];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) break;
    i += 1;
  }

  if (depth !== 0) return null;
  const numerator = s.slice(start, i);
  if (s[i + 1] !== "{") return null;

  let j = i + 2;
  depth = 1;
  while (j < s.length) {
    const ch = s[j];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) break;
    j += 1;
  }

  if (depth !== 0) return null;
  const denominator = s.slice(i + 2, j);
  return [numerator, denominator, j + 1];
}

function stripOuterParens(s: string) {
  const hasTopLevelAddSub = (expr: string) => {
    let depth = 0;
    for (let i = 0; i < expr.length; i += 1) {
      const ch = expr[i];
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      else if (depth === 0 && (ch === "+" || ch === "-")) return true;
    }
    return false;
  };

  const isWrappedBySingleOuterParens = (expr: string) => {
    if (!(expr.startsWith("(") && expr.endsWith(")"))) return false;
    let depth = 0;
    for (let i = 0; i < expr.length; i += 1) {
      const ch = expr[i];
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      if (depth === 0 && i < expr.length - 1) return false;
    }
    return depth === 0;
  };

  let prev = "";
  let next = s;
  while (next !== prev) {
    prev = next;

    if (isWrappedBySingleOuterParens(next)) {
      const inner = next.slice(1, -1);
      if (!hasTopLevelAddSub(inner)) {
        next = inner;
        continue;
      }
    }

    next = next.replace(/\(([A-Za-z0-9^]+)\)/g, "$1");
  }

  return next;
}

function normalizeAnswer(s: string) {
  const convertFracs = (value: string): string => {
    let out = "";
    for (let i = 0; i < value.length; ) {
      if (value.startsWith("\\frac{", i)) {
        const parsed = parseFracBraces(value, i + "\\frac{".length);
        if (!parsed) {
          out += value[i];
          i += 1;
          continue;
        }
        const [num, den, nextIndex] = parsed;
        out += `(${convertFracs(num)})/(${convertFracs(den)})`;
        i = nextIndex;
        continue;
      }
      out += value[i];
      i += 1;
    }
    return out;
  };

  let next = s.replace(/\s+/g, "");
  next = next.replace(/\\(?:d|t)frac\{/g, "\\frac{");
  next = next.replace(/\\left/g, "").replace(/\\right/g, "");
  next = convertFracs(next);
  next = next.replace(/\^\{([^{}]+)\}/g, "^$1");
  next = stripOuterParens(next);
  return next;
}

interface InputVerdict {
  correct: boolean;
  /** 不正解の理由が「書き方」にあるときだけ、生徒に伝える一言 */
  note?: string;
  /** 正解だが、模範解答とは違う書き方だった */
  differsFromModel?: boolean;
}

/**
 * 記述式の1問を判定する。
 * 式として読めたときは数学的に等しいかで決め、読めなかったときだけ
 * 従来の文字列一致（normalizeAnswer）に任せる。
 */
function judgeInputAnswer(given: string, answer: string): InputVerdict {
  if (!given.trim()) return { correct: false };

  const result = compareAnswers(given, answer);
  switch (result.kind) {
    case "equivalent":
      // 値は合っているが模範解答と書き方が違うときは、正解にしたうえで模範解答も見せる
      return {
        correct: true,
        differsFromModel: normalizeAnswer(given) !== normalizeAnswer(answer),
      };
    case "different":
      return { correct: false };
    case "wrong-subject":
      return {
        correct: false,
        note: `${result.expected} について解いた形（${result.expected}= …）で答えてください。`,
      };
    case "unparsable":
    default: {
      const correct = normalizeAnswer(given) === normalizeAnswer(answer);
      if (correct) return { correct: true };
      if (!given.includes("=")) {
        return { correct: false, note: "求める文字から「= 」で続けて書いてください。" };
      }
      return { correct: false };
    }
  }
}

export default function EquationTransformation() {
  type QuizMode = "choice" | "input";
  const [questionCountInput, setQuestionCountInput] = useState(String(DEFAULT_COUNT));
  const [items, setItems] = useState<RenderedQuestion[]>(() => pickQuestions(DEFAULT_COUNT));
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [graded, setGraded] = useState(false);
  const [score, setScore] = useState(0);
  const [printSheetOpen, setPrintSheetOpen] = useState(false);
  const [mode, setMode] = useState<QuizMode>("choice");
  const [history, setHistory] = useState<AttemptRecord[]>([]);

  // localStorage はブラウザにしか無いので、描画後に読む
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const total = items.length;
  const wrongIds = useMemo(() => pendingWrongIds(history), [history]);

  const clearAnswers = () => {
    setAnswers({});
    setGraded(false);
    setScore(0);
  };

  const reloadQuestions = () => {
    const count = clampQuestionCount(questionCountInput);
    // 押した時点で丸めた値を欄にも書き戻す。表示と実際の問題数がずれないようにする
    setQuestionCountInput(String(count));
    setItems(pickQuestions(count));
    clearAnswers();
  };

  const retryWrongQuestions = () => {
    const picked = pickQuestionsByIds(wrongIds);
    if (picked.length === 0) return;
    setItems(picked);
    setQuestionCountInput(String(picked.length));
    clearAnswers();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetAnswers = () => {
    clearAnswers();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const gradeAnswers = () => {
    let correct = 0;
    const wrong: number[] = [];

    for (const item of items) {
      const given = answers[item.id];
      const isRight =
        !!given &&
        (mode === "choice" ? given === item.answer : judgeInputAnswer(given, item.answer).correct);
      if (isRight) correct += 1;
      else wrong.push(item.id);
    }

    setScore(correct);
    setGraded(true);
    setHistory(appendHistory({ at: Date.now(), mode, total, correct, wrongIds: wrong }));
  };

  const forgetHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const resultVisible = graded && total > 0;
  const feedback = resultVisible ? feedbackMessage(score, total) : "";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-slate-100">
      <style>{`
        @media print {
          /* サイトのヘッダー・フッター（運営者情報などのリンク）は配布物に要らない */
          header, footer, .no-print, [data-theme-toggle] { display: none !important; }
          [data-slot="sheet-portal"], [data-slot="sheet-overlay"], [data-slot="sheet-content"] { display: none !important; }
          /* 画面用の薄い背景色は紙では要らない（インクの無駄になる） */
          body, body > div, .min-h-screen { background: #fff !important; }
          .print-root { max-width: none !important; padding: 0 !important; }

          /* 見出しカードは、紙では枠も説明文も要らない */
          .print-title {
            border: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            gap: 0 !important;
            padding: 0 !important;
            margin: 0 0 3mm 0 !important;
          }
          .print-title [data-slot="card-header"] { padding: 0 !important; }
          .print-title [data-slot="card-description"] { display: none !important; }

          /* 画面用の余白・影・角丸・背景は紙では邪魔なので落として詰める */
          .print-card {
            box-shadow: none !important;
            border-color: #94a3b8 !important;
            border-radius: 0 !important;
            background: #fff !important;
            break-inside: avoid;
            gap: 1.5mm !important;
            padding: 2.5mm 3mm !important;
            margin: 0 0 2.5mm 0 !important;
          }
          .print-card [data-slot="card-header"],
          .print-card [data-slot="card-content"] {
            padding: 0 !important;
            gap: 1.5mm !important;
          }

          /* 選択肢は4つあるので2列に並べる。1問あたりの高さが半分になる */
          .equation-choices {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 1mm 4mm !important;
          }
          .equation-choices label {
            border-radius: 0 !important;
            border-color: #cbd5e1 !important;
            background: #fff !important;
            padding: 1mm 2mm !important;
          }

          /* 氏名欄は用紙の先頭に1回だけ。position:fixed だと本文に重なる */
          .print-student-info { display: none !important; }
          body.print-show-student-info .print-student-info {
            display: block !important;
            margin: 0 0 3mm 0;
            padding-bottom: 1.5mm;
            border-bottom: 1px solid #94a3b8;
            font-size: 10.5pt;
            color: #0f172a;
          }

          .print-answer { display: none !important; }
          .print-explain { display: none !important; }
          body.print-show-answers .print-answer { display: block !important; }
          body.print-show-explain .print-explain { display: block !important; }
          .katex { color: #000 !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      <div className="print-root">
        <PrintSheet open={printSheetOpen} onOpenChange={setPrintSheetOpen} />

        {/* 印刷時だけ、用紙の先頭に出す */}
        <p className="print-student-info hidden">
          等式の変形テスト ／ 氏名：__________________ ／ 学年：____ 組：____ 番：____
        </p>
        <Card className="print-title mb-6 border-emerald-200/80 bg-white/95 dark:border-emerald-900/40 dark:bg-slate-900/70">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">等式の変形テスト</CardTitle>
                <CardDescription>問題バンクからランダム出題（既定10問）</CardDescription>
              </div>            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="no-print">
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  setMode(v as QuizMode);
                  setAnswers({});
                  setGraded(false);
                  setScore(0);
                }}
              >
                <TabsList className="w-64">
                  <TabsTrigger value="choice">択一式</TabsTrigger>
                  <TabsTrigger value="input">記述式</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {mode === "input" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-base dark:border-slate-800 dark:bg-slate-950/50">
                <h2 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">
                  記述式の答え方
                </h2>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                  <li>入力欄をタップ／クリックすると数式キーボードが出ます</li>
                  <li>
                    求める文字から <span className="font-mono">x=</span> のように書いてください
                  </li>
                  <li>
                    値が同じなら正解です。項の順序を変えた形・展開した形・通分した形・小数で書いた形も正解になります
                  </li>
                </ul>
              </div>
            )}

            {history.length > 0 && (
              <div className="no-print rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold text-slate-700 dark:text-slate-200">
                    この端末に残っている記録
                  </h2>
                  <Button type="button" variant="ghost" size="sm" onClick={forgetHistory}>
                    記録を消す
                  </Button>
                </div>
                <ul className="space-y-1 text-base tabular-nums text-slate-700 dark:text-slate-300">
                  {history.map((record) => (
                    <li key={record.at}>{formatRecord(record)}</li>
                  ))}
                </ul>
                {wrongIds.length > 0 && (
                  <Button type="button" className="mt-3" onClick={retryWrongQuestions}>
                    間違えた {wrongIds.length} 問をもう一度
                  </Button>
                )}
              </div>
            )}

            <div className="no-print flex flex-col gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-end">
              <div className="w-full sm:w-44">
                <label htmlFor="equation-count" className="mb-1 block text-base font-medium">
                  出題数（1〜{MAX_COUNT}）
                </label>
                <Input
                  id="equation-count"
                  type="number"
                  min={1}
                  max={MAX_COUNT}
                  value={questionCountInput}
                  onChange={(event) => setQuestionCountInput(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={reloadQuestions}>
                  出題を更新
                </Button>
                <Button type="button" variant="outline" onClick={() => setPrintSheetOpen(true)}>
                  印刷（A4）
                </Button>
              </div>
            </div>

            {resultVisible && (
              <div className="no-print rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {score} / {total}
                  </Badge>
                  <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                    正解率 {Math.round((score / total) * 100)}%
                  </span>
                </div>
                <p className="text-base text-slate-700 dark:text-slate-300">{feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <section className="space-y-4">
          {items.map((item, index) => {
            const selected = answers[item.id];
            const verdict =
              graded && mode === "input" && selected
                ? judgeInputAnswer(selected, item.answer)
                : null;
            const isCorrect =
              graded &&
              (mode === "choice" ? selected === item.answer : !!verdict && verdict.correct);

            return (
              <Card
                key={`${item.id}-${index}`}
                className="print-card gap-4 border-slate-200 bg-white/95 py-4 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <CardHeader className="gap-3 px-4 pb-0 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">Q{index + 1}</CardTitle>
                    {graded && (
                      <Badge
                        variant={isCorrect ? "default" : "destructive"}
                        className={cn(isCorrect ? "bg-emerald-600 hover:bg-emerald-600" : "")}
                      >
                        {isCorrect ? "正解" : "不正解"}
                      </Badge>
                    )}
                  </div>
                  <MathText text={item.prompt} className="leading-7 text-slate-800 dark:text-slate-100" />
                </CardHeader>

                <CardContent className="px-4 sm:px-6">
                  {mode === "choice" && (
                    <RadioGroup
                      value={selected ?? ""}
                      onValueChange={(value) => setAnswers((prev) => ({ ...prev, [item.id]: value }))}
                      className="equation-choices gap-2"
                    >
                      {item.shuffledChoices.map((choice, choiceIndex) => {
                        const isPicked = selected === choice;
                        const showCorrect = graded && choice === item.answer;
                        const showWrong = graded && isPicked && choice !== item.answer;

                        return (
                          <label
                            key={`${item.id}-${choice}-${choiceIndex}`}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-base transition",
                              "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50",
                              showCorrect &&
                                "border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30",
                              showWrong &&
                                "border-rose-300 bg-rose-50/80 dark:border-rose-800 dark:bg-rose-950/30"
                            )}
                          >
                            <RadioGroupItem value={choice} disabled={graded} className="mt-1" />
                            <MathChoice text={choice} />
                          </label>
                        );
                      })}
                    </RadioGroup>
                  )}

                  {mode === "input" && (
                    <div className="space-y-2">
                      <MathLiveInput
                        placeholder="例: x=(5y-7)/3"
                        value={selected ?? ""}
                        disabled={graded}
                        onChange={(latex) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [item.id]: latex,
                          }))
                        }
                        className={cn(
                          graded &&
                            isCorrect &&
                            "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100",
                          graded &&
                            !isCorrect &&
                            selected &&
                            "border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-100"
                        )}
                      />
                    </div>
                  )}

                  {graded && (mode === "input" || selected) && !isCorrect && (
                    <div className="no-print mt-3 space-y-1 text-base">
                      {mode === "input" && selected && (
                        <p className="text-rose-700 dark:text-rose-300">
                          あなたの解答: <MathChoice text={selected} />
                        </p>
                      )}
                      {verdict?.note && (
                        <p className="text-rose-700 dark:text-rose-300">{verdict.note}</p>
                      )}
                      <p className="text-rose-700 dark:text-rose-300">
                        正解: <MathChoice text={item.answer} />
                      </p>
                    </div>
                  )}

                  {graded && isCorrect && mode === "input" && selected && (
                    <div className="no-print mt-3 space-y-1 text-base text-emerald-700 dark:text-emerald-300">
                      <p>
                        正解！ <MathChoice text={selected} />
                      </p>
                      {verdict?.differsFromModel && (
                        <p className="text-slate-600 dark:text-slate-400">
                          値が同じなので正解です。模範解答は <MathChoice text={item.answer} />{" "}
                          でした。見比べてみてください。
                        </p>
                      )}
                    </div>
                  )}

                  <p className="print-answer hidden mt-3 text-base text-slate-700">
                    解答: <MathChoice text={item.answer} />
                  </p>

                  <details
                    className="no-print mt-4 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50"
                    open={graded}
                  >
                    <summary className="cursor-pointer text-base font-medium text-slate-700 dark:text-slate-200">
                      解説
                    </summary>
                    <MathText
                      text={item.explain}
                      className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300"
                    />
                  </details>

                  <div className="print-explain hidden mt-4 rounded-lg border border-slate-200 bg-white p-3 text-base leading-7 text-slate-700">
                    <p className="mb-2 font-medium">解説</p>
                    <MathText text={item.explain} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* 解き終わる場所にも採点を置く。上のボタン群は問題を解ききると画面外に出る */}
        <div className="mb-6 mt-4 flex flex-wrap gap-2 print:hidden">
          <Button type="button" onClick={gradeAnswers}>
            採点する
          </Button>
          <Button type="button" variant="outline" onClick={resetAnswers}>
            やり直し
          </Button>
          <Button type="button" variant="outline" onClick={reloadQuestions}>
            別の問題に変える
          </Button>
        </div>

        {/* 使い方とFAQは、解き終わった人だけが読めばよいので畳んでおく */}
        <details className="no-print mb-6 rounded-lg border border-slate-300 bg-white/95 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <summary className="cursor-pointer text-lg font-semibold text-slate-900 dark:text-slate-100">
            使い方とよくある質問
          </summary>
          <div className="mt-4 space-y-5 text-base text-slate-700 dark:text-slate-300">
            <ol className="list-decimal space-y-1 pl-5">
              <li>出題数と方式（択一式 / 記述式）を選ぶ</li>
              <li>出題される問題に解答する（記述式は数式入力キーボード対応）</li>
              <li>「採点する」で正答率と解説を確認する</li>
              <li>「出題を更新」でランダムに新しい問題へ切り替え、「印刷」でA4プリントとして配布する</li>
            </ol>

            <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <h2 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">
                この単元とのつながり
              </h2>
              <p>
                等式の変形は、プログラミングでの変数への代入や条件式の整理、シミュレーションのパラメータ計算など、
                情報I・情報IIでプログラムを書く際の土台になります。検定対策の計算問題にも直結します。
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">よくある質問</h2>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Q. 採点後にもう一度同じ問題を解き直せますか?
                </p>
                <p>「やり直し」ボタンから同じ問題セットに再挑戦できます。</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Q. 間違えた問題だけをもう一度解けますか?
                </p>
                <p>
                  採点すると、この端末のブラウザの中だけに直近5回ぶんの記録が残ります。記録があるときは
                  「間違えた◯問をもう一度」のボタンが出ます。記録はいつでも「記録を消す」で消せます。
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Q. 記述式は、書き方が違うと不正解になりますか?
                </p>
                <p>
                  なりません。式の値が同じかどうかで判定するので、項の順序を変えた形・展開した形・
                  通分した形・小数で書いた形も正解になります。ただし
                  <span className="font-mono">x=</span> のように、求める文字から書いてください。
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Q. 印刷して配布に使えますか?
                </p>
                <p>
                  「印刷」ボタンからA4サイズ想定でレイアウトされたプリントを出力できます。小テストや宿題プリントとして利用できます。
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Q. 記述式と択一式はどちらがおすすめですか?
                </p>
                <p>
                  初めての単元は択一式で概念をつかみ、慣れてきたら記述式で計算力を鍛える、という使い分けがおすすめです。
                </p>
              </div>
            </div>
          </div>
        </details>

      </div>
    </main>
  );
}
