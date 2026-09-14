import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCalculator } from '@/features/scientific-calculator/hooks/useCalculator';
import { BUTTON_ROWS } from '@/features/scientific-calculator/components/CalcKeypad';
import { TEMPLATES } from '@/features/calc-drill/data/templates';
import { makeRng } from '@/features/calc-drill/data/random';
import { parseGuideToKeySequence } from '@/features/calc-drill/data/parseGuide';

const NORMAL = new Set(BUTTON_ROWS.flat().map((b) => b.action));
const SHIFT = new Set(BUTTON_ROWS.flat().map((b) => b.shiftAction).filter(Boolean) as string[]);

function play(actions: string[], angleMode: 'DEG' | 'RAD') {
  const { result } = renderHook(() => useCalculator());
  act(() => {
    if (angleMode === 'RAD') result.current.pressButton('toggle-angle');
    for (const a of actions) {
      if (!NORMAL.has(a) && SHIFT.has(a)) result.current.pressButton('toggle-shift');
      result.current.pressButton(a);
    }
  });
  return Number(result.current.state.result);
}

/**
 * 類題テンプレートを1つ残らず、40通りの種で実際に電卓へ打ち込んで検算する。
 *
 * problems.diagnostic.test.ts は「出題される問題」を50通りの種で見るが、
 * どのテンプレートが当たるかは運なので、使われていないテンプレートが
 * 素通りしうる。こちらは **全テンプレート × 全種** を必ず通す。
 * （実測: これで sin² と log(a-b) のガイドの閉じかっこ違い、
 *   小数点をトークンに含めていない誤りが見つかった）
 */
describe('類題テンプレートの全数検算', () => {
  it('すべてのテンプレートが打ち切れて、ガイドの答えと value が一致する', () => {
    const bad: string[] = [];
    for (const [level, cats] of Object.entries(TEMPLATES)) {
      for (const [cat, list] of Object.entries(cats)) {
        list.forEach((tmpl, i) => {
          for (let seed = 1; seed <= 40; seed += 1) {
            const p = tmpl(makeRng(seed * 7919));
            let played: number;
            try {
              played = play(parseGuideToKeySequence(p.guide), p.angleMode ?? 'DEG');
            } catch (e) {
              bad.push(`${level}/${cat}[${i}] seed${seed}: 打てない (${String(e)})`);
              break;
            }
            const tol = Math.max(1e-6, Math.abs(p.value) * 1e-9);
            if (!Number.isFinite(played) || Math.abs(played - p.value) > tol) {
              bad.push(`${level}/${cat}[${i}] seed${seed}: ${p.question} → 打つと ${played} / valueは ${p.value}`);
              break;
            }
          }
        });
      }
    }
    if (bad.length) console.log('\n' + bad.join('\n'));
    expect(bad).toEqual([]);
  });
});
