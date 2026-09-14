import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import CalcDisplay from './CalcDisplay';
import CalcKeypad from './CalcKeypad';
import ConstantsPanel from './ConstantsPanel';
import DigitsPanel from './DigitsPanel';
import HelpSheet from './HelpSheet';
import StatisticsPanel from './StatisticsPanel';
import { formatModeLabel } from '../hooks/format';
import { useCalculator } from '../hooks/useCalculator';
import { useKeyboardInput } from '../hooks/useKeyboardInput';

export default function ScientificCalculator() {
  const [helpOpen, setHelpOpen] = useState(false);
  const {
    state,
    displayBeforeCursor,
    displayAfterCursor,
    parenBalance,
    pressButton,
    setPanelMode,
  } = useCalculator();

  // ヘルプに「キー: Enter または =」と書いてあるのに、これを繋いでいなかった。
  // ドリル側では繋がない（押すキーを制限しているので、キーボードから
  // 素通しできてしまうとガイドの意味がなくなる）。
  useKeyboardInput({ onPress: pressButton });

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={100}>
      <main className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-slate-100">
        <Card className="border-violet-200/80 bg-white/95 dark:border-violet-900/40 dark:bg-slate-900/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">関数電卓</CardTitle>
                <CardDescription>
                  検定の練習に使える電卓です。押した数字はこの端末から出ません。
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  onClick={() => setHelpOpen(true)}
                  aria-label="使い方ガイドを開く"
                >
                  <HelpCircle className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
            />

            <CalcKeypad
              shiftActive={state.shiftActive}
              altActive={state.altActive}
              angleMode={state.angleMode}
              onPress={pressButton}
            />
          </CardContent>
        </Card>

        <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} />
        <StatisticsPanel open={state.panelMode === 'stats'} onOpenChange={(open) => setPanelMode(open ? 'stats' : 'none')} />
        <DigitsPanel
          open={state.panelMode === 'digits'}
          onOpenChange={(open) => setPanelMode(open ? 'digits' : 'none')}
          formatMode={state.formatMode}
          digits={state.digits}
          onPress={pressButton}
        />
        <ConstantsPanel
          open={state.panelMode === 'consts'}
          onOpenChange={(open) => setPanelMode(open ? 'consts' : 'none')}
          onPress={pressButton}
        />
      </main>
    </TooltipProvider>
  );
}
