import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { BUTTON_ROWS } from '@/features/scientific-calculator/components/CalcKeypad';
import { useCalculator } from '@/features/scientific-calculator/hooks/useCalculator';
import type { DrillProblem } from '../types';
import { generateProblems, roundTo } from './problems';

const NORMAL_ACTIONS = new Set(BUTTON_ROWS.flat().map((b) => b.action));
const SHIFT_ACTIONS = new Set(
  BUTTON_ROWS.flat()
    .map((b) => b.shiftAction)
    .filter((a): a is string => Boolean(a))
);

type PlayResult = { ok: true; value: number } | { ok: false; reason: string };

/**
 * 生成したキー列を本物の電卓に1キーずつ流し込む。
 * 期待値はテンプレート側が素の JavaScript で別に計算しているので、
 * これは「ガイドと式が食い違っていないか」の突き合わせになる。
 */
function play(problem: DrillProblem): PlayResult {
  const missing = problem.keySequence.filter(
    (a) => !NORMAL_ACTIONS.has(a) && !SHIFT_ACTIONS.has(a)
  );
  if (missing.length > 0) {
    return { ok: false, reason: `押せないキー: ${[...new Set(missing)].join(' ')}` };
  }

  const { result } = renderHook(() => useCalculator());
  act(() => {
    if (result.current.state.angleMode !== problem.angleMode) {
      result.current.pressButton('toggle-angle');
    }
    for (const action of problem.keySequence) {
      // SHIFT はデータに書かず、必要なときにここで差し込む（本番の useCalcDrill と同じ規則）
      if (SHIFT_ACTIONS.has(action) && !NORMAL_ACTIONS.has(action)) {
        result.current.pressButton('toggle-shift');
      }
      result.current.pressButton(action);
    }
  });

  const state = result.current.state;
  if (state.hasError) return { ok: false, reason: `= でエラー: 式="${state.expression}" ${state.result}` };
  const value = Number(state.result);
  if (!Number.isFinite(value)) return { ok: false, reason: `答えが数値でない: ${state.result}` };
  return { ok: true, value };
}

function check(problem: DrillProblem): string | null {
  const played = play(problem);
  if (!played.ok) return played.reason;

  const want = Number(problem.expectedAnswer);
  const got = roundTo(played.value, problem.rounding);
  const rounded = roundTo(want, problem.rounding);
  const rel =
    Math.abs(rounded) > 1e-12 ? Math.abs((got - rounded) / rounded) : Math.abs(got - rounded);
  if (rel >= 0.005) {
    return `答えが合わない: 表示 ${problem.expectedAnswer} / 電卓 ${played.value}`;
  }
  return null;
}

describe('計算技術検定ドリルの類題生成', () => {
  it('50通りの種で作った類題が、すべて打ち切れて答えも一致する', () => {
    const failures: string[] = [];
    let count = 0;

    for (let seed = 1; seed <= 50; seed += 1) {
      for (const problem of generateProblems(seed, 1)) {
        count += 1;
        const reason = check(problem);
        if (reason) {
          failures.push(`種${seed} ${problem.id} [${problem.level}/${problem.category}] ${problem.question} → ${reason}`);
        }
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `${count} 問中 ${failures.length} 問が通りませんでした。\n` +
          failures.slice(0, 25).join('\n') +
          (failures.length > 25 ? `\n…ほか ${failures.length - 25} 問` : '')
      );
    }
    expect(count).toBeGreaterThan(1000);
  });

  it('同じ種からは同じ問題ができる', () => {
    expect(generateProblems(42)).toEqual(generateProblems(42));
    expect(generateProblems(42)).not.toEqual(generateProblems(43));
  });

  it('出題は2級・3級・4級で、区分も検定どおり', () => {
    const problems = generateProblems(7);
    const seen = new Map<string, Set<string>>();
    for (const p of problems) {
      if (!seen.has(p.level)) seen.set(p.level, new Set());
      seen.get(p.level)!.add(p.category);
    }
    expect([...seen.keys()].sort()).toEqual(['2級', '3級', '4級']);
    expect([...seen.get('4級')!].sort()).toEqual(['四則計算', '実務計算', '集計計算'].sort());
    expect([...seen.get('3級')!].sort()).toEqual(['四則計算', '実務計算', '関数計算'].sort());
    // 2級だけ構成が違う。四則計算が無く、方程式と不等式が入る。
    expect([...seen.get('2級')!].sort()).toEqual(['応用計算', '方程式と不等式', '関数計算'].sort());
  });

  it('答えが極端な値になる問題を出さない', () => {
    const wild: string[] = [];
    for (let seed = 1; seed <= 30; seed += 1) {
      for (const p of generateProblems(seed, 1)) {
        const v = Math.abs(Number(p.expectedAnswer));
        if (v !== 0 && (v > 1e13 || v < 1e-13)) {
          wild.push(`種${seed} ${p.id} ${p.question} = ${p.expectedAnswer}`);
        }
      }
    }
    expect(wild).toEqual([]);
  });
});
