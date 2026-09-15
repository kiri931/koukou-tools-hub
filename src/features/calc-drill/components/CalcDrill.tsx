import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import CalcKeypad from '@/features/scientific-calculator/components/CalcKeypad';
import { generateProblems } from '../data/problems';
import { useCalcDrill } from '../hooks/useCalcDrill';
import { clearMissCounts, loadMissCounts, sortByWeakness, type MissCounts } from '../lib/missLog';
import { CATEGORIES_BY_LEVEL } from '../data/templates';
import type { DrillChoice, DrillCategory, DrillLevel, DrillLevelFilter } from '../types';
import DrillDisplay from './DrillDisplay';
import InputTipsMode from './InputTipsMode';
import PracticeMode from './PracticeMode';
import SelectField from './SelectField';
import WeakKeySummary from './WeakKeySummary';
import MathText from '@/features/scientific-calculator/components/MathText';

const LEVELS: DrillLevel[] = ['4級', '3級', '2級'];
const LEVEL_FILTERS: DrillLevelFilter[] = ['すべて', ...LEVELS];
const CATEGORY_FILTERS: (DrillCategory | 'すべて')[] = [
  'すべて',
  '四則計算',
  '集計計算',
  '関数計算',
  '実務計算',
  '方程式と不等式',
  '応用計算',
];

const MODES = [
  {
    key: 'guide' as const,
    label: 'ガイド練習',
    description:
      '光っているキーを順に押していきます。手順ごと覚えるための練習です。問題は検定と同じ形で毎回作り直されます。',
  },
  {
    key: 'solo' as const,
    label: '自分で解く',
    description:
      '問題を見て自分で電卓を打ちます。1問ずつその場で答え合わせができます。入力補助を入れると、次に押すキーが光ります。',
  },
  {
    key: 'sheet' as const,
    label: '解答用紙（本番）',
    description:
      '検定と同じ版面で10問を一枚に並べます。10分で解いて、最後にまとめて採点します。',
  },
  {
    key: 'tips' as const,
    label: '打ち方のコツ',
    description:
      'そのまま左から打つと別の式になってしまう入力を、なぜそうなるかまで書いてあります。押す順をその場で電卓に流して試せます。',
  },
];

