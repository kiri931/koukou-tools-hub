import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CalcDisplay from './CalcDisplay';
import CalcKeypad from './CalcKeypad';
import { formatModeLabel } from '../hooks/format';
import { KEYPAD_THEMES, type KeypadTheme } from '../keypad-themes';
import type { CalculatorState } from '../types';

interface FullScreenCalculatorProps {
  state: CalculatorState;
  displayBeforeCursor: string;
  displayAfterCursor: string;
  parenBalance: number;
  onPress: (action: string) => void;
  onBack: () => void;
  onHelp: () => void;
  theme: KeypadTheme;
}

/**
 * iPad の1画面で完結させる電卓。
 * 画面の高さをそのまま使い、キーは残りの高さを等分する（CalcKeypad の fill）。
 * ページの説明文は下に残したままこの層が覆うので、検索やAdSense向けの本文は消えない。
 */
export default function FullScreenCalculator({
  state,
  displayBeforeCursor,
  displayAfterCursor,
  parenBalance,
  onPress,
  onBack,
  onHelp,
  theme,
}: FullScreenCalculatorProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex h-[100dvh] flex-col gap-1.5 p-2 ${KEYPAD_THEMES[theme].surface}`}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="ml-auto flex items-center gap-2">
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
            とじる
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
          theme={theme}
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
