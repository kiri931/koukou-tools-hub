import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import CalculatorSetup from './CalculatorSetup';
import ConstantsPanel from './ConstantsPanel';
import DigitsPanel from './DigitsPanel';
import FullScreenCalculator from './FullScreenCalculator';
import HelpSheet from './HelpSheet';
import StatisticsPanel from './StatisticsPanel';
import { DEFAULT_CHOICE, loadChoice, presetFor, saveChoice } from '../exam-presets';
import { useCalculator } from '../hooks/useCalculator';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import type { ExamChoice } from '../types';

export default function ScientificCalculator() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [choice, setChoice] = useState<ExamChoice>(DEFAULT_CHOICE);
  const [open, setOpen] = useState(false);
  const {
    state,
    displayBeforeCursor,
    displayAfterCursor,
    parenBalance,
    pressButton,
    setPanelMode,
    applyPreset,
  } = useCalculator();

  // 前回選んだ級・分野を既定にする。選択画面自体は毎回出す。
  useEffect(() => {
    setChoice(loadChoice());
  }, []);

  // 電卓を開いている間だけ、裏のページがスクロールしないようにする
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // ヘルプに「キー: Enter または =」と書いてあるのに、これを繋いでいなかった。
  // ドリル側では繋がない（押すキーを制限しているので、キーボードから
  // 素通しできてしまうとガイドの意味がなくなる）。
  useKeyboardInput({ onPress: pressButton });

  const start = () => {
    const preset = presetFor(choice);
    applyPreset({
      angleMode: preset.angleMode,
      formatMode: preset.formatMode,
      digits: preset.digits,
      base: preset.base,
    });
    saveChoice(choice);
    setOpen(true);
  };

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={100}>
      <main className="mx-auto max-w-3xl px-4 py-8 text-slate-900 dark:text-slate-100">
        <Card className="border-violet-200/80 bg-white/95 dark:border-violet-900/40 dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-2xl">関数電卓</CardTitle>
            <CardDescription className="text-base">
              検定の練習に使える電卓です。押した数字はこの端末から出ません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalculatorSetup choice={choice} onChange={setChoice} onStart={start} />
          </CardContent>
        </Card>

        {open && (
          <FullScreenCalculator
            choice={choice}
            state={state}
            displayBeforeCursor={displayBeforeCursor}
            displayAfterCursor={displayAfterCursor}
            parenBalance={parenBalance}
            onPress={pressButton}
            onBack={() => {
              setOpen(false);
              // 全画面から戻ると裏のページの位置が残る。選択画面が見える位置へ戻す
              window.scrollTo({ top: 0 });
            }}
            onHelp={() => setHelpOpen(true)}
          />
        )}

        <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} />
        <StatisticsPanel
          open={state.panelMode === 'stats'}
          onOpenChange={(next) => setPanelMode(next ? 'stats' : 'none')}
        />
        <DigitsPanel
          open={state.panelMode === 'digits'}
          onOpenChange={(next) => setPanelMode(next ? 'digits' : 'none')}
          formatMode={state.formatMode}
          digits={state.digits}
          onPress={pressButton}
        />
        <ConstantsPanel
          open={state.panelMode === 'consts'}
          onOpenChange={(next) => setPanelMode(next ? 'consts' : 'none')}
          onPress={pressButton}
        />
      </main>
    </TooltipProvider>
  );
}
