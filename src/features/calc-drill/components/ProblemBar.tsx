import { Button } from '@/components/ui/button';
import MathText from '@/features/scientific-calculator/components/MathText';
import { roundingLabel } from '../types';
import type { DrillProblem } from '../types';
import type { Judgement } from '../hooks/useProblemSession';

interface ProblemBarProps {
  /** 級・分野のしるし。問題モードでは上の帯を出さず、ここへ寄せる。 */
  leading?: React.ReactNode;
  /** 「使い方」「選び直す」 */
  trailing?: React.ReactNode;
  problem: DrillProblem | null;
  judgement: Judgement;
  answered: number;
  correct: number;
  onCheck: () => void;
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
  onCheck,
  onNext,
}: ProblemBarProps) {
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

        <p className="min-w-0 flex-1 text-lg font-bold text-[var(--color-text)]">
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
            className={`text-lg font-bold ${
              judgement.kind === 'correct'
                ? 'text-[var(--color-success)]'
                : 'text-[var(--color-danger)]'
            }`}
          >
            {judgement.kind === 'correct' ? '✓ 正解' : `✗ 不正解 → ${judgement.answer}`}
          </span>
        )}

        {judgement.kind === 'none' ? (
          <Button type="button" onClick={onCheck} className="min-h-11">
            答え合わせ
          </Button>
        ) : (
          <Button type="button" onClick={onNext} className="min-h-11">
            次の問題
          </Button>
        )}

        {trailing}
      </div>
    </div>
  );
}
