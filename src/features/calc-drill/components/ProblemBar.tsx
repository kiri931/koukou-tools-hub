import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import MathText from '@/features/scientific-calculator/components/MathText';
import { roundingLabel } from '../types';
import type { DrillProblem } from '../types';
import type { Judgement } from '../hooks/useProblemSession';
import KeySteps from './KeySteps';

interface ProblemBarProps {
  /** 級・分野のしるし。問題モードでは上の帯を出さず、ここへ寄せる。 */
  leading?: React.ReactNode;
  /** 「使い方」「選び直す」 */
  trailing?: React.ReactNode;
  problem: DrillProblem | null;
  judgement: Judgement;
  answered: number;
  correct: number;
  /**
   * true なら答えを入力欄に打って答え合わせする（画面の電卓を隠しているとき）。
   * false なら、画面の電卓に出ている値で答え合わせする。
   */
  directInput?: boolean;
  /** directInput のときは、入力欄に打った文字列を渡す */
  onCheck: (typed?: string) => void;
  onNext: () => void;
}

/**
 * 全画面の電卓の上に出す問題の帯。
 * 高さを食うと1画面に収まらなくなるので、1〜2行に収める。
 */
export default function ProblemBar({
  leading,
  trailing,
  problem,
  judgement,
  answered,
  correct,
  directInput = false,
  onCheck,
  onNext,
}: ProblemBarProps) {
  const [typed, setTyped] = useState('');
  const [emptyHint, setEmptyHint] = useState(false);
  const [lastProblemId, setLastProblemId] = useState(problem?.id);
  const inputId = useId();
  // 問題が変わったら入力欄を空にする
  if (problem?.id !== lastProblemId) {
    setLastProblemId(problem?.id);
    setTyped('');
    setEmptyHint(false);
  }

  if (!problem) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base text-[var(--color-text-muted)]">
        {leading}
        <span className="flex-1">この分野の問題を作れませんでした。分野を選び直してください。</span>
        {trailing}
      </div>
    );
  }

  const hint = roundingLabel(problem.rounding);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {leading}

        <p className="min-w-[min(100%,16rem)] flex-1 text-lg font-bold text-[var(--color-text)]">
          <MathText>{problem.question}</MathText>
        </p>

        {hint && (
          <span className="text-base text-[var(--color-text-muted)]">{hint}</span>
        )}

        {problem.angleMode === 'RAD' && (
          // 角度モードの指定は見落とすと全部ちがう答えになる。文字で出す。
          <span className="rounded bg-amber-200 px-2 py-0.5 text-base font-bold text-amber-950">
            RAD にしてから
          </span>
        )}

        <span className="text-base text-[var(--color-text-muted)]">
          {answered} 問中 {correct} 問
        </span>

        {/* 正誤は色だけでなく記号と文言でも示す。行を増やさないよう同じ段に置く。 */}
        {judgement.kind !== 'none' && (
          <span
            role="status"
            className={`text-lg font-bold ${
              judgement.kind === 'correct'
                ? 'text-[var(--color-success)]'
                : 'text-[var(--color-danger)]'
            }`}
          >
            {judgement.kind === 'correct' ? '✓ 正解' : `✗ 不正解 → ${judgement.answer}`}
          </span>
        )}

        {!directInput &&
          (judgement.kind === 'none' ? (
            <Button type="button" onClick={() => onCheck()} className="min-h-11 text-base">
              答え合わせ
            </Button>
          ) : (
            <Button type="button" onClick={onNext} className="min-h-11 text-base">
              次の問題
            </Button>
          ))}

        {trailing}
      </div>

      {directInput && (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (judgement.kind !== 'none') {
              onNext();
              return;
            }
            if (!typed.trim()) {
              setEmptyHint(true);
              return;
            }
            setEmptyHint(false);
            onCheck(typed);
          }}
        >
          <label htmlFor={inputId} className="text-base font-bold text-[var(--color-text)]">
            答え
          </label>
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={typed}
            readOnly={judgement.kind !== 'none'}
            onChange={(e) => {
              setTyped(e.target.value);
              if (emptyHint) setEmptyHint(false);
            }}
            className="kj-input"
            // kj-input は幅100%で Tailwind より強いので、幅は style で決める
            style={{ width: '12rem', maxWidth: '100%' }}
          />
          <Button type="submit" className="min-h-11 text-base">
            {judgement.kind === 'none' ? '答え合わせ' : '次の問題'}
          </Button>
          <span aria-live="polite" className="text-base text-[var(--color-text)]">
            {emptyHint ? '答えを入れてから答え合わせしてください。' : ''}
          </span>
        </form>
      )}

      <div className="mt-1">
        <KeySteps key={problem.id} problem={problem} />
      </div>
    </div>
  );
}
