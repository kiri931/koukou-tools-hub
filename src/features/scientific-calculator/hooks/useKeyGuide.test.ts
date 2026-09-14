import { act, renderHook } from '@testing-library/react';
import { useKeyGuide, withLayerKeys } from './useKeyGuide';
import type { DrillProblem } from '@/features/calc-drill/types';

function makeProblem(keySequence: string[]): DrillProblem {
  return {
    id: 'x',
    level: '3級',
    category: '四則計算',
    question: '1+1',
    expectedAnswer: '2',
    keySequence,
    angleMode: 'DEG',
  };
}

describe('withLayerKeys', () => {
  it('SHIFT でしか出せないキーの前に SHIFT を差し込む', () => {
    // asin( は sin キーの SHIFT 側
    expect(withLayerKeys(['asin(', '3', '0', '='])).toEqual([
      'toggle-shift', 'asin(', '3', '0', '=',
    ]);
  });

  it('ALT でしか出せないキーの前に ALT を差し込む', () => {
    // abs( は √ キーの ALT 側
    expect(withLayerKeys(['abs(', '8', '='])).toEqual(['toggle-alt', 'abs(', '8', '=']);
  });

  it('そのまま押せるキーには足さない', () => {
    expect(withLayerKeys(['1', '+', '1', '='])).toEqual(['1', '+', '1', '=']);
  });
});

describe('useKeyGuide', () => {
  const problem = makeProblem(['1', '+', '1', '=']);

  it('切っているときは何も光らせない', () => {
    const { result } = renderHook(() => useKeyGuide(problem, false));
    expect(result.current.nextAction).toBeNull();
  });

  it('手順どおりに押すと次のキーへ進む', () => {
    const { result } = renderHook(() => useKeyGuide(problem, true));
    expect(result.current.nextAction).toBe('1');
    act(() => result.current.observe('1'));
    expect(result.current.nextAction).toBe('+');
    act(() => result.current.observe('+'));
    expect(result.current.nextAction).toBe('1');
  });

  it('最後まで押し切ると done になる', () => {
    const { result } = renderHook(() => useKeyGuide(problem, true));
    // 1回のクリック = 1回の描画。まとめて呼ぶと古い状態を見てしまうので1つずつ
    for (const a of ['1', '+', '1', '=']) act(() => result.current.observe(a));
    expect(result.current.done).toBe(true);
    expect(result.current.nextAction).toBeNull();
  });

  it('手順から外れたら案内を止める', () => {
    const { result } = renderHook(() => useKeyGuide(problem, true));
    act(() => result.current.observe('9'));
    expect(result.current.offTrack).toBe(true);
    expect(result.current.nextAction).toBeNull();
  });

  it('表示形式を変えるキーは、外れたとみなさない', () => {
    const { result } = renderHook(() => useKeyGuide(problem, true));
    act(() => result.current.observe('cycle-format'));
    act(() => result.current.observe('digits:3'));
    expect(result.current.offTrack).toBe(false);
    expect(result.current.nextAction).toBe('1');
  });

  it('やり直すと先頭から案内しなおす', () => {
    const { result } = renderHook(() => useKeyGuide(problem, true));
    act(() => result.current.observe('9'));
    act(() => result.current.reset());
    expect(result.current.offTrack).toBe(false);
    expect(result.current.nextAction).toBe('1');
  });
});
