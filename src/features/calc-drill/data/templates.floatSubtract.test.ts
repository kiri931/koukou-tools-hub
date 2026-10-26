import { describe, expect, it } from 'vitest';
import { TEMPLATES } from './templates';
import { makeRng } from './random';
import { roundTo } from './problems';

/**
 * 3級 四則計算の `a·10ᵖ − b·10^q ÷ (c·10ʳ + d·10ʳ)` の型。
 *
 * 以前は指数を別々に乱数で決めていたため、割り算の結果が第1項より何桁も小さくなり、
 * 有効数字3けたに丸めると答えが第1項そのものになっていた
 * （実測: 10問中10問。例 9.23×10^9 − 3.96×10^6 ÷ (3.38×10^4 + 5.54×10^4) → 9.23×10⁹）。
 * 検定の実物（第94回(10)、第85回(10)）では、引く項は第1項と同じ桁かそれより大きい。
 */
const SHAPE = /^([\d.]+) × 10\^(\d+) - ([\d.]+) × 10\^(\d+) ÷ \( ([\d.]+) × 10\^(\d+) \+ ([\d.]+) × 10\^(\d+) \)$/;
const S3 = { kind: 'sigfigs', value: 3 } as const;

describe('3級 四則計算 a·10ᵖ − b·10^q ÷ (c·10ʳ + d·10ʳ)', () => {
  const tmpl = TEMPLATES['3級'].四則計算[7];

  it('200問作っても、答えが第1項の有効数字3けたと一致する問題が出ない', () => {
    const same: string[] = [];
    for (let seed = 1; seed <= 200; seed += 1) {
      const p = tmpl(makeRng(seed * 7919));
      const m = SHAPE.exec(p.question);
      expect(m, `型が違う: ${p.question}`).not.toBeNull();
      const first = Number(m![1]) * 10 ** Number(m![2]);
      if (roundTo(p.value, S3) === roundTo(first, S3)) same.push(p.question);
    }
    if (same.length) console.log(`第1項と同じ答え ${same.length}/200\n` + same.slice(0, 5).join('\n'));
    expect(same).toEqual([]);
  });

  it('割り算の結果が第1項と同じ桁（±1桁）に収まる', () => {
    const off: string[] = [];
    for (let seed = 1; seed <= 200; seed += 1) {
      const p = tmpl(makeRng(seed * 7919));
      const m = SHAPE.exec(p.question)!;
      const [a, pe, b, q, c, r, d] = [1, 2, 3, 4, 5, 6, 7].map((i) => Number(m[i]));
      const quotient = (b * 10 ** q) / (c * 10 ** r + d * 10 ** r);
      const gap = Math.floor(Math.log10(quotient)) - Math.floor(Math.log10(a * 10 ** pe));
      if (Math.abs(gap) > 1) off.push(`${p.question}（${gap}桁）`);
    }
    if (off.length) console.log(`桁が離れた問題 ${off.length}/200\n` + off.slice(0, 5).join('\n'));
    expect(off).toEqual([]);
  });
});