export default function CalcDrill() {
  const [levelFilter, setLevelFilter] = useState<DrillLevelFilter>('すべて');
  const [categoryFilter, setCategoryFilter] = useState<DrillCategory | 'すべて'>('すべて');
  const [listOpen, setListOpen] = useState(false);
  const [weakFirst, setWeakFirst] = useState(false);
  const [mode, setMode] = useState<'guide' | 'solo' | 'sheet' | 'tips'>('guide');
  const [assist, setAssist] = useState(false);
  // 上の設定（練習のしかた・級・分野）をたたんでおけるようにする。
  // 解答用紙や電卓は縦に長く、設定が常に出ていると画面を圧迫するため。
  const [settingsOpen, setSettingsOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('calc-drill.settings-open');
      if (saved !== null) setSettingsOpen(saved === '1');
    } catch {
      // 読めなくても使えるので、ここは黙って諦める
    }
  }, []);

  const toggleSettings = () => {
    setSettingsOpen((open) => {
      const next = !open;
      try {
        window.localStorage.setItem('calc-drill.settings-open', next ? '1' : '0');
      } catch {
        // 保存できなくても使える
      }
      return next;
    });
  };

  // 「自分で解く」と「解答用紙」は区分を1つに決めてから始める。
  // 絞り込みが「すべて」のままなら、その級でいちばん最初に解く区分にする。
  const practiceChoice: DrillChoice = (() => {
    const level = levelFilter === 'すべて' ? '3級' : levelFilter;
    const categories = CATEGORIES_BY_LEVEL[level];
    return {
      level,
      category:
        categoryFilter !== 'すべて' && categories.includes(categoryFilter)
          ? categoryFilter
          : categories[0],
    };
  })();
  // 分野の選択肢は、選んだ級に実在するものだけにする。
  // 「4級」に「関数計算」を出しても0問になるだけで、選べる意味がない。
  const categoryOptions = useMemo<(DrillCategory | 'すべて')[]>(
    () =>
      levelFilter === 'すべて'
        ? CATEGORY_FILTERS
        : ['すべて', ...CATEGORIES_BY_LEVEL[levelFilter]],
    [levelFilter]
  );

  // ガイド練習だけは級・分野をまたいで続けて解ける。他は1つに決める。
  const needsOneChoice = mode !== 'guide';

  // 開くたびに違う種にする。過去問をそのまま出すのではなく、同じ形の問題を作っている
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const displayRef = useRef<HTMLDivElement>(null);

  const allProblems = useMemo(() => generateProblems(seed), [seed]);

  const baseProblems = useMemo(
    () =>
      allProblems.filter(
        (problem) =>
          (levelFilter === 'すべて' || problem.level === levelFilter) &&
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
      {/* ガイド練習は片手で押せる幅にする。解答用紙は用紙と電卓を横に並べるので広げる。 */}
      <main
        className={`mx-auto px-4 py-4 text-slate-900 dark:text-slate-100 ${
          mode === 'sheet' ? 'max-w-6xl' : mode === 'guide' ? 'max-w-[30rem]' : 'max-w-2xl'
        }`}
      >
        {/* たたんだときは、いま何を練習しているかの1行だけ残す */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={toggleSettings} aria-expanded={settingsOpen}>
            {/* 開閉は色ではなく記号と文言で示す */}
            {settingsOpen ? '▲ 設定をたたむ' : '▼ 設定をひらく'}
          </Button>
          {!settingsOpen && (
            <span className="text-base text-slate-700 dark:text-slate-300">
              {MODES.find((m) => m.key === mode)?.label}／
              {needsOneChoice ? practiceChoice.level : levelFilter}・
              {needsOneChoice ? practiceChoice.category : categoryFilter}
              {mode !== 'guide' && mode !== 'tips' && `／入力補助 ${assist ? '入' : '切'}`}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2">
            <span className="text-base text-slate-700 dark:text-slate-300">{filteredProblems.length} 問</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              作り直す
            </Button>
          </span>
        </div>

        {settingsOpen && (
          <>
          {/* 1つだけ選ぶものはメニューにまとめる。
              ボタンで並べると、キーパッドの前に15個のボタンが並んでしまう。 */}
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <SelectField
              label="練習"
              value={mode}
              options={MODES.map((m) => m.key)}
              display={(key) => MODES.find((m) => m.key === key)?.label ?? key}
              onChange={setMode}
            />
            {/* 「自分で解く」「解答用紙」「打ち方のコツ」は級と分野を1つに決めてから始めるので、
                「すべて」を選べるようにしない。選べてしまうと、メニューは「すべて」なのに
                画面には3級が出ている、という食い違いになる。 */}
            <SelectField
              label="級"
              value={needsOneChoice ? practiceChoice.level : levelFilter}
              options={needsOneChoice ? LEVELS : LEVEL_FILTERS}
              onChange={setLevelFilter}
            />
            <SelectField
              label="分野"
              value={needsOneChoice ? practiceChoice.category : categoryFilter}
              options={
                needsOneChoice ? CATEGORIES_BY_LEVEL[practiceChoice.level] : categoryOptions
              }
              onChange={setCategoryFilter}
            />
          </div>

          <p className="mb-3 text-base text-slate-700 dark:text-slate-300">
            {MODES.find((m) => m.key === mode)?.description}
          </p>

          </>
        )}

        {mode === 'tips' ? (
          <InputTipsMode choice={practiceChoice} />
        ) : mode !== 'guide' ? (
          <PracticeMode
            kind={mode}
            choice={practiceChoice}
            assist={assist}
            onToggleAssist={() => setAssist((v) => !v)}
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
