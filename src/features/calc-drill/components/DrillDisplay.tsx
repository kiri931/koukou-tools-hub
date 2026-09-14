import { useMemo, useState } from 'react';
import { BUTTON_ROWS } from '@/features/scientific-calculator/components/CalcKeypad';
import type { AngleMode } from '@/features/scientific-calculator/types';
import { roundingLabel, type DrillProblem } from '../types';
import MathText from '@/features/scientific-calculator/components/MathText';

/** action からキーの表示名を引くための表。「つぎに押すキー」に出す。 */
const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  BUTTON_ROWS.flat().flatMap((button) => {
    const entries: [string, string][] = [[button.action, button.label]];
    if (button.shiftAction) entries.push([button.shiftAction, button.shiftLabel ?? button.label]);
    return entries;
  })
);

/*
 * この帯は常に暗い下地なので、明暗が切り替わる共通ボタンは使わない。
 * 実測: もう一度 = zinc-100 文字 / zinc-700 面 で 9.50:1、枠 zinc-400 は帯に対し 5.81:1。
 *       次の問題 = zinc-900 文字 / emerald-400 面 で 9.22:1、面は帯に対し 7.75:1。
 */
const SECONDARY_BUTTON =
  'shrink-0 rounded-md border border-zinc-400 bg-zinc-700 px-3 py-1.5 text-base font-semibold text-zinc-100 hover:bg-zinc-600';
const PRIMARY_BUTTON =
  'shrink-0 rounded-md bg-emerald-400 px-3 py-1.5 text-base font-bold text-zinc-900 hover:bg-emerald-300';

interface DrillDisplayProps {
  problem: DrillProblem;
  problemNumber: number;
  totalProblems: number;
  stepIndex: number;
  totalSteps: number;
  isDone: boolean;
  expression: string;
  result: string;
  hasError: boolean;
  angleMode: AngleMode;
  shiftActive: boolean;
  requiredAction: string | null;
  wrongKeyHint: string | null;
  onRetry: () => void;
  onNext: () => void;
}

/**
 * 問題文・入力中の式・答え・つぎに押すキーを1枚にまとめた表示。
 * 「つぎに押すキー」を一番下に置くのは、この真下にキーパッドが来るため。
 * 目線の移動を最短にするのがこの並びの目的なので、順番を入れ替えないこと。
 */
export default function DrillDisplay({
  problem,
  problemNumber,
  totalProblems,
  stepIndex,
  totalSteps,
  isDone,
  expression,
  result,
  hasError,
  angleMode,
  shiftActive,
  requiredAction,
  wrongKeyHint,
  onRetry,
  onNext,
}: DrillDisplayProps) {
  const [questionExpanded, setQuestionExpanded] = useState(false);
  const rounding = roundingLabel(problem.rounding);

  const nextKeyLabel = requiredAction ? ACTION_LABELS[requiredAction] ?? requiredAction : null;
  const nextKeyNote = useMemo(() => {
    if (requiredAction === 'toggle-angle') return `まず角度を ${problem.angleMode} にします`;
    if (requiredAction === 'toggle-shift') return '次のキーは SHIFT を押してから';
    return null;
  }, [requiredAction, problem.angleMode]);

  const progressPercent = totalSteps > 0 ? Math.round((Math.min(stepIndex, totalSteps) / totalSteps) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-900 text-zinc-100 shadow-inner dark:border-zinc-700">
      {/* メタ */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-700 px-3 py-1.5 text-base">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-indigo-500 px-2 py-0.5 text-sm font-semibold text-white">
            {problem.level}
          </span>
          <span className="rounded bg-zinc-700 px-2 py-0.5 text-sm font-semibold text-zinc-100">
            {problem.category}
          </span>
          <span className="rounded bg-zinc-700 px-2 py-0.5 text-sm font-semibold text-zinc-100">
            {angleMode}
          </span>
          {shiftActive && (
            <span className="rounded bg-violet-500 px-2 py-0.5 text-sm font-semibold text-white">
              SHIFT
            </span>
          )}
        </div>
        <span className="tabular-nums text-zinc-300">
          問 {problemNumber} / {totalProblems}
        </span>
      </div>

      {/* 問題文 */}
      <div className="px-3 py-2">
        {/* 2行ぶんの高さを確保しておく。問題が変わるたびに高さが変わると
            真下のキーパッドの位置が動いてしまうため。 */}
        <p
          className={`text-xl font-bold leading-[1.4] text-zinc-50 ${
            questionExpanded ? '' : 'line-clamp-2 min-h-14'
          }`}
        >
          <MathText>{problem.question}</MathText>
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {rounding && <span className="text-base text-amber-300">{rounding}</span>}
          <button
            type="button"
            onClick={() => setQuestionExpanded((prev) => !prev)}
            className="rounded text-base text-zinc-300 underline underline-offset-2 hover:text-zinc-100"
          >
            {questionExpanded ? '問題文をたたむ' : '問題文をひらく'}
          </button>
        </div>
      </div>

      {/* 入力中の式と答え */}
      <div className="border-t border-zinc-700 px-3 py-2">
        {/* 式が長くなっても高さを変えない。あふれたら先頭側を隠して末尾を見せる。 */}
        <div className="flex h-12 items-end justify-end overflow-hidden">
          <span className="break-all text-right font-mono text-lg leading-[1.3] text-zinc-200">
            {expression || '0'}
          </span>
        </div>
        <div
          className={`flex h-9 items-end justify-end overflow-hidden text-right font-mono text-3xl font-bold leading-none ${
            hasError ? 'text-rose-300' : 'text-emerald-300'
          }`}
        >
          <span className="truncate">{result}</span>
        </div>
      </div>

      {/*
        つぎに押すキー — キーパッドに一番近い位置。
        高さを h-12 に固定しているのは、ヒントが出た瞬間にここが伸びると
        真下のキーパッドがずれて、指の下でキーが動いてしまうため。
        文言が長くても折り返さず truncate させること。
      */}
      <div className="flex h-12 items-center gap-3 border-t border-zinc-700 bg-zinc-800 px-3">
        {isDone ? (
          <>
            <p className="min-w-0 flex-1 truncate text-base font-bold text-emerald-300">
              正解! 答え {problem.expectedAnswer}
            </p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={onRetry} className={SECONDARY_BUTTON}>
                もう一度
              </button>
              <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
                次の問題
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="flex min-w-0 flex-1 items-center gap-2 text-base" aria-live="polite">
              {wrongKeyHint ? (
                <>
                  <span aria-hidden="true" className="shrink-0 text-amber-300">！</span>
                  <span className="shrink-0 font-bold text-amber-300">ちがいます。つぎは</span>
                  <span className="shrink-0 rounded bg-zinc-700 px-2 py-0.5 font-mono font-bold text-amber-300">
                    {nextKeyLabel}
                  </span>
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="shrink-0 text-amber-300">▶</span>
                  <span className="shrink-0 text-zinc-300">つぎに押すキー</span>
                  <span className="shrink-0 rounded bg-zinc-700 px-2 py-0.5 font-mono font-bold text-zinc-50">
                    {nextKeyLabel}
                  </span>
                  {nextKeyNote && <span className="truncate text-zinc-300">{nextKeyNote}</span>}
                </>
              )}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <span className="tabular-nums text-base text-zinc-300">
                {Math.min(stepIndex, totalSteps)} / {totalSteps}
              </span>
              <div
                className="h-2 w-16 overflow-hidden rounded-full bg-zinc-700"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="入力の進み具合"
              >
                <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <button type="button" onClick={onRetry} className={SECONDARY_BUTTON}>
                もう一度
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
