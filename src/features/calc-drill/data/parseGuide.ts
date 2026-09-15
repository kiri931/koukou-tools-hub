/**
 * 過去問データの「ガイド用語」を、キーパッドの action 名に変換する。
 *
 * ガイドには `Shift` と `RADモード` を書かない。
 *  - SHIFT はドリル側が自動で差し込む（useCalcDrill）。キー配置を変えても
 *    問題データを直さずに済むようにするため。
 *  - 角度モードは問題の属性（angleMode）で、手順ではない。
 */
const TOKEN_ACTION_MAP: Record<string, string> = {
  '×': '*',
  '÷': '/',
  '+': '+',
  '-': '-',
  '(': '(',
  ')': ')',
  '=': '=',
  EXP: 'exp10',
  'x²': '^2',
  'x³': '^3',
  '√': 'sqrt(',
  '³√': 'cbrt(',
  'x√': 'xroot(',
  'x^y': '^(',
  '10^x': 'pow10(',
  'e^x': 'exp(',
  log: 'log(',
  ln: 'ln(',
  sin: 'sin(',
  cos: 'cos(',
  tan: 'tan(',
  'sin-1': 'asin(',
  'cos-1': 'acos(',
  'tan-1': 'atan(',
  π: 'pi',
  'x!': 'fact(',
  nPr: 'nPr(',
  nCr: 'nCr(',
  '°\'"': 'dms',
  Ans: 'ans',
};

/** かっこを開くキー。関数の引数はここで開いたかっこの中に入る。 */
const OPENS_PAREN = new Set([
  'sqrt(', 'cbrt(', 'sin(', 'cos(', 'tan(',
  'asin(', 'acos(', 'atan(', 'log(', 'pow10(', 'ln(', 'exp(',
  'xroot(', 'nPr(', 'nCr(', '^(',
]);

const OPERATORS = new Set(['+', '-', '*', '/']);

/**
 * 過去問のガイドは `log 3.08 × 9.86` のように、関数の引数の終わりに `)` を書かない。
 * 一方、実機の電卓は `log` を押すと `log(` が開き、閉じるのは生徒自身である
 * （`log 3.08 × 9.86` とそのまま打つと `log(3.08×9.86)` になってしまう）。
 *
 * そこで、関数の引数が終わる位置に `)` のキー操作を補う。
 * こうすると **ドリルが教える手順が、実機で打つ手順と一致する**。
 *
 *   log 3.08 × 9.86   →  log ( 3.08 ) × 9.86
 *   ( 5.93 - ³√ cos 67.1 )  →  ( 5.93 - ³√ ( cos ( 67.1 ) ) )
 */
export function closeFunctionArgs(actions: string[]): string[] {
  const result: string[] = [];
  // true = 関数が開いたかっこ / false = 生徒が `(` を押して開いたかっこ
  const stack: boolean[] = [];

  const closeFunctionsOnTop = () => {
    while (stack.length > 0 && stack[stack.length - 1]) {
      result.push(')');
      stack.pop();
    }
  };

  for (const action of actions) {
    if (OPERATORS.has(action) || action === '=') {
      // 演算子や `=` の手前で、開きっぱなしの関数を閉じる。
      // ただし `-` は符号かもしれないので、直前が開きかっこ・演算子なら閉じない。
      const previous = result[result.length - 1];
      const isSign = action === '-' && (previous === undefined || previous === '(' || OPERATORS.has(previous) || OPENS_PAREN.has(previous));
      if (!isSign) closeFunctionsOnTop();
      result.push(action);
      continue;
    }

    if (action === ')') {
      // ガイドの `)` は生徒が開いたかっこに対応する。
      // 先に関数のぶんを閉じてから使う。相手がいなければ捨てる。
      closeFunctionsOnTop();
      if (stack.length > 0) {
        result.push(')');
        stack.pop();
      }
      continue;
    }

    if (action === '(') {
      stack.push(false);
      result.push(action);
      continue;
    }

    if (OPENS_PAREN.has(action)) {
      stack.push(true);
      result.push(action);
      continue;
    }

    result.push(action);
  }

  closeFunctionsOnTop();
  return result;
}

export class UnknownGuideTokenError extends Error {
  constructor(readonly token: string) {
    super(`ガイド用語 "${token}" に対応するキーがありません`);
    this.name = 'UnknownGuideTokenError';
  }
}

/** 変換できないトークンがあれば投げる。呼ぶ側で握って「出題しない」判断に使う。 */
export function parseGuideToKeySequence(guide: string[]): string[] {
  const result: string[] = [];

  for (const token of guide) {
    const mapped = TOKEN_ACTION_MAP[token];
    if (mapped) {
      result.push(mapped);
      continue;
    }

    // 数値は1文字ずつのキー入力に分解する（3.46 → 3 . 4 6）
    if (/^\d+(\.\d+)?$/.test(token)) {
      result.push(...token.split(''));
      continue;
    }

    throw new UnknownGuideTokenError(token);
  }

  return closeFunctionArgs(result);
}

export const GUIDE_TOKENS = Object.keys(TOKEN_ACTION_MAP);
