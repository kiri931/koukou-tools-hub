import { useEffect } from 'react';
import CalcDisplay from '@/features/scientific-calculator/components/CalcDisplay';
import CalcKeypad from '@/features/scientific-calculator/components/CalcKeypad';
import { formatModeLabel } from '@/features/scientific-calculator/hooks/format';
import { useCalculator } from '@/features/scientific-calculator/hooks/useCalculator';
import { Button } from '@/components/ui/button';
import AnswerSheet from './AnswerSheet';
import ProblemBar from './ProblemBar';
import { useAnswerSheet } from '../hooks/useAnswerSheet';
import { useKeyGuide } from '../hooks/useKeyGuide';
import { useProblemSession } from '../hooks/useProblemSession';
import { normalizeTypedAnswer } from '../lib/drillOptions';
import type { DrillChoice } from '../types';

interface PracticeModeProps {
  /** 'solo' = 1問ずつ自分で解く / 'sheet' = 解答用紙で10問 */
  kind: 'solo' | 'sheet';
  choice: DrillChoice;
  assist: boolean;
  onToggleAssist: () => void;
  /**
   * 画面の電卓を出すか。既定は出さない（検定本番は自分の電卓で解くため）。
   * 出さないときは、答えを入力欄に直接打って答え合わせする。
   */
  showCalc: boolean;
  onToggleCalc: () => void;
}

/**
 * 「自分で解く」と「解答用紙」。どちらも手順は自分で決め、ガイドは任意。
 *
 * 画面の電卓はオプション。既定では隠し、生徒は手もとの電卓で計算して
 * 答えを入力欄に打つ。「このサイトの電卓で打つ」で出したときだけ、
 * 電卓・入力補助・「答えとして書く」が出る。
 *
 * ガイド練習（DrillDisplay 側）は押すキーを1つずつ強制するが、
 * ここは本番と同じく自分で手順を決める。入力補助を入れたときだけ、
 * 次に押すキーを光らせる。
 */
