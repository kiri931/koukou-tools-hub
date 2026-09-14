import { useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import CalcKeypad from '@/features/scientific-calculator/components/CalcKeypad';
import { generateProblems } from '../data/problems';
import { useCalcDrill } from '../hooks/useCalcDrill';
import { clearMissCounts, loadMissCounts, sortByWeakness, type MissCounts } from '../lib/missLog';
import type { DrillCategory, DrillLevelFilter } from '../types';
import DrillDisplay from './DrillDisplay';
import ExamMode from './ExamMode';
import WeakKeySummary from './WeakKeySummary';
import MathText from '@/features/scientific-calculator/components/MathText';

const LEVEL_FILTERS: DrillLevelFilter[] = ['両方', '4級', '3級'];
const CATEGORY_FILTERS: (DrillCategory | 'すべて')[] = [
  'すべて',
  '四則計算',
  '集計計算',
  '関数計算',
  '実務計算',
];

export default function CalcDrill() {
  const [levelFilter, setLevelFilter] = useState<DrillLevelFilter>('両方');
  const [categoryFilter, setCategoryFilter] = useState<DrillCategory | 'すべて'>('すべて');
  const [listOpen, setListOpen] = useState(false);
  const [weakFirst, setWeakFirst] = useState(false);
  const [mode, setMode] = useState<'guide' | 'exam'>('guide');
  // 開くたびに違う種にする。過去問をそのまま出すのではなく、同じ形の問題を作っている
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const displayRef = useRef<HTMLDivElement>(null);

  const allProblems = useMemo(() => generateProblems(seed), [seed]);

  const baseProblems = useMemo(
    () =>
      allProblems.filter(
        (problem) =>
          (levelFilter === '両方' || problem.level === levelFilter) &&
          (categoryFilter === 'すべて' || problem.category === categoryFilter)
      ),
    [allProblems, levelFilter, categoryFilter]
  );

  /*
   * 「苦手なキーから」を選んだときだけ並べ替える。
   *
   * 並べ替えの材料は、ドリルが持っている最新の記録ではなく
   * **トグルを押した時点で localStorage から読んだ控え** を使う。
   * 解いている最中に記録が増えるたび問題順が変わると、
   * いま解いている問題が横に飛んでしまうため。
   */
  const [weakSnapshot, setWeakSnapshot] = useState<MissCounts>({});
  const filteredProblems = useMemo(
    () => (weakFirst ? sortByWeakness(baseProblems, weakSnapshot) : baseProblems),
    [weakFirst, baseProblems, weakSnapshot]
  );

  const {
    state,
    displayExpression,
    pressButton,
    currentProblem,
    problemIndex,
    totalProblems,
    stepIndex,
    totalSteps,
    isDone,
    requiredAction,
    wrongKeyHint,
    missCounts,
    setMissCounts,
    nextProblem,
    retryProblem,
    selectProblem,
  } = useCalcDrill(filteredProblems);

  const toggleWeakFirst = () => {
    setWeakFirst((prev) => {
      if (!prev) setWeakSnapshot(loadMissCounts());
      return !prev;
    });
  };

  const resetMisses = () => {
    clearMissCounts();
    setMissCounts({});
    setWeakSnapshot({});
    setWeakFirst(false);
  };

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={100}>
      <main className="mx-auto max-w-[30rem] px-4 py-4 text-slate-900 dark:text-slate-100">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={mode === 'guide' ? 'default' : 'outline'}
            onClick={() => setMode('guide')}
            aria-pressed={mode === 'guide'}
          >
            ガイド練習
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'exam' ? 'default' : 'outline'}
            onClick={() => setMode('exam')}
            aria-pressed={mode === 'exam'}
          >
            本番（10分）
          </Button>
        </div>

        <p className="mb-3 text-base text-slate-600 dark:text-slate-300">
          {mode === 'guide'
            ? '光っているキーを順に押していきます。手順ごと覚えるための練習です。問題は検定と同じ形で毎回作り直されます。'
            : '検定と同じ 10 分・10 問で通して解きます。キーのガイドは出ません。'}
        </p>

        <div className="mb-3 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base text-slate-600 dark:text-slate-300">級</span>
            {LEVEL_FILTERS.map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={levelFilter === filter ? 'default' : 'outline'}
                onClick={() => setLevelFilter(filter)}
                aria-pressed={levelFilter === filter}
              >
                {filter}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base text-slate-600 dark:text-slate-300">分野</span>
            {CATEGORY_FILTERS.map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={categoryFilter === filter ? 'default' : 'outline'}
                onClick={() => setCategoryFilter(filter)}
                aria-pressed={categoryFilter === filter}
              >
                {filter}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              問題を作り直す
            </Button>
            <span className="text-base text-slate-600 dark:text-slate-300">
              {filteredProblems.length} 問
            </span>
          </div>
        </div>

        {mode === 'exam' ? (
          <ExamMode
            pool={filteredProblems}
            levelLabel={levelFilter}
            categoryLabel={categoryFilter}
          />
        ) : currentProblem ? (
          <>
            <div ref={displayRef} className="scroll-mt-20">
            <DrillDisplay
              problem={currentProblem}
              problemNumber={problemIndex + 1}
              totalProblems={totalProblems}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              isDone={isDone}
              expression={displayExpression}
              result={state.result}
              hasError={state.hasError}
              angleMode={state.angleMode}
              shiftActive={state.shiftActive}
              requiredAction={requiredAction}
              wrongKeyHint={wrongKeyHint}
              onRetry={retryProblem}
              onNext={nextProblem}
            />
            </div>

            {/* ディスプレイのすぐ下。間を空けないのが目的なので mt は詰める */}
            <div className="mt-2">
              <CalcKeypad
                shiftActive={state.shiftActive}
                angleMode={state.angleMode}
                onPress={pressButton}
                highlightedAction={requiredAction ?? undefined}
              />
            </div>

            <WeakKeySummary
              missCounts={missCounts}
              weakFirst={weakFirst}
              onToggleWeakFirst={toggleWeakFirst}
              onReset={resetMisses}
            />

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setListOpen((prev) => !prev)}
                aria-expanded={listOpen}
                className="rounded text-base font-semibold text-slate-700 underline underline-offset-2 dark:text-slate-200"
              >
                問題一覧（{filteredProblems.length}問）を{listOpen ? 'たたむ' : 'ひらく'}
              </button>
              {listOpen && (
                <div className="mt-2 max-h-80 overflow-auto rounded-md border border-slate-300 dark:border-slate-800">
                  <table className="w-full text-base">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">#</th>
                        <th className="px-3 py-2 text-left font-medium">級</th>
                        <th className="px-3 py-2 text-left font-medium">分野</th>
                        <th className="px-3 py-2 text-left font-medium">問題</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProblems.map((problem, index) => (
                        <tr
                          key={problem.id}
                          className={
                            index === problemIndex
                              ? 'bg-amber-100 dark:bg-amber-900/30'
                              : 'border-t border-slate-200 dark:border-slate-800'
                          }
                        >
                          <td className="px-3 py-2 align-top tabular-nums">{index + 1}</td>
                          <td className="px-3 py-2 align-top">{problem.level}</td>
                          <td className="px-3 py-2 align-top">{problem.category}</td>
                          <td className="px-3 py-2 align-top">
                            <button
                              type="button"
                              onClick={() => {
                                selectProblem(index);
                                setListOpen(false);
                                // 一覧はキーパッドの下にあるので、選んだら表示に戻す
                                displayRef.current?.scrollIntoView({ block: 'start' });
                              }}
                              className="text-left underline underline-offset-2"
                            >
                              <MathText>{problem.question}</MathText>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-base text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            この条件に当てはまる問題がありません。級か分野の絞り込みを変えてください。
          </p>
        )}
      </main>
    </TooltipProvider>
  );
}
