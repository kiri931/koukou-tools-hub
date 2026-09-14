import { useState } from 'react';
import CalcDisplay from '@/features/scientific-calculator/components/CalcDisplay';
import CalcKeypad from '@/features/scientific-calculator/components/CalcKeypad';
import { formatModeLabel } from '@/features/scientific-calculator/hooks/format';
import { useCalculator } from '@/features/scientific-calculator/hooks/useCalculator';
import MathText from '@/features/scientific-calculator/components/MathText';
import { Button } from '@/components/ui/button';
import { KEY_LABELS } from '../lib/keyLabels';
import { tipsFor, type InputTip } from '../data/inputTips';
import type { DrillChoice } from '../types';

interface InputTipsModeProps {
  choice: DrillChoice;
}

/**
 * 直感どおりに打つと別の式になってしまう入力を、1つずつ見せる。
 *
 * 「なぜそうなるか」まで書かないと、押し順を覚えるだけになって
 * 少し形が変わると使えない。紙の書き方 → そのまま打つとどうなるか →
 * なぜ → 正しい押し順、の順に並べてある。
 */
export default function InputTipsMode({ choice }: InputTipsModeProps) {
  const tips = tipsFor(choice.level, choice.category);
  const [openId, setOpenId] = useState<string | null>(null);
  const { state, displayBeforeCursor, displayAfterCursor, parenBalance, pressButton, applyPreset } =
    useCalculator();
  const [tried, setTried] = useState<string | null>(null);

  const tryTip = (tip: InputTip) => {
    pressButton('ac');
    applyPreset({ angleMode: tip.angleMode ?? 'DEG' });
    for (const key of tip.keys) pressButton(key);
    setTried(tip.id);
  };

  if (tips.length === 0) {
    return (
      <p className="rounded-lg border border-slate-300 p-4 text-base dark:border-slate-700">
        {choice.level}・{choice.category} で気をつける入力は、いまのところありません。
        級か分野を変えてみてください。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-base text-slate-600 dark:text-slate-300">
        {choice.level}・{choice.category} で、そのまま左から打つと別の式になるものです。
      </p>

      <ul className="space-y-2">
        {tips.map((tip) => {
          const open = openId === tip.id;
          return (
            <li
              key={tip.id}
              className="rounded-lg border border-slate-400 bg-white dark:border-slate-600 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : tip.id)}
                aria-expanded={open}
                className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-base font-bold"
              >
                {/* 開閉は色ではなく記号で示す */}
                <span aria-hidden="true">{open ? '▼' : '▶'}</span>
                {tip.title}
              </button>

              {open && (
                <div className="space-y-2 border-t border-slate-300 px-3 py-2 text-base dark:border-slate-700">
                  <p>
                    <span className="font-bold">紙の書き方：</span>
                    <MathText>{tip.written}</MathText>
                  </p>
                  <p className="text-rose-900 dark:text-rose-300">
                    <span className="font-bold">そのまま打つと：</span>
                    {tip.naive}
                  </p>
                  <p>
                    <span className="font-bold">なぜ：</span>
                    {tip.why}
                  </p>
                  <p className="flex flex-wrap items-center gap-1">
                    <span className="font-bold">押す順：</span>
                    {tip.keys.map((key, i) => (
                      <span
                        key={i}
                        className="rounded border border-slate-500 px-1.5 py-0.5 font-mono text-base"
                      >
                        {KEY_LABELS[key] ?? key}
                      </span>
                    ))}
                  </p>
                  <Button type="button" className="min-h-11" onClick={() => tryTip(tip)}>
                    この順で電卓に打ってみる
                  </Button>
                  {tried === tip.id && (
                    <p className="font-bold">
                      下の電卓に入りました。答えは {state.result} です。
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

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
      <CalcKeypad
        shiftActive={state.shiftActive}
        altActive={state.altActive}
        angleMode={state.angleMode}
        onPress={pressButton}
      />
    </div>
  );
}