export default function PracticeMode({
  kind,
  choice,
  assist,
  onToggleAssist,
  showCalc,
  onToggleCalc,
}: PracticeModeProps) {
  const { state, displayBeforeCursor, displayAfterCursor, parenBalance, pressButton, applyPreset } =
    useCalculator();

  const session = useProblemSession(choice, kind === 'solo');
  const sheet = useAnswerSheet(choice, kind === 'sheet');

  const problem = kind === 'solo' ? session.problem : (sheet.rows[sheet.activeIndex]?.problem ?? null);
  const guide = useKeyGuide(problem, showCalc && assist, state.expression.length);

  // 補助を入れている間は、表示形式もその問題の丸め方に合わせる。
  // 本番の四則計算は (1)〜(7) が小数第2位、(8)〜(10) が有効数字3けたで、
  // そのたびに FSE と DIGS を押し直すのは練習の本筋ではない。
  useEffect(() => {
    if (!showCalc || !assist || !problem?.rounding) return;
    const r = problem.rounding;
    applyPreset(
      r.kind === 'decimals'
        ? { formatMode: 'FIX', digits: r.value }
        : { formatMode: 'SCI', digits: r.value }
    );
    // applyPreset は毎回作り直されるので、依存に入れると無限に走る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCalc, assist, problem?.id]);

  // 問題に [RAD] の指定があれば、角度モードもそろえておく
  useEffect(() => {
    if (!problem) return;
    if (state.angleMode !== problem.angleMode) applyPreset({ angleMode: problem.angleMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id]);

  const handlePress = (action: string) => {
    guide.observe(action);
    pressButton(action);
  };

  const display = (
    <CalcDisplay
      expression={`${displayBeforeCursor}${displayAfterCursor}`}
      beforeCursor={displayBeforeCursor}
      afterCursor={displayAfterCursor}
      result={state.result}
      angleMode={state.angleMode}
      shiftActive={state.shiftActive}
      altActive={state.altActive}
      memory={state.memory}
      parenBalance={parenBalance}
      hasError={state.hasError}
      formatLabel={formatModeLabel(state.formatMode, state.digits)}
      base={state.base}
      engShift={state.engShift}
      dmsView={state.dmsView}
      lines={state.lines}
      compact
      showLines={kind === 'solo'}
    />
  );

  const keypad = (
    <CalcKeypad
      shiftActive={state.shiftActive}
      altActive={state.altActive}
      angleMode={state.angleMode}
      onPress={handlePress}
      highlightedAction={guide.nextAction ?? undefined}
    />
  );

  const calcBar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={showCalc ? 'default' : 'outline'}
        className="min-h-11 text-base"
        onClick={onToggleCalc}
        aria-pressed={showCalc}
      >
        {/* 出ている／隠れているは色だけでなく文言でも示す */}
        {showCalc ? '画面の電卓を隠す' : 'このサイトの電卓で打つ'}
      </Button>
      <span className="text-base text-[var(--color-text-muted)]">
        {showCalc
          ? '画面の電卓で計算して答え合わせします'
          : '手もとの電卓で計算し、答えを入力欄に打ちます'}
      </span>
    </div>
  );

  const assistBar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={assist ? 'default' : 'outline'}
        className="min-h-11 text-base"
        onClick={onToggleAssist}
        aria-pressed={assist}
      >
        {/* 入／切は色だけでなく文字でも示す */}
        入力補助 {assist ? '入' : '切'}
      </Button>
      <span className="text-base text-[var(--color-text-muted)]">
        {assist
          ? '次に押すキーを光らせ、表示形式も問題に合わせます'
          : '本番と同じく、手順は自分で決めます'}
      </span>
      {guide.offTrack && (
        // 手順から外れたことは、色だけでなく記号と文言でも示す
        <span className="flex flex-wrap items-center gap-2 rounded border-2 border-[var(--color-danger)] bg-[var(--kj-danger-soft)] px-2 py-1 text-base font-bold text-[var(--color-danger)]">
          ✗ 手順から外れました。
          {guide.extraLength > 0
            ? ` DEL で ${guide.extraLength} 文字消すと、案内が戻ります。`
            : ' DEL で消すと、案内が戻ります。'}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-[var(--color-danger)] font-bold"
            onClick={() => {
              // 余計に打ったぶんだけ消す。ここまでの入力は捨てない。
              for (let i = 0; i < guide.extraLength; i += 1) pressButton('del');
            }}
          >
            余計に打ったぶんを消す
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-[var(--color-danger)]"
            onClick={() => {
              pressButton('ac');
              guide.reset();
            }}
          >
            最初からやり直す
          </Button>
        </span>
      )}
    </div>
  );

  const sheetView = (
    <AnswerSheet
      choice={choice}
      rows={sheet.rows}
      activeIndex={sheet.activeIndex}
      graded={sheet.graded}
      remaining={sheet.remaining}
      correctCount={sheet.correctCount}
      score={sheet.score}
      onSelect={sheet.setActiveIndex}
      onWrite={sheet.write}
      onGrade={sheet.grade}
      onRestart={sheet.restart}
    />
  );

  if (kind === 'sheet' && !showCalc) {
    return (
      <div className="space-y-2">
        {calcBar}
        {sheetView}
      </div>
    );
  }

  if (kind === 'sheet') {
    return (
      <div className="space-y-2">
        {calcBar}
        {assistBar}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className="lg:w-[54%]">{sheetView}</div>
          <div className="space-y-2 lg:flex-1">
            {display}
            <Button
              type="button"
              className="min-h-11 w-full text-base"
              disabled={sheet.graded || sheet.rows.length === 0}
              onClick={() => sheet.writeCurrent(state.result)}
            >
              ({sheet.activeIndex + 1}) の答えとして書く
            </Button>
            {keypad}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {calcBar}
      {showCalc && assistBar}
      <ProblemBar
        problem={session.problem}
        judgement={session.judgement}
        answered={session.answered}
        correct={session.correct}
        directInput={!showCalc}
        onCheck={(typed) =>
          session.check(showCalc ? state.result : normalizeTypedAnswer(typed ?? ''))
        }
        onNext={session.next}
      />
      {showCalc && (
        <>
          {display}
          {keypad}
        </>
      )}
    </div>
  );
}
