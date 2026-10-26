import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import CalcKeypad from '@/features/scientific-calculator/components/CalcKeypad';
import { generateProblems } from '../data/problems';
import { useCalcDrill } from '../hooks/useCalcDrill';
import { clearMissCounts, loadMissCounts, sortByWeakness, type MissCounts } from '../lib/missLog';
import { CATEGORIES_BY_LEVEL } from '../data/templates';
import type { DrillChoice, DrillCategory, DrillLevelFilter } from '../types';
import {
  ARCHIVE_LEVEL,
  DEFAULT_LEVEL,
  DRILL_MODE_KEYS,
  categoriesForFilter,
  levelFilterLabel,
  levelFilterOptions,
  levelMatches,
  levelOptions,
  parseArchiveParam,
  parseModeParam,
  urlWithDrillState,
  type DrillMode,
} from '../lib/drillOptions';
import DrillDisplay from './DrillDisplay';
import InputTipsMode from './InputTipsMode';
import PracticeMode from './PracticeMode';
import SelectField from './SelectField';
import WeakKeySummary from './WeakKeySummary';
import MathText from '@/features/scientific-calculator/components/MathText';

/** 画面の電卓を出すか（自分で解く・解答用紙）。端末ごとに覚える。 */
const SHOW_CALC_KEY = 'calc-drill.show-calc';

/** 並びは DRILL_MODE_KEYS と同じ（最初に開く「自分で解く」を先頭に置く） */
const MODES: { key: DrillMode; label: string; description: string }[] = [
  {
    key: 'solo',
    label: '自分で解く',
    description:
      '問題を見て、手もとの電卓で解きます。答えを入力欄に打てば、1問ずつその場で答え合わせができます。押す順は「打ち方を見る」で確かめられます。',
  },
  {
    key: 'guide',
    label: 'ガイド練習',
    description:
      '光っているキーを順に押していきます。手順ごと覚えるための練習です。問題は検定と同じ形で毎回作り直されます。',
  },
  {
    key: 'sheet',
    label: '解答用紙（本番）',
    description:
      '検定と同じ版面で10問を一枚に並べます。手もとの電卓で解いて各問の入力欄に答えを書き、10分で最後にまとめて採点します。',
  },
  {
    key: 'tips' as const,
    label: '打ち方のコツ',
    description:
      'そのまま左から打つと別の式になってしまう入力を、なぜそうなるかまで書いてあります。押す順をその場で電卓に流して試せます。',
  },
];

const initialSearch = () => (typeof window === 'undefined' ? '' : window.location.search);

