import { useEffect, useState } from 'react';
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
      {/* <main> と h1（関数電卓）はページ側（.astro）が持つ。外枠もページの kj-tool-frame が持つので、
          ここでカードを重ねない。 */}
      <div className="mx-auto max-w-3xl">
        <div className="space-y-6">
            <p className="text-base text-[var(--color-text-muted)]">
              検定の練習に使える電卓です。押した数字はこの端末から出ません。
            </p>
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
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]'
                    )}
                  >
                    {theme === name ? `✓ ${KEYPAD_THEMES[name].label}` : KEYPAD_THEMES[name].label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-base text-[var(--color-text-muted)]">
                {KEYPAD_THEMES[theme].description}
              </p>
            </fieldset>

            <Button type="button" size="lg" className="w-full text-lg" onClick={() => setOpen(true)}>
              電卓をひらく
            </Button>

            <p className="text-base text-[var(--color-text-muted)]">
              検定と同じ形の問題を解く練習は{' '}
              <a className="text-[var(--color-accent)] underline underline-offset-2" href="/tools/calc-drill/">
                計算技術検定ドリル
              </a>{' '}
              にあります。同じ電卓を使います。
            </p>
        </div>

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
      </div>
    </TooltipProvider>
  );
}
