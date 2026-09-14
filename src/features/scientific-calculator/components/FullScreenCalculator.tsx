import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CalcDisplay from './CalcDisplay';
import CalcKeypad from './CalcKeypad';
import { formatModeLabel } from '../hooks/format';
import { presetFor } from '../exam-presets';
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
}: FullScreenCalculatorProps) {
  const preset = presetFor(choice);

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col gap-1.5 bg-slate-100 p-2 dark:bg-slate-950">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="rounded-md bg-violet-700 px-2 py-1 text-base font-bold text-white dark:bg-violet-300 dark:text-slate-900">
          {choice.level}・{choice.category}
        </span>
        {/* 画面が低いと1行ぶんが惜しいので、目安は縦に余裕があるときだけ出す */}
        <span className="hidden text-base text-slate-700 dark:text-slate-300 [@media(min-height:760px)]:inline">
          {preset.roundingHint}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onHelp} className="min-h-11 gap-1">
            <HelpCircle className="size-4" aria-hidden="true" />
            使い方
          </Button>
          <Button type="button" variant="outline" onClick={onBack} className="min-h-11 gap-1">
            <X className="size-4" aria-hidden="true" />
            選び直す
          </Button>
        </span>
      </div>

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
        />
      </div>

      {/* 通常の iPad なら収まる。極端に低い画面ではここだけが縦に動く。 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <CalcKeypad
          shiftActive={state.shiftActive}
          altActive={state.altActive}
          fill
          angleMode={state.angleMode}
          onPress={onPress}
        />
      </div>
    </div>
  );
}
