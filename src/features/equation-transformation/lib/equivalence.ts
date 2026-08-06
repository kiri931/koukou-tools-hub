/**
 * 記述式の解答が正解と数学的に等しいかを判定する。
 *
 * 文字列を揃えて比べる方式では、項の順序（x=n+k/m と x=k/m+n）、展開した形、
 * 通分した形がすべて不正解になる。ここでは式を実際に評価し、変数へ同じ値を
 * 何組か入れて両辺の値が一致するかで判定する。
 *
 * 判定の方針（docs/design/equation-transformation-spec.md 5章）:
 * - 「x について解け」なので、左辺は正解と同じ変数1文字であることを求める
 * - 分母が 0 になるなど評価できない代入は捨てて引き直す
 * - 比較は相対誤差 1e-9 まで許す
 * - 0.5 と 1/2、約分していない形は、値が同じなら正解にする
 * - 式として読めなかったときは、従来の文字列一致にそのまま任せる
 */

/** 代入を何組試すか（成功した組の数がこれに達したら判定する） */
const TRIALS = 8;
/** 代入のやり直しを含めた試行の上限 */
const MAX_ATTEMPTS = 64;
/** 一致とみなす相対誤差 */
const RELATIVE_TOLERANCE = 1e-9;

type Expr =
  | { kind: "num"; value: number }
  | { kind: "var"; name: string }
  | { kind: "neg"; operand: Expr }
  | { kind: "bin"; op: "+" | "-" | "*" | "/" | "^"; left: Expr; right: Expr };

export interface Equation {
  /** 左辺が変数1文字だけならその名前。そうでなければ null */
  lhsVariable: string | null;
  lhs: Expr;
  rhs: Expr;
}

class ParseError extends Error {}

/* ------------------------------------------------------------------ *
 * LaTeX を素の式に均す
 * ------------------------------------------------------------------ */

/** `\frac{A}{B}` の2つの引数と、その次の位置を返す。読めなければ null */
function readFracArgs(source: string, start: number): [string, string, number] | null {
  const readBraced = (from: number): [string, number] | null => {
    if (source[from] !== "{") return null;
    let depth = 0;
    for (let i = from; i < source.length; i += 1) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") {
        depth -= 1;
        if (depth === 0) return [source.slice(from + 1, i), i + 1];
      }
    }
    return null;
  };

  const numerator = readBraced(start);
  if (!numerator) return null;
  const denominator = readBraced(numerator[1]);
  if (!denominator) return null;
  return [numerator[0], denominator[0], denominator[1]];
}

/** `^{...}` を `^(...)` にする。中身は入れ子のかっこを数える */
function rewriteSuperscripts(source: string): string {
  let out = "";
  for (let i = 0; i < source.length; ) {
    if (source[i] === "^" && source[i + 1] === "{") {
      let depth = 0;
      let end = -1;
      for (let j = i + 1; j < source.length; j += 1) {
        if (source[j] === "{") depth += 1;
        else if (source[j] === "}") {
          depth -= 1;
          if (depth === 0) {
            end = j;
            break;
          }
        }
      }
      if (end === -1) throw new ParseError("閉じていない ^{ がある");
      out += `^(${rewriteSuperscripts(source.slice(i + 2, end))})`;
      i = end + 1;
      continue;
    }
    out += source[i];
    i += 1;
  }
  return out;
}

