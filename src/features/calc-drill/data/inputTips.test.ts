import { act, renderHook } from '@testing-library/react';
import { BUTTON_ROWS } from '@/features/scientific-calculator/components/CalcKeypad';
import { useCalculator } from '@/features/scientific-calculator/hooks/useCalculator';
import { INPUT_TIPS, tipsFor } from './inputTips';

const NORMAL = new Set(BUTTON_ROWS.flat().map((b) => b.action));
const SHIFT = new Set(
  BUTTON_ROWS.flat().map((b) => b.shiftAction).filter((a): a is string => Boolean(a))
);
const ALT = new Set(
  BUTTON_ROWS.flat().map((b) => b.altAction).filter((a): a is string => Boolean(a))
);

function play(keys: string[], angleMode: 'DEG' | 'RAD') {
  const { result } = renderHook(() => useCalculator());
  act(() => {
    if (angleMode === 'RAD') result.current.pressButton('toggle-angle');
    for (const action of keys) {
      if (!NORMAL.has(action) && SHIFT.has(action)) result.current.pressButton('toggle-shift');
      else if (!NORMAL.has(action) && ALT.has(action)) result.current.pressButton('toggle-alt');
      result.current.pressButton(action);
    }
  });
  return result.current.state;
}

describe('入力のしかたの解説', () => {
  it('書いてある押し順が、実際にその答えになる', () => {
    // 解説と電卓の中身がずれると、教えている手順が嘘になる。
    // 解説に載せた押し順を、そのまま電卓へ流して確かめる。
    const wrong: string[] = [];
    for (const tip of INPUT_TIPS) {
      const state = play(tip.keys, tip.angleMode ?? 'DEG');
      const got = Number(state.result);
      if (state.hasError || !Number.isFinite(got)) {
        wrong.push(`${tip.id}: 打ち切れない（${state.result}）`);
        continue;
      }
      const tol = Math.max(1e-9, Math.abs(tip.expected) * 1e-9);
      if (Math.abs(got - tip.expected) > tol) {
        wrong.push(`${tip.id}: ${got} / 期待 ${tip.expected}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('押せないキーを書いていない', () => {
    const unknown = INPUT_TIPS.flatMap((t) =>
      t.keys.filter((k) => !NORMAL.has(k) && !SHIFT.has(k) && !ALT.has(k) && !/^[\d.]+$/.test(k))
    );
    expect([...new Set(unknown)]).toEqual([]);
  });

  it('級と分野でしぼれる', () => {
    const ids = tipsFor('3級', '関数計算').map((t) => t.id);
    expect(ids).toContain('trig-square');
    expect(ids).not.toContain('npr-order');
    expect(tipsFor('4級', '関数計算')).toEqual([]);
  });
});
