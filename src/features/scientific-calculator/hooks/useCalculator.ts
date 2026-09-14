import { useMemo, useState } from 'react';
import { evaluate } from 'mathjs';
import type {
  AngleMode,
  CalculatorState,
  NumberBase,
  NumberFormatMode,
  PanelMode,
} from '../types';
import {
  applyInsertOperator,
  applyInsertText,
  cursorOf,
  leftOf,
  replaceAll,
  replaceLeft,
} from './calculatorStateTransitions';
import { baseAllowsChar, formatNumberLike, formatResult } from './format';
import {
  countParenBalance,
  formatExpressionForDisplay,
  nextDmsSeparator,
  prepareForEval,
  splitTrailingOperand,
} from './expression';

function isDigitAction(action: string) {
  return /^[0-9]$/.test(action);
}

function isHexDigitAction(action: string) {
  return /^[A-F]$/.test(action);
}

function formatEvalResult(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return Number(value);
  if (value && typeof value === 'object' && 'valueOf' in value) {
    const primitive = (value as { valueOf: () => unknown }).valueOf();
    if (typeof primitive === 'number') return Number.isFinite(primitive) ? primitive : null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function factorialSafe(n: number) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('階乗は0以上の整数のみ対応');
  }
  if (n > 170) {
    throw new Error('階乗は170以下のみ対応');
  }
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

/** 物理定数（CODATA 2018）。Const キーから入れる。 */
export const PHYSICAL_CONSTANTS = [
  { key: 'c', label: '光速 c', value: 299792458, unit: 'm/s' },
  { key: 'g', label: '重力加速度 g', value: 9.80665, unit: 'm/s²' },
  { key: 'h', label: 'プランク定数 h', value: 6.62607015e-34, unit: 'J·s' },
  { key: 'qe', label: '電気素量 qe', value: 1.602176634e-19, unit: 'C' },
  { key: 'NA', label: 'アボガドロ定数 NA', value: 6.02214076e23, unit: '1/mol' },
  { key: 'R', label: '気体定数 R', value: 8.314462618, unit: 'J/(mol·K)' },
  { key: 'kB', label: 'ボルツマン定数 k', value: 1.380649e-23, unit: 'J/K' },
  { key: 'G', label: '万有引力定数 G', value: 6.6743e-11, unit: 'N·m²/kg²' },
] as const;

function toRadFactor(angleMode: AngleMode) {
  if (angleMode === 'DEG') return Math.PI / 180;
  if (angleMode === 'GRAD') return Math.PI / 200;
  return 1;
}

function buildScope(angleMode: AngleMode, memory: number) {
  const factor = toRadFactor(angleMode);
  const toRad = (x: number) => x * factor;
  const fromRad = (x: number) => x / factor;
  return {
    sin: (x: number) => Math.sin(toRad(x)),
    cos: (x: number) => Math.cos(toRad(x)),
    tan: (x: number) => Math.tan(toRad(x)),
    asin: (x: number) => fromRad(Math.asin(x)),
    acos: (x: number) => fromRad(Math.acos(x)),
    atan: (x: number) => fromRad(Math.atan(x)),
    sqrt: (x: number) => Math.sqrt(x),
    cbrt: (x: number) => Math.cbrt(x),
    abs: (x: number) => Math.abs(x),
    inv: (x: number) => 1 / x,
    mod: (a: number, b: number) => a % b,
    // 打つ順（4 ʸ√x 3.56 = 3.56の4乗根）と引数の順を一致させる
    xroot: (n: number, a: number) => (a < 0 && Number.isInteger(n) && n % 2 !== 0 ? -((-a) ** (1 / n)) : a ** (1 / n)),
    log: (x: number) => Math.log10(x),
    ln: (x: number) => Math.log(x),
    exp: (x: number) => Math.exp(x),
    pow10: (x: number) => 10 ** x,
    fact: factorialSafe,
    nPr: (n: number, r: number) => factorialSafe(n) / factorialSafe(n - r),
    nCr: (n: number, r: number) => factorialSafe(n) / (factorialSafe(r) * factorialSafe(n - r)),
    // Pol / Rec は答えが2つあるので、主たる値（r / x）を返し、
    // もう一方は pressButton 側で別に計算して表示する。
    pol: (x: number, y: number) => Math.sqrt(x * x + y * y),
    polTheta: (x: number, y: number) => Math.atan2(y, x) / factor,
    rec: (r: number, theta: number) => r * Math.cos(theta * factor),
    recY: (r: number, theta: number) => r * Math.sin(theta * factor),
    pi: Math.PI,
    e: Math.E,
    M: memory,
    ...Object.fromEntries(PHYSICAL_CONSTANTS.map((c) => [c.key, c.value])),
  };
}

function parseEvalNumber(
  expression: string,
  angleMode: AngleMode,
  memory: number,
  base: NumberBase
): number {
  const value = evaluate(prepareForEval(expression, base), buildScope(angleMode, memory));
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) throw new Error('計算結果が無効です');
  return base === 'DEC' ? numeric : Math.trunc(numeric);
}