export default function CalcDrill() {
  // 4級はアーカイブ。?level=4 か「4級の問題（アーカイブ）」で開く
  const [archive, setArchive] = useState(() => parseArchiveParam(initialSearch()));
  const [levelFilter, setLevelFilter] = useState<DrillLevelFilter>(() =>
    parseArchiveParam(initialSearch()) ? ARCHIVE_LEVEL : DEFAULT_LEVEL
  );
  const [categoryFilter, setCategoryFilter] = useState<DrillCategory | 'すべて'>('すべて');
  const [listOpen, setListOpen] = useState(false);
  const [weakFirst, setWeakFirst] = useState(false);
  // 最初は「自分で解く」。授業でガイド練習から始めたいときは ?mode=guide
  const [mode, setMode] = useState<DrillMode>(() => parseModeParam(initialSearch()));
  const [assist, setAssist] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  useEffect(() => {
    try {
      setShowCalc(window.localStorage.getItem(SHOW_CALC_KEY) === '1');
    } catch {
      // 読めなければ既定（隠す）のまま
    }
  }, []);

  const toggleCalc = () => {
    setShowCalc((shown) => {
      const next = !shown;
      try {
        window.localStorage.setItem(SHOW_CALC_KEY, next ? '1' : '0');
      } catch {
        // 保存できなくても使える
      }
      return next;
    });
  };

  // 切り替えた状態を URL に残す（そのまま共有・再読み込みできるように）
  const syncUrl = (nextMode: DrillMode, nextArchive: boolean) => {
    try {
      window.history.replaceState(
        window.history.state,
        '',
        urlWithDrillState(window.location.href, nextMode, nextArchive)
      );
    } catch {
      // 書き換えられなくても練習はできる
    }
  };

  const changeMode = (next: DrillMode) => {
    setMode(next);
    syncUrl(next, archive);
  };

  const openArchive = (open: boolean) => {
    setArchive(open);
    setLevelFilter(open ? ARCHIVE_LEVEL : DEFAULT_LEVEL);
    setCategoryFilter('すべて');
    syncUrl(mode, open);
  };
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
    () => ['すべて', ...categoriesForFilter(levelFilter)],
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
          levelMatches(problem.level, levelFilter) &&
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
      {/* <main> はページ側（.astro）に1つだけ置く。余白と外枠はページの kj-tool-frame が持つ */}
      <div
        className={`mx-auto ${
          mode === 'sheet'
            ? showCalc
              ? 'max-w-6xl'
              : 'max-w-3xl'
            : mode === 'guide'
              ? 'max-w-[30rem]'
              : 'max-w-2xl'
        }`}
      >
        {/* たたんだときは、いま何を練習しているかの1行だけ残す */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="min-h-11 text-base" onClick={toggleSettings} aria-expanded={settingsOpen}>
            {/* 開閉は色ではなく記号と文言で示す */}
            {settingsOpen ? '▲ 設定をたたむ' : '▼ 設定をひらく'}
          </Button>
          {!settingsOpen && (
            <span className="text-base text-[var(--color-text-muted)]">
              {MODES.find((m) => m.key === mode)?.label}／
              {needsOneChoice ? practiceChoice.level : levelFilterLabel(levelFilter)}
              {archive && '（アーカイブ）'}・
              {needsOneChoice ? practiceChoice.category : categoryFilter}
              {(mode === 'solo' || mode === 'sheet') &&
                (showCalc ? `／画面の電卓・入力補助 ${assist ? '入' : '切'}` : '／手もとの電卓')}
            </span>
          )}
          {/* 件数と「作り直す」はガイド練習の問題一覧のもの。
              自分で解くは1問ずつ尽きるまで作り続け、解答用紙は常に10問で用紙に件数が出る。
              ほかのモードで出すと、出題と関係のない数と、押しても何も変わらないボタンになる。 */}
          {mode === 'guide' && (
          <span className="ml-auto flex items-center gap-2">
            <span className="text-base text-[var(--color-text-muted)]">{filteredProblems.length} 問</span>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 text-base"
              onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              作り直す
            </Button>
          </span>
          )}
        </div>

        {settingsOpen && (
          <>
          {/* 1つだけ選ぶものはメニューにまとめる。
              ボタンで並べると、キーパッドの前に15個のボタンが並んでしまう。 */}
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <SelectField
              label="練習"
              value={mode}
              options={DRILL_MODE_KEYS}
              display={(key) => MODES.find((m) => m.key === key)?.label ?? key}
              onChange={changeMode}
            />
            {/* 「自分で解く」「解答用紙」「打ち方のコツ」は級と分野を1つに決めてから始めるので、
                「すべて」を選べるようにしない。選べてしまうと、メニューは「すべて」なのに
                画面には3級が出ている、という食い違いになる。 */}
            {archive ? (
              // アーカイブでは4級だけ。選ぶものが無いのでメニューにしない
              <span className="text-base text-[var(--color-text)]">
                <span className="text-[var(--color-text-muted)]">級</span>{' '}
                <span className="font-semibold">4級（アーカイブ）</span>
              </span>
            ) : (
              <SelectField
                label="級"
                value={needsOneChoice ? practiceChoice.level : levelFilter}
                options={needsOneChoice ? levelOptions(false) : levelFilterOptions(false)}
                display={levelFilterLabel}
                onChange={setLevelFilter}
              />
            )}
            <SelectField
              label="分野"
              value={needsOneChoice ? practiceChoice.category : categoryFilter}
              options={
                needsOneChoice ? CATEGORIES_BY_LEVEL[practiceChoice.level] : categoryOptions
              }
              onChange={setCategoryFilter}
            />
          </div>

          <p className="mb-3 text-base text-[var(--color-text-muted)]">
            {MODES.find((m) => m.key === mode)?.description}
          </p>

          {!archive && (
            // 4級は通常の選択肢から外し、ここから小さく開けるようにしておく
            <p className="mb-3">
              <button
                type="button"
                onClick={() => openArchive(true)}
                className="inline-flex min-h-11 items-center rounded px-1 text-base text-[var(--color-text-muted)] underline underline-offset-2"
              >
                4級の問題（アーカイブ）を開く
              </button>
            </p>
          )}
          </>
        )}

        {archive && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <span className="text-base font-bold text-[var(--color-text)]">
              4級の問題（アーカイブ）を表示しています。
            </span>
            <Button type="button" variant="outline" className="min-h-11 text-base" onClick={() => openArchive(false)}>
              3級に戻る
            </Button>
          </div>
        )}

        {mode === 'tips' ? (
          <InputTipsMode choice={practiceChoice} />
        ) : mode !== 'guide' ? (
          <PracticeMode
            kind={mode}
            choice={practiceChoice}
            assist={assist}
            onToggleAssist={() => setAssist((v) => !v)}
            showCalc={showCalc}
            onToggleCalc={toggleCalc}
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
                className="rounded text-base font-semibold text-[var(--color-text)] underline underline-offset-2"
              >
                問題一覧（{filteredProblems.length}問）を{listOpen ? 'たたむ' : 'ひらく'}
              </button>
              {listOpen && (
                <div className="mt-2 max-h-80 overflow-auto rounded-md border border-[var(--color-border)]">
                  <table className="w-full text-base">
                    <thead className="sticky top-0 bg-[var(--color-surface-strong)] text-[var(--color-text)]">
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
                          aria-current={index === problemIndex ? 'true' : undefined}
                          className={
                            index === problemIndex
                              ? 'bg-[var(--kj-marker)]'
                              : 'border-t border-[var(--kj-divider)]'
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
          <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-base text-[var(--color-text)]">
            この条件に当てはまる問題がありません。級か分野の絞り込みを変えてください。
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