/** LaTeX を、数字・英字・`+ - * / ^ ( ) =` だけの文字列にする */
function flattenLatex(source: string): string {
  let text = source;

  // MathLive が入れる装飾を落とす
  text = text.replace(/\\(?:d|t)frac(?=\{)/g, "\\frac");
  text = text.replace(/\\left/g, "").replace(/\\right/g, "");
  text = text.replace(/\\mathrm|\\mathit|\\displaystyle/g, "");
  text = text.replace(/\\[,;:!]/g, "");
  text = text.replace(/\\ /g, "");
  text = text.replace(/\\cdot|\\times/g, "*");
  text = text.replace(/\\div/g, "/");
  // 円周率は変数ではなく定数として扱う（2\pi r のように書ける）
  text = text.replace(/\\pi(?![A-Za-z])/g, "π");
  text = text.replace(/\\placeholder\{\}/g, "");
  text = text.replace(/[\s{}]*\\placeholder[\s{}]*/g, "");

  // \frac{A}{B} を ((A)/(B)) に開く。中身も同じ処理にかける
  let expanded = "";
  for (let i = 0; i < text.length; ) {
    if (text.startsWith("\\frac", i)) {
      const args = readFracArgs(text, i + "\\frac".length);
      if (!args) throw new ParseError("読めない \\frac がある");
      const [numerator, denominator, next] = args;
      expanded += `((${flattenLatex(numerator)})/(${flattenLatex(denominator)}))`;
      i = next;
      continue;
    }
    expanded += text[i];
    i += 1;
  }
  text = expanded;

  text = rewriteSuperscripts(text);
  text = text.replace(/\s+/g, "");

  // ここまでで消えなかった LaTeX 命令や中かっこが残っていたら、読めない式とみなす
  if (/\\/.test(text)) throw new ParseError("知らない LaTeX 命令が残っている");
  if (/[{}]/.test(text)) throw new ParseError("中かっこが残っている");
  if (!/^[0-9A-Za-zπ+\-*/^().=]*$/.test(text)) throw new ParseError("扱えない文字がある");

  return text;
}

/* ------------------------------------------------------------------ *
 * 式を読む（再帰下降）
 * ------------------------------------------------------------------ */

function parseExpression(source: string): Expr {
  let pos = 0;

  const peek = () => source[pos];
  const eof = () => pos >= source.length;

  const isDigit = (ch: string | undefined) => !!ch && ch >= "0" && ch <= "9";
  const isLetter = (ch: string | undefined) => !!ch && /[A-Za-z]/.test(ch);
  const startsAtom = (ch: string | undefined) =>
    isDigit(ch) || isLetter(ch) || ch === "(" || ch === "π";

  // expr := term (('+' | '-') term)*
  const expr = (): Expr => {
    let left = term();
    while (peek() === "+" || peek() === "-") {
      const op = peek() as "+" | "-";
      pos += 1;
      left = { kind: "bin", op, left, right: term() };
    }
    return left;
  };

  // term := unary (('*' | '/') unary | 並べただけの掛け算)*
  const term = (): Expr => {
    let left = unary();
    for (;;) {
      if (peek() === "*" || peek() === "/") {
        const op = peek() as "*" | "/";
        pos += 1;
        left = { kind: "bin", op, left, right: unary() };
        continue;
      }
      // 4xy や 2(x+1) のように、記号なしで並んでいれば掛け算
      if (startsAtom(peek())) {
        left = { kind: "bin", op: "*", left, right: unary() };
        continue;
      }
      return left;
    }
  };

  // unary := '-' unary | '+' unary | power
  const unary = (): Expr => {
    if (peek() === "-") {
      pos += 1;
      return { kind: "neg", operand: unary() };
    }
    if (peek() === "+") {
      pos += 1;
      return unary();
    }
    return power();
  };

  // power := atom ('^' unary)?   右結合
  const power = (): Expr => {
    const base = atom();
    if (peek() === "^") {
      pos += 1;
      return { kind: "bin", op: "^", left: base, right: unary() };
    }
    return base;
  };

  // atom := 数値 | 変数1文字 | '(' expr ')'
  const atom = (): Expr => {
    if (eof()) throw new ParseError("式が途中で終わっている");

    if (peek() === "(") {
      pos += 1;
      const inner = expr();
      if (peek() !== ")") throw new ParseError("かっこが閉じていない");
      pos += 1;
      return inner;
    }

    if (peek() === "π") {
      pos += 1;
      return { kind: "num", value: Math.PI };
    }

    if (isDigit(peek()) || (peek() === "." && isDigit(source[pos + 1]))) {
      const start = pos;
      while (isDigit(peek())) pos += 1;
      if (peek() === ".") {
        pos += 1;
        while (isDigit(peek())) pos += 1;
      }
      return { kind: "num", value: Number(source.slice(start, pos)) };
    }

    if (isLetter(peek())) {
      const name = source[pos];
      pos += 1;
      return { kind: "var", name };
    }

    throw new ParseError(`読めない文字: ${peek()}`);
  };

  const result = expr();
  if (!eof()) throw new ParseError(`余分な文字が残っている: ${source.slice(pos)}`);
  return result;
}

/** LaTeX の等式1本を読む。読めなければ null */
export function parseEquation(latex: string): Equation | null {
  try {
    const flat = flattenLatex(latex);
    const sides = flat.split("=");
    if (sides.length !== 2) return null;
    if (!sides[0] || !sides[1]) return null;

    const lhs = parseExpression(sides[0]);
    const rhs = parseExpression(sides[1]);
    return {
      lhsVariable: lhs.kind === "var" ? lhs.name : null,
      lhs,
      rhs,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * 評価
 * ------------------------------------------------------------------ */

function collectVariables(node: Expr, into: Set<string>) {
  switch (node.kind) {
    case "var":
      into.add(node.name);
      return;
    case "neg":
      collectVariables(node.operand, into);
      return;
    case "bin":
      collectVariables(node.left, into);
      collectVariables(node.right, into);
      return;
    default:
  }
}

function evaluate(node: Expr, values: Record<string, number>): number {
  switch (node.kind) {
    case "num":
      return node.value;
    case "var": {
      const value = values[node.name];
      return value === undefined ? Number.NaN : value;
    }
    case "neg":
      return -evaluate(node.operand, values);
    case "bin": {
      const left = evaluate(node.left, values);
      const right = evaluate(node.right, values);
      switch (node.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return left / right;
        case "^":
          return left ** right;
        default:
          return Number.NaN;
      }
    }
    default:
      return Number.NaN;
  }
}

/**
 * 判定を毎回同じ結果にするため、乱数は固定の種から作る。
 * 同じ解答が採点のたびに正解になったり不正解になったりしないようにする。
 */
function createRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    // xorshift32
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

function isClose(a: number, b: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const diff = Math.abs(a - b);
  if (diff === 0) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return diff / scale <= RELATIVE_TOLERANCE;
}

/* ------------------------------------------------------------------ *
 * 本体
 * ------------------------------------------------------------------ */

export type EquivalenceResult =
  | { kind: "equivalent" }
  | { kind: "different" }
  /** 左辺が違う（`x=` で始まっていない、別の文字について解いている） */
  | { kind: "wrong-subject"; expected: string }
  /** 式として読めなかった。呼び出し側は文字列一致に任せる */
  | { kind: "unparsable" };

/**
 * 生徒の解答 `given` が、正解 `answer` と数学的に等しいかを調べる。
 * どちらかが式として読めないときは "unparsable" を返す。
 */
export function compareAnswers(given: string, answer: string): EquivalenceResult {
  const expected = parseEquation(answer);
  const actual = parseEquation(given);
  if (!expected || !actual) return { kind: "unparsable" };

  // 「x について解け」なので、左辺は正解と同じ変数1文字であることを求める。
  // 大文字と小文字は別の変数として扱う（数学の記号としても別物のため）。
  if (expected.lhsVariable === null) return { kind: "unparsable" };
  if (actual.lhsVariable !== expected.lhsVariable) {
    return { kind: "wrong-subject", expected: expected.lhsVariable };
  }

  const variables = new Set<string>();
  collectVariables(expected.rhs, variables);
  collectVariables(actual.rhs, variables);
  // 右辺が求める文字自身を含む形（x=2x-1 など）は「解けていない」ので不正解にする
  if (variables.has(expected.lhsVariable)) return { kind: "different" };

  const names = [...variables];
  const random = createRandom(0x9e3779b9);
  let succeeded = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS && succeeded < TRIALS; attempt += 1) {
    const values: Record<string, number> = {};
    for (const name of names) {
      // 0 の近くを避けた値を入れる。負の値も混ぜて符号の違いを見つける
      const magnitude = 1.25 + random() * 7.5;
      values[name] = random() < 0.5 ? -magnitude : magnitude;
    }

    const a = evaluate(expected.rhs, values);
    const b = evaluate(actual.rhs, values);

    // 分母が 0 になった、累乗が複素数になったなどの組は捨てて引き直す
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (Math.abs(a) > 1e12 || Math.abs(b) > 1e12) continue;

    if (!isClose(a, b)) return { kind: "different" };
    succeeded += 1;
  }

  // 評価できる代入がほとんど作れなかった式は、判定材料が足りないので文字列一致に任せる
  if (succeeded < 3) return { kind: "unparsable" };
  return { kind: "equivalent" };
}