function appendWithImplicitMultiplication(base: string, token: string) {
  const trimmed = base.trimEnd();
  const last = trimmed.slice(-1);
  if (trimmed && (/[0-9.]$/.test(trimmed) || last === ')')) {
    return `${trimmed}*${token}`;
  }
  return `${trimmed}${token}`;
}

export function createInitialState(): CalculatorState {
  return {
    expression: '',
    cursorPos: 0,
    result: '0',
    resultValue: null,
    justEvaluated: false,
    hasError: false,
    shiftActive: false,
    altActive: false,
    angleMode: 'DEG',
    formatMode: 'NORM',
    digits: 6,
    base: 'DEC',
    engShift: 0,
    dmsView: false,
    panelMode: 'none',
    memory: 0,
    lines: [],
    inputHistory: [],
    historyCursor: null,
  };
}

const PREFIX_FUNCTIONS = new Set([
  'sqrt(', 'cbrt(', 'sin(', 'cos(', 'tan(',
  'asin(', 'acos(', 'atan(', 'log(', 'pow10(', 'ln(', 'exp(',
  'abs(', 'pol(', 'rec(', 'mod(',
]);

const INFIX_FUNCTIONS: Record<string, string> = {
  'xroot(': 'xroot',
  'nPr(': 'nPr',
  'nCr(': 'nCr',
};

