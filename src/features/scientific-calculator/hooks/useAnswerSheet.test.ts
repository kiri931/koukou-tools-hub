import { act, renderHook } from '@testing-library/react';
import { SHEET_QUESTION_COUNT, SHEET_SECONDS, useAnswerSheet } from './useAnswerSheet';
import type { ExamChoice } from '../types';

const choice: ExamChoice = { level: '3級', category: '四則計算', mode: 'sheet' };

describe('useAnswerSheet', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('選んだ級と分野から10問を並べる', () => {
    const { result } = renderHook(() => useAnswerSheet(choice, true));
    expect(result.current.total).toBe(SHEET_QUESTION_COUNT);
    expect(result.current.rows.every((r) => r.problem.level === '3級')).toBe(true);
    expect(result.current.rows.every((r) => r.problem.category === '四則計算')).toBe(true);
  });

  it('同じ問題を2度並べない', () => {
    const { result } = renderHook(() => useAnswerSheet(choice, true));
    const ids = result.current.rows.map((r) => r.problem.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('使わないときは作らない', () => {
    const { result } = renderHook(() => useAnswerSheet(choice, false));
    expect(result.current.total).toBe(0);
  });

  it('電卓の値を、いま選んでいる問題に書いて次へ進む', () => {
    const { result } = renderHook(() => useAnswerSheet(choice, true));
    act(() => result.current.writeCurrent('12.34'));
    expect(result.current.rows[0].answer).toBe('12.34');
    expect(result.current.activeIndex).toBe(1);
  });

  it('全問正解なら100点、合格の目安に届く', () => {
    const { result } = renderHook(() => useAnswerSheet(choice, true));
    act(() => {
      result.current.rows.forEach((row, i) => result.current.write(i, row.problem.expectedAnswer));
    });
    act(() => result.current.grade());
    expect(result.current.correctCount).toBe(SHEET_QUESTION_COUNT);
    expect(result.current.score).toBe(100);
  });

  it('半分だけ合っていれば50点', () => {
    const { result } = renderHook(() => useAnswerSheet(choice, true));
    act(() => {
      result.current.rows.forEach((row, i) =>
        result.current.write(i, i < 5 ? row.problem.expectedAnswer : 'ちがう')
      );
    });
    act(() => result.current.grade());
    expect(result.current.score).toBe(50);
  });

  it('採点したあとは書き換えられない', () => {
    const { result } = renderHook(() => useAnswerSheet(choice, true));
    act(() => result.current.grade());
    act(() => result.current.write(0, '999'));
    expect(result.current.rows[0].answer).toBe('');
  });

  it('10分たつと自動で採点する', () => {
    const { result } = renderHook(() => useAnswerSheet(choice, true));
    expect(result.current.remaining).toBe(SHEET_SECONDS);
    act(() => vi.advanceTimersByTime(SHEET_SECONDS * 1000));
    expect(result.current.remaining).toBe(0);
    expect(result.current.graded).toBe(true);
  });

  it('新しい用紙にすると、答えも成績も時間も戻る', () => {
    const { result } = renderHook(() => useAnswerSheet(choice, true));
    act(() => result.current.writeCurrent('1'));
    act(() => result.current.grade());
    act(() => result.current.restart());
    expect(result.current.graded).toBe(false);
    expect(result.current.remaining).toBe(SHEET_SECONDS);
    expect(result.current.rows.every((r) => r.answer === '')).toBe(true);
    expect(result.current.activeIndex).toBe(0);
  });
});
