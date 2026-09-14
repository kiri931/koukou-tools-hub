import CalcKeypad from '@/features/scientific-calculator/components/CalcKeypad';
import { Button } from '@/components/ui/button';
import { useExamMode } from '../hooks/useExamMode';
import { EXAM_QUESTION_COUNT, PASSING_SCORE, formatRemaining } from '../lib/grading';
import { roundingLabel, type DrillProblem } from '../types';
import MathText from '@/features/scientific-calculator/components/MathText';

interface ExamModeProps {
  pool: DrillProblem[];
  levelLabel: string;
  categoryLabel: string;
}

export default function ExamMode({ pool, levelLabel, categoryLabel }: ExamModeProps) {
  const {
    state,
    displayExpression,
    pressButton,
    phase,
    index,
    questions,
    answers,
    remaining,
    currentProblem,
    result,
    start,
    submitAnswer,
    skipQuestion,
    finish,
    reset,
  } = useExamMode(pool);

  if (phase === 'ready') {
    return (
      <div className="rounded-lg border border-slate-300 p-4 dark:border-slate-800">
        <h3 className="text-lg font-bold">本番と同じ形で解く</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-slate-700 dark:text-slate-200">
          <li>
            {levelLabel}・{categoryLabel} から {Math.min(pool.length, EXAM_QUESTION_COUNT)} 問を
            10 分で解きます。毎回ちがう問題が選ばれます。
          </li>
          <li>
            <strong>キーのガイドは出ません。</strong>自分で手順を決めて電卓を打ちます。
          </li>
          <li>答えが出たら「これで答える」を押します。次の問題に進みます。</li>
          <li>{PASSING_SCORE} 点以上で合格。検定と同じ基準です。</li>
        </ul>
        <Button type="button" className="mt-3" onClick={start} disabled={pool.length === 0}>
          はじめる
        </Button>
        {pool.length === 0 && (
          <p className="mt-2 text-base text-slate-700 dark:text-slate-200">
            いまの絞り込みだと問題がありません。級か分野を変えてください。
          </p>
        )}
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="rounded-lg border border-slate-300 p-4 dark:border-slate-800">
        <h3 className="text-lg font-bold">
          {result.score} 点（{result.correct} / {result.total} 問）
        </h3>
        <p
          className={`mt-1 text-base font-bold ${
            result.passed
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-amber-800 dark:text-amber-300'
          }`}
        >
          {result.passed
            ? `合格の目安（${PASSING_SCORE}点）に届いています`
            : `合格の目安は ${PASSING_SCORE} 点です。あと ${PASSING_SCORE - result.score} 点`}
        </p>

        <ol className="mt-3 space-y-2">
          {answers.map((entry, i) => (
            <li
              key={entry.problem.id}
              className="rounded-md border border-slate-300 p-2 dark:border-slate-700"
            >
              <div className="flex items-start gap-2">
                {/* 色だけで正誤を示さない */}
                <span
                  className={`shrink-0 font-bold ${
                    entry.correct
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {entry.correct ? '○ 正解' : '× まちがい'}
                </span>
                <span className="text-base">{i + 1}.</span>
                <span className="min-w-0 break-words text-base">
                  <MathText>{entry.problem.question}</MathText>
                </span>
              </div>
              {!entry.correct && (
                <p className="mt-1 text-base text-slate-700 dark:text-slate-200">
                  あなたの答え: {entry.answer} ／ 正しい答え: {entry.problem.expectedAnswer}
                </p>
              )}
            </li>
          ))}
        </ol>

        <Button type="button" className="mt-3" onClick={reset}>
          もう一度やる
        </Button>
      </div>
    );
  }

  const rounding = currentProblem ? roundingLabel(currentProblem.rounding) : null;
  const lowOnTime = remaining <= 60;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-900 text-zinc-100 dark:border-zinc-700">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-700 px-3 py-1.5">
          <span className="text-base text-zinc-300">
            問 {index + 1} / {questions.length}
          </span>
          <span
            className={`font-mono text-base font-bold tabular-nums ${
              lowOnTime ? 'text-amber-300' : 'text-zinc-100'
            }`}
            role="timer"
            aria-live="off"
          >
            のこり {formatRemaining(remaining)}
            {lowOnTime && <span className="ml-1 text-base">（あと少し）</span>}
          </span>
        </div>

        <div className="px-3 py-2">
          <p className="min-h-14 text-xl font-bold leading-[1.4] text-zinc-50">
            {currentProblem && <MathText>{currentProblem.question}</MathText>}
          </p>
          {rounding && <p className="mt-1 text-base text-amber-300">{rounding}</p>}
        </div>

        <div className="border-t border-zinc-700 px-3 py-2">
          <div className="flex h-12 items-end justify-end overflow-hidden">
            <span className="break-all text-right font-mono text-lg leading-[1.3] text-zinc-200">
              {displayExpression || '0'}
            </span>
          </div>
          <div
            className={`flex h-9 items-end justify-end overflow-hidden text-right font-mono text-3xl font-bold leading-none ${
              state.hasError ? 'text-rose-300' : 'text-emerald-300'
            }`}
          >
            <span className="truncate">{state.result}</span>
          </div>
        </div>

        <div className="flex h-12 items-center justify-between gap-2 border-t border-zinc-700 bg-zinc-800 px-3">
          <span className="text-base text-zinc-300">答えが出たら押します</span>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={skipQuestion}
              className="rounded-md border border-zinc-400 bg-zinc-700 px-3 py-1.5 text-base font-semibold text-zinc-100 hover:bg-zinc-600"
            >
              とばす
            </button>
            <button
              type="button"
              onClick={submitAnswer}
              className="rounded-md bg-emerald-400 px-3 py-1.5 text-base font-bold text-zinc-900 hover:bg-emerald-300"
            >
              これで答える
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2">
        {/* 本番なのでハイライトは出さない */}
        <CalcKeypad
          shiftActive={state.shiftActive}
          angleMode={state.angleMode}
          onPress={pressButton}
        />
      </div>

      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={finish}>
        ここでやめて採点する
      </Button>
    </div>
  );
}