const ANGLE_CYCLE: AngleMode[] = ['DEG', 'RAD', 'GRAD'];
const FORMAT_CYCLE: NumberFormatMode[] = ['NORM', 'FIX', 'SCI', 'ENG'];

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(createInitialState);

  const parenBalance = useMemo(() => countParenBalance(state.expression), [state.expression]);
  const displayExpression = useMemo(
    () => formatExpressionForDisplay(state.expression),
    [state.expression]
  );
  /** カーソルの前後に分けた表示（カーソル位置を画面に出すため） */
  const displayBeforeCursor = useMemo(
    () => formatExpressionForDisplay(state.expression.slice(0, cursorOf(state))),
    [state.expression, state.cursorPos]
  );
  const displayAfterCursor = useMemo(
    () => formatExpressionForDisplay(state.expression.slice(cursorOf(state))),
    [state.expression, state.cursorPos]
  );

  const clearLayersIfNeeded = (consumed: boolean) => {
    if (!consumed) return;
    setState((prev) =>
      prev.shiftActive || prev.altActive ? { ...prev, shiftActive: false, altActive: false } : prev
    );
  };

  const evaluateExpression = () => {
    setState((prev) => {
      if (!prev.expression.trim()) return prev;
      const sourceExpression = prev.expression;
      try {
        const raw = evaluate(
          prepareForEval(sourceExpression, prev.base),
          buildScope(prev.angleMode, prev.memory)
        );
        const numeric = formatEvalResult(raw);
        if (numeric === null) {
          return { ...prev, result: 'Error', hasError: true, justEvaluated: true };
        }
        const value = prev.base === 'DEC' ? numeric : Math.trunc(numeric);
        const formatted = formatResult(value, {
          formatMode: prev.formatMode,
          digits: prev.digits,
          base: prev.base,
          engShift: 0,
        });

        // Pol / Rec は2つ目の答えも出す
        let secondary: string | null = null;
        if (/\bpol\(/.test(sourceExpression) || /\brec\(/.test(sourceExpression)) {
          const isPol = /\bpol\(/.test(sourceExpression);
          const twin = sourceExpression.replace(isPol ? /\bpol\(/g : /\brec\(/g, isPol ? 'polTheta(' : 'recY(');
          try {
            const twinValue = formatEvalResult(
              evaluate(prepareForEval(twin, prev.base), buildScope(prev.angleMode, prev.memory))
            );
            if (twinValue !== null) {
              const label = isPol ? 'θ' : 'y';
              secondary = `${label}=${formatResult(twinValue, {
                formatMode: prev.formatMode,
                digits: prev.digits,
                base: prev.base,
              })}`;
            }
          } catch {
            secondary = null;
          }
        }

        const resultLine = `=${formatted}${secondary ? `  ${secondary}` : ''}`;
        const lines = [
          ...prev.lines,
          { text: formatExpressionForDisplay(sourceExpression), isResult: false },
          { text: resultLine, isResult: true },
        ].slice(-40);

        return {
          ...prev,
          result: formatted,
          resultValue: value,
          engShift: 0,
          dmsView: false,
          hasError: false,
          justEvaluated: true,
          lines,
          inputHistory: [...prev.inputHistory, sourceExpression].slice(-50),
          historyCursor: null,
        };
      } catch (error) {
        return {
          ...prev,
          result: error instanceof Error ? error.message : 'Error',
          hasError: true,
          justEvaluated: true,
        };
      }
    });
  };

  const insertText = (token: string, options?: { resetAfterEval?: boolean }) => {
    setState((prev) => applyInsertText(prev, token, options));
  };

  const insertOperator = (operator: string) => {
    setState((prev) => applyInsertOperator(prev, operator));
  };

  const insertPrefixFunction = (fnToken: string) => {
    setState((prev) => {
      if (prev.justEvaluated && !prev.hasError) {
        return {
          ...replaceAll(prev, appendWithImplicitMultiplication(prev.result, fnToken)),
          justEvaluated: false,
          hasError: false,
        };
      }
      return {
        ...replaceLeft(prev, appendWithImplicitMultiplication(leftOf(prev), fnToken)),
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  /** 4 ʸ√x 3.56 → xroot(4,3.56 ／ 5 nPr 3 → nPr(5,3 */
  const insertInfixFunction = (fnName: string) => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? prev.result : leftOf(prev);
      const { head, operand } = splitTrailingOperand(base);
      const newLeft = `${head}${fnName}(${operand || '0'},`;
      return prev.justEvaluated && !prev.hasError
        ? { ...replaceAll(prev, newLeft), justEvaluated: false, hasError: false }
        : { ...replaceLeft(prev, newLeft), justEvaluated: false, hasError: false };
    });
  };

  /** ( 5 - 1 ) x! → fact(5-1) その場で閉じる後置演算 */
  const insertPostfixFunction = (fnName: string) => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? prev.result : leftOf(prev);
      const { head, operand } = splitTrailingOperand(base);
      const inner =
        operand.startsWith('(') && operand.endsWith(')') && countParenBalance(operand.slice(1, -1)) === 0
          ? operand.slice(1, -1)
          : operand;
      const newLeft = `${head}${fnName}(${inner || '0'})`;
      return prev.justEvaluated && !prev.hasError
        ? { ...replaceAll(prev, newLeft), justEvaluated: false, hasError: false }
        : { ...replaceLeft(prev, newLeft), justEvaluated: false, hasError: false };
    });
  };

  const insertValueToken = (token: string, { clearAfterEval = false } = {}) => {
    setState((prev) => {
      if (prev.justEvaluated && !prev.hasError) {
        const base = clearAfterEval ? '' : prev.result;
        return {
          ...replaceAll(prev, appendWithImplicitMultiplication(base, token)),
          result: clearAfterEval ? '0' : prev.result,
          justEvaluated: false,
          hasError: false,
        };
      }
      return {
        ...replaceLeft(prev, appendWithImplicitMultiplication(leftOf(prev), token)),
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  const insertParenthesis = (token: '(' | ')') => {
    setState((prev) => {
      if (token === '(') {
        if (prev.justEvaluated && !prev.hasError) {
          return {
            ...replaceAll(prev, token),
            result: '0',
            justEvaluated: false,
            hasError: false,
          };
        }
        return {
          ...replaceLeft(prev, appendWithImplicitMultiplication(leftOf(prev), token)),
          justEvaluated: false,
          hasError: false,
        };
      }
      // `)` は一番内側のかっこを1つ閉じるだけ（実機と同じ）。
      // 閉じ忘れは `=` のときにまとめて補う。
      const base = prev.justEvaluated && !prev.hasError ? prev.result : leftOf(prev);
      const newLeft = `${base})`;
      return prev.justEvaluated && !prev.hasError
        ? { ...replaceAll(prev, newLeft), justEvaluated: false, hasError: false }
        : { ...replaceLeft(prev, newLeft), justEvaluated: false, hasError: false };
    });
  };

  const insertPostfixPower = (token: '^2' | '^3') => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? prev.result : leftOf(prev);
      const newLeft = `${base || '0'}${token}`;
      return prev.justEvaluated && !prev.hasError
        ? { ...replaceAll(prev, newLeft), justEvaluated: false, hasError: false }
        : { ...replaceLeft(prev, newLeft), justEvaluated: false, hasError: false };
    });
  };

  /** xʸ は中置。4.62 xʸ 1.57 → 4.62^(1.57 で、次の演算子や `)` で閉じる */
  const insertPowerGroup = () => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? prev.result : leftOf(prev);
      const newLeft = `${base || '0'}^(`;
      return prev.justEvaluated && !prev.hasError
        ? { ...replaceAll(prev, newLeft), justEvaluated: false, hasError: false }
        : { ...replaceLeft(prev, newLeft), justEvaluated: false, hasError: false };
    });
  };

  const insertDmsSeparator = () => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? prev.result : leftOf(prev);
      const separator = nextDmsSeparator(base);
      if (!separator) return prev;
      const newLeft = `${base}${separator}`;
      return prev.justEvaluated && !prev.hasError
        ? { ...replaceAll(prev, newLeft), justEvaluated: false, hasError: false }
        : { ...replaceLeft(prev, newLeft), justEvaluated: false, hasError: false };
    });
  };

  const evaluateCurrentAsNumber = (prev: CalculatorState): number | null => {
    if (prev.justEvaluated && !prev.hasError && prev.resultValue !== null) return prev.resultValue;
    const source = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
    if (!source.trim()) return 0;
    try {
      return parseEvalNumber(source, prev.angleMode, prev.memory, prev.base);
    } catch {
      return null;
    }
  };

  /** 表示形式や基数を変えたとき、いま出ている答えの見せ方だけを作り直す */
  const reformat = (prev: CalculatorState, overrides: Partial<CalculatorState>): CalculatorState => {
    const next = { ...prev, ...overrides };
    if (next.resultValue === null || prev.hasError) return next;
    return {
      ...next,
      result: next.dmsView && next.base === 'DEC'
        ? formatResult(next.resultValue, { formatMode: 'NORM', digits: next.digits, base: 'DEC' })
        : formatResult(next.resultValue, {
            formatMode: next.formatMode,
            digits: next.digits,
            base: next.base,
            engShift: next.engShift,
          }),
    };
  };

  const pressButton = (action: string) => {
    const consumeLayers = action !== 'toggle-shift' && action !== 'toggle-alt';

    switch (action) {
      case 'toggle-shift':
        setState((prev) => ({ ...prev, shiftActive: !prev.shiftActive, altActive: false }));
        return;
      case 'toggle-alt':
        setState((prev) => ({ ...prev, altActive: !prev.altActive, shiftActive: false }));
        return;

      // MARK: モード
      case 'toggle-angle':
        setState((prev) => ({
          ...prev,
          angleMode: prev.angleMode === 'DEG' ? 'RAD' : 'DEG',
          justEvaluated: false,
        }));
        break;
      case 'cycle-angle':
        setState((prev) => ({
          ...prev,
          angleMode: ANGLE_CYCLE[(ANGLE_CYCLE.indexOf(prev.angleMode) + 1) % ANGLE_CYCLE.length],
          justEvaluated: false,
        }));
        break;
      case 'cycle-format':
        setState((prev) =>
          reformat(prev, {
            formatMode: FORMAT_CYCLE[(FORMAT_CYCLE.indexOf(prev.formatMode) + 1) % FORMAT_CYCLE.length],
            engShift: 0,
          })
        );
        break;
      case 'eng-left':
        setState((prev) => reformat(prev, { engShift: prev.engShift - 3 }));
        break;
      case 'eng-right':
        setState((prev) => reformat(prev, { engShift: prev.engShift + 3 }));
        break;
      case 'dms-view':
        setState((prev) => reformat(prev, { dmsView: !prev.dmsView }));
        break;
      case 'toggle-stats':
        setState((prev) => ({
          ...prev,
          panelMode: prev.panelMode === 'stats' ? 'none' : 'stats',
        }));
        break;
      case 'digits':
        setState((prev) => ({ ...prev, panelMode: 'digits' }));
        break;
      case 'consts':
        setState((prev) => ({ ...prev, panelMode: 'consts' }));
        break;

      // MARK: 編集
      case 'ac':
        // 実機と同じく、消えるのは打ちかけの式と答えだけ。
        // 上に流れた計算の記録（lines / inputHistory）は残す。
        setState((prev) => ({
          ...createInitialState(),
          angleMode: prev.angleMode,
          formatMode: prev.formatMode,
          digits: prev.digits,
          base: prev.base,
          memory: prev.memory,
          lines: prev.lines,
          inputHistory: prev.inputHistory,
        }));
        break;
      case 'del':
        // カーソルの直前を消す（BS）
        setState((prev) => {
          if (prev.justEvaluated || prev.hasError) {
            return { ...replaceAll(prev, ''), result: '0', hasError: false, justEvaluated: false };
          }
          const pos = cursorOf(prev);
          if (pos === 0) return prev;
          const newLeft = prev.expression.slice(0, pos - 1);
          return { ...replaceLeft(prev, newLeft), hasError: false };
        });
        break;
      case 'del-forward':
        // カーソル位置の1文字を消す（DEL）
        setState((prev) => {
          const pos = cursorOf(prev);
          if (pos >= prev.expression.length) return prev;
          return {
            ...prev,
            expression: prev.expression.slice(0, pos) + prev.expression.slice(pos + 1),
            hasError: false,
          };
        });
        break;
      case 'cursor-left':
        setState((prev) => ({ ...prev, cursorPos: Math.max(0, cursorOf(prev) - 1) }));
        break;
      case 'cursor-right':
        setState((prev) => ({
          ...prev,
          cursorPos: Math.min(prev.expression.length, cursorOf(prev) + 1),
        }));
        break;
      case 'cursor-home':
        setState((prev) => ({ ...prev, cursorPos: 0 }));
        break;
      case 'history-up':
      case 'history-down':
        setState((prev) => {
          if (prev.inputHistory.length === 0) return prev;
          const current = prev.historyCursor ?? prev.inputHistory.length;
          const next = Math.max(
            0,
            Math.min(prev.inputHistory.length - 1, current + (action === 'history-up' ? -1 : 1))
          );
          const expression = prev.inputHistory[next];
          return {
            ...replaceAll(prev, expression),
            historyCursor: next,
            justEvaluated: false,
            hasError: false,
          };
        });
        break;

      case '=':
        evaluateExpression();
        break;

      // MARK: メモリ
      case 'mc':
        setState((prev) => ({ ...prev, memory: 0 }));
        break;
      case 'mr':
        insertValueToken(formatNumberLike(state.memory), { clearAfterEval: true });
        break;
      case 'm':
        insertValueToken('M');
        break;
      case 'm+':
        setState((prev) => {
          const value = evaluateCurrentAsNumber(prev);
          if (value === null) return prev;
          return { ...prev, memory: prev.memory + value };
        });
        break;
      case 'm-':
        setState((prev) => {
          const value = evaluateCurrentAsNumber(prev);
          if (value === null) return prev;
          return { ...prev, memory: prev.memory - value };
        });
        break;

      case 'ans':
        setState((prev) => {
          const token = prev.hasError
            ? '0'
            : prev.resultValue !== null
              ? formatNumberLike(prev.resultValue)
              : prev.result;
          if (prev.justEvaluated && !prev.hasError) {
            return {
              ...replaceAll(prev, appendWithImplicitMultiplication('', token)),
              result: '0',
              justEvaluated: false,
              hasError: false,
            };
          }
          return {
            ...replaceLeft(prev, appendWithImplicitMultiplication(leftOf(prev), token)),
            justEvaluated: false,
            hasError: false,
          };
        });
        break;

      case 'exp10':
        // かっこを開かず、指数表記のリテラルとして入れる（3.46e-5）
        setState((prev) => {
          const base = prev.justEvaluated && !prev.hasError ? prev.result : leftOf(prev);
          const newLeft = `${base || '1'}e`;
          return prev.justEvaluated && !prev.hasError
            ? { ...replaceAll(prev, newLeft), justEvaluated: false, hasError: false }
            : { ...replaceLeft(prev, newLeft), justEvaluated: false, hasError: false };
        });
        break;
      case 'dms':
        insertDmsSeparator();
        break;
      case 'negate':
        setState((prev) => {
          const base = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression || '0';
          return {
            ...replaceAll(prev, `(-(${base}))`),
            justEvaluated: false,
            hasError: false,
          };
        });
        break;
      case 'neg':
        // (−) キー。次に打つ数の符号として、その場に「-」を入れる
        setState((prev) => {
          const left = leftOf(prev);
          // 指数の途中（3.46e のあと）なら指数の符号
          const newLeft = `${left}${/e$/.test(left) ? '-' : '(-'}`;
          return { ...replaceLeft(prev, newLeft), justEvaluated: false, hasError: false };
        });
        break;
      case '^(':
        insertPowerGroup();
        break;

      default:
        if (action.startsWith('base:')) {
          const base = action.slice(5) as NumberBase;
          setState((prev) => {
            // DEC 以外では小数・指数は使えないので、入力から落とす
            const expression = base === 'DEC' ? prev.expression : prev.expression.replace(/[.e]/g, '');
            return reformat(
              { ...prev, expression, cursorPos: Math.min(cursorOf(prev), expression.length) },
              { base }
            );
          });
          break;
        }
        if (action.startsWith('digits:')) {
          const digits = Number.parseInt(action.slice(7), 10);
          if (Number.isFinite(digits)) {
            setState((prev) => reformat(prev, { digits: Math.max(0, Math.min(10, digits)) }));
          }
          break;
        }
        if (action.startsWith('const:')) {
          insertValueToken(action.slice(6));
          break;
        }
        if (isDigitAction(action)) {
          if (!baseAllowsChar(state.base, action)) break;
          insertText(action, { resetAfterEval: true });
          break;
        }
        if (isHexDigitAction(action)) {
          if (!baseAllowsChar(state.base, action)) break;
          insertText(action, { resetAfterEval: true });
          break;
        }
        if (action === '.') {
          if (state.base !== 'DEC') break;
          insertText('.', { resetAfterEval: true });
          break;
        }
        if (['+', '-', '*', '/', '^'].includes(action)) {
          insertOperator(action);
          break;
        }
        if (action === '(' || action === ')') {
          insertParenthesis(action);
          break;
        }
        if (action === 'pi' || action === 'e') {
          insertValueToken(action, { clearAfterEval: true });
          break;
        }
        if (action === '^2' || action === '^3') {
          insertPostfixPower(action);
          break;
        }
        if (action === 'fact(') {
          insertPostfixFunction('fact');
          break;
        }
        if (action === 'inv(') {
          insertPostfixFunction('inv');
          break;
        }
        if (INFIX_FUNCTIONS[action]) {
          insertInfixFunction(INFIX_FUNCTIONS[action]);
          break;
        }
        if (PREFIX_FUNCTIONS.has(action)) {
          insertPrefixFunction(action);
          break;
        }
        insertText(action);
        break;
    }

    clearLayersIfNeeded(consumeLayers);
  };

  const setPanelMode = (panelMode: PanelMode) => {
    setState((prev) => ({ ...prev, panelMode }));
  };

  return {
    state,
    displayExpression,
    displayBeforeCursor,
    displayAfterCursor,
    parenBalance,
    pressButton,
    setPanelMode,
  };
}
