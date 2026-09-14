import type { CalculatorState } from '../types';

const OPERATORS = ['+', '-', '*', '/', '^'] as const;

function isOperator(char?: string) {
  return !!char && OPERATORS.includes(char as (typeof OPERATORS)[number]);
}

/** カーソル位置。古い呼び出し元が渡してこない場合は末尾とみなす。 */
export function cursorOf(state: CalculatorState) {
  return state.cursorPos ?? state.expression.length;
}

/** カーソルより前の文字列 */
export function leftOf(state: CalculatorState) {
  return state.expression.slice(0, cursorOf(state));
}

/** カーソルより後ろの文字列 */
export function rightOf(state: CalculatorState) {
  return state.expression.slice(cursorOf(state));
}

/** カーソルより前だけを差し替える。カーソルはその末尾へ移る。 */
export function replaceLeft(state: CalculatorState, newLeft: string): CalculatorState {
  const right = rightOf(state);
  return { ...state, expression: `${newLeft}${right}`, cursorPos: newLeft.length };
}

/** 式を丸ごと置き換える（カーソルは末尾へ） */
export function replaceAll(state: CalculatorState, expression: string): CalculatorState {
  return { ...state, expression, cursorPos: expression.length };
}

export function applyInsertText(
  prev: CalculatorState,
  token: string,
  options?: { resetAfterEval?: boolean }
): CalculatorState {
  const resetAfterEval = options?.resetAfterEval ?? false;
  const shouldReset = prev.hasError || (prev.justEvaluated && resetAfterEval);
  if (shouldReset) {
    return {
      ...replaceAll(prev, token),
      result: '0',
      resultValue: null,
      hasError: false,
      justEvaluated: false,
    };
  }
  return {
    ...replaceLeft(prev, `${leftOf(prev)}${token}`),
    hasError: false,
    justEvaluated: false,
  };
}

export function applyInsertOperator(prev: CalculatorState, operator: string): CalculatorState {
  // 直前に = を押していたら、その答えから続ける
  if (prev.justEvaluated && !prev.hasError) {
    const seed = prev.result;
    const normalized = seed || (operator === '-' ? '' : '0');
    return {
      ...replaceAll(prev, `${normalized}${operator}`),
      justEvaluated: false,
      hasError: false,
    };
  }

  const left = leftOf(prev);
  const normalized = left || (operator === '-' ? '' : '0');

  if (!normalized && operator === '-') {
    return { ...replaceLeft(prev, '-'), justEvaluated: false, hasError: false };
  }

  const last = normalized.slice(-1);
  // 演算子を続けて押したら差し替える（実機と同じ）
  const newLeft = isOperator(last)
    ? `${normalized.slice(0, -1)}${operator}`
    : `${normalized}${operator}`;

  return { ...replaceLeft(prev, newLeft), justEvaluated: false, hasError: false };
}
