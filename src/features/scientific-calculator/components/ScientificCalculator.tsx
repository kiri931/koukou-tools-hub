import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ConstantsPanel from './ConstantsPanel';
import DigitsPanel from './DigitsPanel';
import FullScreenCalculator from './FullScreenCalculator';
import HelpSheet from './HelpSheet';
import StatisticsPanel from './StatisticsPanel';
import {
  DEFAULT_THEME,
  KEYPAD_THEMES,
  THEME_ORDER,
  loadTheme,
  saveTheme,
  type KeypadTheme,
} from '../keypad-themes';
import { useCalculator } from '../hooks/useCalculator';
import { useKeyboardInput } from '../hooks/useKeyboardInput';

/**
 * 関数電卓そのもの。
 *
 * 検定の問題を出す・答え合わせをする・解答用紙で解く、といった練習は
 * 計算技術検定ドリル(/tools/calc-drill/)に寄せてある。
 * 同じものを2つのページに置くと、直すときに片方だけ古くなるため。
 */
export default function ScientificCalculator() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [theme, setTheme] = useState<KeypadTheme>(DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  const {
    state,
    displayBeforeCursor,
    displayAfterCursor,
    parenBalance,
    pressButton,
    setPanelMode,
  } = useCalculator();

  useEffect(() => {
    setTheme(loadTheme());
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
  useKeyboardInput({ onPress: pressButton });

  const changeTheme = (next: KeypadTheme) => {
    setTheme(next);
    saveTheme(next);
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
          <CardContent className="space-y-6">
            <fieldset>
              <legend className="text-base font-semibold">色</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {THEME_ORDER.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => changeTheme(name)}
                    aria-pressed={theme === name}
                    className={cn(
                      // 選択中は色だけでなく「✓」と太い枠でも示す
                      'min-h-11 rounded-lg border-2 px-4 py-2 text-base font-semibold transition',
                      theme === name
                        ? 'border-violet-700 bg-violet-700 text-white dark:border-violet-300 dark:bg-violet-300 dark:text-slate-900'
                        : 'border-slate-400 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {theme === name ? `✓ ${KEYPAD_THEMES[name].label}` : KEYPAD_THEMES[name].label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-base text-slate-700 dark:text-slate-300">
                {KEYPAD_THEMES[theme].description}
              </p>
            </fieldset>

            <Button type="button" size="lg" className="w-full text-lg" onClick={() => setOpen(true)}>
              電卓をひらく
            </Button>

            <p className="text-base text-slate-700 dark:text-slate-300">
              検定と同じ形の問題を解く練習は{' '}
              <a className="underline" href="/tools/calc-drill/">
                計算技術検定ドリル
              </a>{' '}
              にあります。同じ電卓を使います。
            </p>
          </CardContent>
        </Card>

        {open && (
          <FullScreenCalculator
            state={state}
            displayBeforeCursor={displayBeforeCursor}
            displayAfterCursor={displayAfterCursor}
            parenBalance={parenBalance}
            onPress={pressButton}
            onBack={() => {
              setOpen(false);
              window.scrollTo({ top: 0 });
            }}
            onHelp={() => setHelpOpen(true)}
            theme={theme}
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
