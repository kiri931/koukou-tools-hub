import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { questions as allQuestions } from "../data/questions";
import { terms as allTerms } from "../data/terms";
import { pickQuestions, polarityBanner, shuffleChoices } from "../lib/drill";
import { fields, levelLabels, levels as allLevels } from "../lib/fields";
import type { FieldId, GdQuestion, Level } from "../types";

/**
 * 分野別ドリルと復習。
 *
 * **1問ごとに正誤と解説を出す**軽い練習用で、模擬試験（15題から10題選ぶ本番形式）とは別。
 * 間違えた問題の id はこの端末の localStorage にだけ残す。サーバへ送らない。
 */

const WRONG_KEY = "gd-kentei-wrong-ids";
const CHOICE_LABELS = ["Ａ", "Ｂ", "Ｃ", "Ｄ"] as const;

type Mode = "field" | "review";

export default function GdDrill() {
  const [field, setField] = useState<FieldId | "all">("all");
  const [level, setLevel] = useState<Level | "all">("all");
  const [mode, setMode] = useState<Mode>("field");
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [session, setSession] = useState<GdQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    setWrongIds(loadWrongIds());
  }, []);

  const available = useMemo(
    () =>
      allQuestions.filter(
        (q) =>
          (field === "all" || q.field === field) && (level === "all" || q.level === level),
      ).length,
    [field, level],
  );

  const start = useCallback(() => {
    const chosen = pickQuestions(allQuestions, {
      field: field === "all" ? undefined : field,
      level: level === "all" ? undefined : level,
      count: 10,
      wrongIds: mode === "review" ? wrongIds : [],
    });
    const target =
      mode === "review" ? chosen.filter((q) => wrongIds.includes(q.id)) : chosen;
    setSession(target.map((q) => shuffleChoices(q)));
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
  }, [field, level, mode, wrongIds]);

  if (!session) {
    return (
      // 見出し（h1）と説明はページ側（Astro の PageHead）が SSR で出す。<main> もページ側。
      <div>
        <div className="space-y-5">
          <Picker label="出題の種類">
            <Chip active={mode === "field"} onClick={() => setMode("field")}>
              分野別ドリル
            </Chip>
            <Chip
              active={mode === "review"}
              onClick={() => setMode("review")}
              disabled={wrongIds.length === 0}
            >
              まちがい直し（{wrongIds.length}問）
            </Chip>
          </Picker>

          <Picker label="分野">
            <Chip active={field === "all"} onClick={() => setField("all")}>
              すべて
            </Chip>
            {fields.map((f) => (
              <Chip key={f.id} active={field === f.id} onClick={() => setField(f.id)}>
                {f.label}
              </Chip>
            ))}
          </Picker>

          <Picker label="級">
            <Chip active={level === "all"} onClick={() => setLevel("all")}>
              すべて
            </Chip>
            {allLevels.map((l) => (
              <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
                {levelLabels[l]}
              </Chip>
            ))}
          </Picker>
        </div>

        <p className="mt-6 text-base">
          この条件で出せる問題は{available}問です。ここから最大10問を出します。
        </p>

        <Button
          onClick={start}
          disabled={available === 0 || (mode === "review" && wrongIds.length === 0)}
          className="mt-4 min-h-12 px-6 text-base"
        >
          はじめる
        </Button>

        {wrongIds.length > 0 && (
          <p className="mt-8 text-base text-[var(--color-text-muted)]">
            まちがえた問題は、この端末の中にだけ残しています（サーバへは送りません）。
            <button
              type="button"
              onClick={() => {
                saveWrongIds([]);
                setWrongIds([]);
              }}
              className="ml-2 min-h-11 underline underline-offset-2 hover:no-underline"
            >
              記録を消す
            </button>
          </p>
        )}
      </div>
    );
  }

  if (session.length === 0) {
    return (
      <Finished
        correct={0}
        total={0}
        onRestart={() => setSession(null)}
        message="この条件に合う問題がありませんでした。分野か級の絞り込みを外してみてください。"
      />
    );
  }

  if (index >= session.length) {
    return (
      <Finished correct={correctCount} total={session.length} onRestart={() => setSession(null)} />
    );
  }

  const question = session[index];
  const banner = polarityBanner(question);
  const answered = picked !== null;
  const isCorrect = picked === question.answer;

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === question.answer) {
      setCorrectCount((c) => c + 1);
      const next = wrongIds.filter((id) => id !== question.id);
      saveWrongIds(next);
      setWrongIds(next);
    } else if (!wrongIds.includes(question.id)) {
      const next = [...wrongIds, question.id];
      saveWrongIds(next);
      setWrongIds(next);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-base font-bold">
          {index + 1} / {session.length}問
        </p>
        <Badge variant="secondary">{fields.find((f) => f.id === question.field)?.label}</Badge>
        <Badge variant="outline">{levelLabels[question.level]}</Badge>
      </div>

      {banner && (
        <p className="mt-4 rounded-lg border-2 border-[var(--color-warning)] bg-[var(--kj-notice-bg)] px-4 py-3 text-base font-bold text-[var(--color-text)]">
          この問題は「{banner}」問題です
        </p>
      )}

      {/* ページの h1 はツール名。問題文は画面ごとに変わるので h2 にする */}
      <h2 className="mt-4 text-xl leading-relaxed font-bold">{question.stem}</h2>

      <ul className="mt-5 space-y-3">
        {question.choices.map((choice, i) => {
          const state = !answered
            ? "idle"
            : i === question.answer
              ? "correct"
              : i === picked
                ? "wrong"
                : "idle";
          return (
            <li key={choice}>
              <button
                type="button"
                onClick={() => choose(i)}
                disabled={answered}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left text-base leading-relaxed transition-colors",
                  state === "idle" &&
                    "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]",
                  state === "correct" &&
                    "border-[var(--color-success)] bg-[var(--kj-success-soft)] text-[var(--color-text)]",
                  state === "wrong" &&
                    "border-[var(--color-danger)] bg-[var(--kj-danger-soft)] text-[var(--color-text)]",
                )}
              >
                <span className="font-bold">{CHOICE_LABELS[i]}</span>
                <span className="flex-1">{choice}</span>
                {/* 色だけでなく文字でも正誤を示す */}
                {state === "correct" && <span className="font-bold">正解</span>}
                {state === "wrong" && <span className="font-bold">これを選んだ</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p
            className={cn(
              "text-lg font-bold",
              isCorrect ? "text-[var(--color-success)]" : "text-[var(--color-danger)]",
            )}
          >
            {isCorrect ? "正解" : "まちがい"}
          </p>
          <p className="mt-2 text-base leading-relaxed">
            {question.explanation}
          </p>
          {question.termIds.length > 0 && (
            <p className="mt-3 text-base text-[var(--color-text-muted)]">
              関係する用語:{" "}
              {question.termIds
                .map((id) => allTerms.find((t) => t.id === id)?.term)
                .filter(Boolean)
                .join("、")}
              <span aria-hidden="true"> / </span>
              <a
                href={`/study/graphic-design/${question.field}/`}
                className="text-[var(--color-accent)] underline underline-offset-2 hover:no-underline"
              >
                この分野の解説を読む
              </a>
            </p>
          )}
          <Button
            onClick={() => {
              setIndex((i) => i + 1);
              setPicked(null);
            }}
            className="mt-5 min-h-12 px-6 text-base"
          >
            {index + 1 === session.length ? "結果を見る" : "次の問題へ"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Finished({
  correct,
  total,
  onRestart,
  message,
}: {
  correct: number;
  total: number;
  onRestart: () => void;
  message?: string;
}) {
  return (
    <div>
      {/* ページの h1 はツール名なので、結果の見出しは h2 */}
      <h2 className="text-2xl font-bold">おつかれさまでした</h2>
      {message ? (
        <p className="mt-4 text-base leading-relaxed">
          {message}
        </p>
      ) : (
        <p className="mt-4 text-lg">
          {total}問中 <strong className="text-2xl font-bold">{correct}</strong> 問正解（
          {total === 0 ? 0 : Math.round((correct / total) * 100)}点）
        </p>
      )}
      <Button onClick={onRestart} className="mt-6 min-h-12 px-6 text-base">
        条件を選び直す
      </Button>
    </div>
  );
}

function Picker({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-base font-bold">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "min-h-11 rounded-full border px-4 text-base transition-colors disabled:opacity-50",
        active
          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]",
      )}
    >
      {children}
    </button>
  );
}

function loadWrongIds(): string[] {
  try {
    const raw = localStorage.getItem(WRONG_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    // プライベートウィンドウなどで読めないことがある。空として続ける
    return [];
  }
}

function saveWrongIds(ids: string[]) {
  try {
    localStorage.setItem(WRONG_KEY, JSON.stringify(ids));
  } catch {
    // 保存できなくても練習そのものは続けられる
  }
}
