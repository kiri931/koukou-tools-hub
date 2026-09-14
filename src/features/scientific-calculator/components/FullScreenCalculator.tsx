import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CalcDisplay from './CalcDisplay';
import CalcKeypad from './CalcKeypad';
import ProblemBar from './ProblemBar';
import { formatModeLabel } from '../hooks/format';
import { presetFor } from '../exam-presets';
import { KEYPAD_THEMES, type KeypadTheme } from '../keypad-themes';
import type { Judgement } from '../hooks/useProblemSession';
import type { DrillProblem } from '@/features/calc-drill/types';
import type { CalculatorState, ExamChoice } from '../types';

interface FullScreenCalculatorProps {
  choice: ExamChoice;
  state: CalculatorState;
  displayBeforeCursor: string;
  displayAfterCursor: string;
  parenBalance: number;
  onPress: (action: string) => void;
  onBack: () => void;
  onHelp: () => void;
  theme: KeypadTheme;
  /** 問題モードのときだけ渡す */
  problem?: DrillProblem | null;
  judgement?: Judgement;
  answered?: number;
  correct?: number;
  onCheck?: () => void;
  onNext?: () => void;
}

/**
 * iPad の1画面で完結させる電卓。
 * 画面の高さをそのまま使い、キーは残りの高さを等分する（CalcKeypad の fill）。
 * ページの説明文は下に残したままこの層が覆うので、検索やAdSense向けの本文は消えない。
 */
export default function FullScreenCalculator({
  choice,
  state,
  displayBeforeCursor,
  displayAfterCursor,
  parenBalance,
  onPress,
  onBack,
  onHelp,
  theme,
  problem,
  judgement,
  answered = 0,
  correct = 0,
  onCheck,
  onNext,
}: FullScreenCalculatorProps) {
  const preset = presetFor(choice);
  const showProblems = choice.mode === 'problems';

  const chip = (
    <span className="rounded-md bg-violet-800 px-2 py-1 text-base font-bold text-white dark:bg-violet-200 dark:text-slate-950">
      {choice.level}・{choice.category}
    </span>
  );

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={onHelp}
        className="min-h-11 gap-1 border-slate-500 dark:border-slate-400"
      >
        <HelpCircle className="size-4" aria-hidden="true" />
        使い方
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        className="min-h-11 gap-1 border-slate-500 dark:border-slate-400"
      >
        <X className="size-4" aria-hidden="true" />
        選び直す
      </Button>
    </>
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex h-[100dvh] flex-col gap-1.5 p-2 ${KEYPAD_THEMES[theme].surface}`}
    >
      {/* 級・分野のしるしと、画面から出るためのボタン。
          問題モードでは帯を別に出さず、問題の行へ寄せて高さを節約する。 */}
      {!showProblems && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {chip}
          <span className="hidden text-base text-slate-700 dark:text-slate-300 [@media(min-height:760px)]:inline">
            {preset.roundingHint}
          </span>
          <span className="ml-auto flex items-center gap-2">{actions}</span>
        </div>
      )}

      {showProblems && judgement && onCheck && onNext && (
        <div className="shrink-0">
          <ProblemBar
            leading={chip}
            trailing={actions}
            problem={problem ?? null}
            judgement={judgement}
            answered={answered}
            correct={correct}
            onCheck={onCheck}
            onNext={onNext}
          />
        </div>
      )}

      <div className="shrink-0">
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
          theme={theme}
          showLines={!showProblems}
        />
      </div>

      {/* 通常の iPad なら収まる。極端に低い画面ではここだけが縦に動く。 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <CalcKeypad
          shiftActive={state.shiftActive}
          altActive={state.altActive}
          fill
          theme={theme}
          angleMode={state.angleMode}
          onPress={onPress}
        />
      </div>
    </div>
  );
}
