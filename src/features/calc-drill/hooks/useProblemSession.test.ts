import { act, renderHook } from '@testing-library/react';
import { useProblemSession } from './useProblemSession';
import type { DrillChoice } from '../types';


const choice: DrillChoice = { level: '3級', category: '関数計算' };

describe('useProblemSession', () => {
  it('選んだ級と分野の問題だけを出す', () => {
    const { result } = renderHook(() => useProblemSession(choice, true));
    expect(result.current.total).toBeGreaterThan(0);
    expect(result.current.problem?.level).toBe('3級');
    expect(result.current.problem?.category).toBe('関数計算');
  });

  it('使わないときは問題を作らない', () => {
    const { result } = renderHook(() => useProblemSession(choice, false));
    expect(result.current.total).toBe(0);
    expect(result.current.problem).toBeNull();
  });

  it('正しい答えを入れると正解になり、正解数が増える', () => {
    const { result } = renderHook(() => useProblemSession(choice, true));
    const answer = result.current.problem!.expectedAnswer;
    act(() => result.current.check(answer));
    expect(result.current.judgement.kind).toBe('correct');
    expect(result.current.answered).toBe(1);
    expect(result.current.correct).toBe(1);
  });

  it('ちがう答えだと不正解になり、正しい答えを見せる', () => {
    const { result } = renderHook(() => useProblemSession(choice, true));
    const expected = result.current.problem!.expectedAnswer;
    act(() => result.current.check('0.0000001'));
    expect(result.current.judgement).toEqual({ kind: 'wrong', answer: expected });
    expect(result.current.answered).toBe(1);
    expect(result.current.correct).toBe(0);
  });

  it('答え合わせは1問につき1回だけ数える', () => {
    const { result } = renderHook(() => useProblemSession(choice, true));
    const answer = result.current.problem!.expectedAnswer;
    act(() => result.current.check(answer));
    act(() => result.current.check('999'));
    expect(result.current.answered).toBe(1);
    expect(result.current.correct).toBe(1);
  });

  it('次の問題へ進むと、別の問題になって判定が消える', () => {
    const { result } = renderHook(() => useProblemSession(choice, true));
    const first = result.current.problem!.id;
    act(() => result.current.check('0'));
    act(() => result.current.next());
    expect(result.current.judgement.kind).toBe('none');
    expect(result.current.problem!.id).not.toBe(first);
  });

  it('やり直すと成績が0に戻る', () => {
    const { result } = renderHook(() => useProblemSession(choice, true));
    act(() => result.current.check('0'));
    act(() => result.current.restart());
    expect(result.current.answered).toBe(0);
    expect(result.current.correct).toBe(0);
    expect(result.current.judgement.kind).toBe('none');
  });
});
