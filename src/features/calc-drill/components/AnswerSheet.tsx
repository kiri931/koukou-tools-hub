import { Button } from '@/components/ui/button';
import MathText from '@/features/scientific-calculator/components/MathText';
import { CATEGORIES_BY_LEVEL } from '../data/templates';
import { roundingLabel } from '../types';
import type { DrillChoice } from '../types';
import { PASSING_SCORE } from '../lib/grading';
import type { SheetRow } from '../hooks/useAnswerSheet';


interface AnswerSheetProps {
  choice: DrillChoice;
  rows: SheetRow[];
  activeIndex: number;
  graded: boolean;
  remaining: number;
  correctCount: number;
  score: number;
  onSelect: (index: number) => void;
  onWrite: (index: number, value: string) => void;
  onGrade: () => void;
  onRestart: () => void;
}

/**
 * 用紙の区分番号。級によって並びが違うので、級ごとの区分表から引く。
 * 例: 関数計算は3級では(2)だが、2級では(1)。
 */
function sectionNumberFor(choice: DrillChoice): string {
  const index = CATEGORIES_BY_LEVEL[choice.level]?.indexOf(choice.category) ?? -1;
  return index >= 0 ? `(${index + 1})` : '';
}

function formatRemaining(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 検定の解答用紙と同じ版面。
 * 実物は A4 を横に2つ割りして (1)〜(10) を並べ、右端に答えを書く。
 * ここでもその形にして、本番で問題を探す目の動きを同じにする。
 */
export default function AnswerSheet({
  choice,
  rows,
  activeIndex,
  graded,
  remaining,
  correctCount,
  score,
  onSelect,
  onWrite,
  onGrade,
  onRestart,
}: AnswerSheetProps) {
  const roundingNote =
    choice.category === '実務計算'
      ? '答は指定されたものおよび整数以外は四捨五入により小数第2位まで求めること。'
      : '答は指定されたもの以外は四捨五入により小数第2位まで求めること。';

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-slate-700 bg-white text-slate-900 dark:border-slate-400 dark:bg-slate-50">
      {/* 用紙の頭。実物と同じ並びにしてある */}
      <div className="shrink-0 border-b border-slate-700 px-3 py-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-lg font-bold">
            {choice.level} {sectionNumberFor(choice)} {choice.category}
          </span>
          <span className="text-base">（制限時間 10分）</span>
          <span className="ml-auto font-mono text-lg font-bold tabular-nums">
            のこり {formatRemaining(remaining)}
          </span>
        </div>
        <p className="mt-1 text-base">{roundingNote}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ol className="grid grid-cols-1 lg:grid-cols-2">
          {rows.map((row, i) => {
            const active = i === activeIndex && !graded;
            const hint = roundingLabel(row.problem.rounding);
            const showHint = hint && hint !== '小数第2位まで';
            return (
              <li
                key={row.problem.id}
                className={`flex gap-2 border-b border-r border-slate-400 p-2 ${
                  // いま書き込む先は、色だけでなく太い枠でも示す
                  active ? 'border-l-4 border-l-slate-900 bg-amber-50' : 'border-l-4 border-l-transparent'
                }`}
              >
                <span className="w-8 shrink-0 text-base font-bold tabular-nums">({i + 1})</span>

                <div className="min-w-0 flex-1">
                  {(showHint || row.problem.angleMode === 'RAD') && (
                    <p className="text-sm font-bold">
                      {showHint ? `（${hint}）` : ''}
                      {row.problem.angleMode === 'RAD' ? '〔RAD〕' : ''}
                    </p>
                  )}
                  <p className="break-words text-base leading-snug">
                    <MathText>{row.problem.question}</MathText>
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-base">=</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.answer}
                      readOnly={graded}
                      onFocus={() => onSelect(i)}
                      onChange={(e) => onWrite(i, e.target.value)}
                      aria-label={`(${i + 1}) の答え`}
                      className="min-h-11 w-40 rounded border-b-2 border-slate-700 bg-transparent px-1 text-base font-mono focus:outline-2 focus:outline-offset-2 focus:outline-slate-900"
                    />
                    {graded && (
                      // 正誤は色だけでなく記号と文言でも示す
                      <span
                        className={`text-base font-bold ${
                          row.correct ? 'text-emerald-800' : 'text-rose-800'
                        }`}
                      >
                        {row.correct ? '○ 正解' : `✗ ${row.problem.expectedAnswer}`}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-slate-700 px-3 py-2">
        {graded ? (
          <>
            <span className="text-lg font-bold">
              {score} 点（{correctCount} / {rows.length} 問）
            </span>
            <span
              className={`text-base font-bold ${
                score >= PASSING_SCORE ? 'text-emerald-800' : 'text-amber-900'
              }`}
            >
              {score >= PASSING_SCORE
                ? `合格の目安（${PASSING_SCORE}点）に届いています`
                : `合格の目安は ${PASSING_SCORE} 点`}
            </span>
            <Button type="button" className="ml-auto min-h-11" onClick={onRestart}>
              新しい用紙で解く
            </Button>
          </>
        ) : (
          <>
            <span className="text-base">
              答えを書いた問題 {rows.filter((r) => r.answer.trim()).length} / {rows.length}
            </span>
            <Button type="button" className="ml-auto min-h-11" onClick={onGrade}>
              採点する
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
