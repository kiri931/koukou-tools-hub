import type { DrillCategory, DrillLevel, Rounding } from '../types';
import { dec, decNonZero, int, pick, type Rng } from './random';

/**
 * 類題のもと。過去問そのものは持たず、同じ「形」の問題をここから作る。
 *
 * 区分は計算技術検定（全国工業高等学校長協会）の実際の出題区分に合わせてある。
 *   4級: 四則計算（4〜6数値）／集計計算（積和・割合）／実務計算（比例・反比例・平方・平方根）
 *   3級: 四則計算（6〜12数値・固定小数点／浮動小数点）／
 *        関数計算（合成関数・三角関数の度分秒・ラジアン）／
 *        実務計算（平方根の比例反比例・順列組合せ・一次式の変形）
 *
 * `value` は **電卓を通さない素の JavaScript で** 計算する。
 * ドリルは `guide` を電卓に流して答えを出すので、
 * この2つを突き合わせれば「ガイドが式と食い違っていないか」を機械が検算できる。
 * 同じ計算を2通りで書くのは重複ではなく、そのための二重化である。
 */
export interface RawProblem {
  category: DrillCategory;
  question: string;
  guide: string[];
  value: number;
  rounding: Rounding;
  angleMode?: 'DEG' | 'RAD';
}

export type Template = (rng: Rng) => RawProblem;

const D2: Rounding = { kind: 'decimals', value: 2 };
const D1: Rounding = { kind: 'decimals', value: 1 };
const D0: Rounding = { kind: 'decimals', value: 0 };
const S3: Rounding = { kind: 'sigfigs', value: 3 };

const toRad = (deg: number) => (deg * Math.PI) / 180;
const dmsValue = (d: number, m: number, s: number) => d + m / 60 + s / 3600;

/** |値| が小さすぎる分母を避ける。答えが桁外れになって練習にならないため。 */
function spread(rng: Rng, min: number, max: number, places: number, gapFrom: number, minGap: number) {
  for (let i = 0; i < 30; i += 1) {
    const v = dec(rng, min, max, places);
    if (Math.abs(v.n - gapFrom) >= minGap) return v;
  }
  return dec(rng, gapFrom + minGap, max, places);
}

// ────────────────────────────────────────────────────────────
// 4級 四則計算 — 4〜6個の数値
// ────────────────────────────────────────────────────────────

const yon_shisoku: Template[] = [
  (rng) => {
    const a = dec(rng, 10, 99, 1);
    const b = dec(rng, 1, 9, 2);
    const c = int(rng, 2, 9);
    return {
      category: '四則計算',
      question: `${a.tok} - ${b.tok} × ${c}`,
      guide: [a.tok, '-', b.tok, '×', String(c), '='],
      value: a.n - b.n * c,
      rounding: D2,
    };
  },
  (rng) => {
    // 割り切れるように、先に商を決めてから足される数を作る
    const c = int(rng, 2, 9);
    const q = dec(rng, 2, 60, 1);
    const a = dec(rng, 1, q.n * c - 1, 1);
    const bN = Number((q.n * c - a.n).toFixed(1));
    return {
      category: '四則計算',
      question: `( ${a.tok} + ${bN} ) ÷ ${c}`,
      guide: ['(', a.tok, '+', String(bN), ')', '÷', String(c), '='],
      value: (a.n + bN) / c,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 10, 99, 1);
    const b = dec(rng, 1, 9, 1);
    const c = int(rng, 2, 12);
    const d = int(rng, 2, 12);
    return {
      category: '四則計算',
      question: `${a.tok} × ${b.tok} - ${c} × ${d}`,
      guide: [a.tok, '×', b.tok, '-', String(c), '×', String(d), '='],
      value: a.n * b.n - c * d,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 60, 1);
    const b = dec(rng, 1, 60, 1);
    const c = dec(rng, 10, 90, 1);
    const d = dec(rng, 1, 9, 1);
    return {
      category: '四則計算',
      question: `( ${a.tok} + ${b.tok} ) × ( ${c.tok} - ${d.tok} )`,
      guide: ['(', a.tok, '+', b.tok, ')', '×', '(', c.tok, '-', d.tok, ')', '='],
      value: (a.n + b.n) * (c.n - d.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 10, 99, 1);
    const b = decNonZero(rng, 1, 9, 1, 0.5);
    const c = dec(rng, 1, 30, 1);
    const d = int(rng, 2, 9);
    return {
      category: '四則計算',
      question: `${a.tok} ÷ ${b.tok} + ${c.tok} × ${d}`,
      guide: [a.tok, '÷', b.tok, '+', c.tok, '×', String(d), '='],
      value: a.n / b.n + c.n * d,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 10, 99, 1);
    const b = dec(rng, 1, 40, 1);
    const c = dec(rng, 1, 9, 1);
    const d = int(rng, 2, 12);
    return {
      category: '四則計算',
      question: `${a.tok} + ${b.tok} - ${c.tok} × ${d}`,
      guide: [a.tok, '+', b.tok, '-', c.tok, '×', String(d), '='],
      value: a.n + b.n - c.n * d,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 20, 99, 1);
    const b = dec(rng, 1, 19, 1);
    const c = dec(rng, 1, 20, 1);
    const d = dec(rng, 1, 20, 1);
    return {
      category: '四則計算',
      question: `( ${a.tok} - ${b.tok} ) ÷ ( ${c.tok} + ${d.tok} )`,
      guide: ['(', a.tok, '-', b.tok, ')', '÷', '(', c.tok, '+', d.tok, ')', '='],
      value: (a.n - b.n) / (c.n + d.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 20, 1);
    const b = dec(rng, 1, 40, 1);
    const c = dec(rng, 1, 40, 1);
    const d = dec(rng, 1, 99, 1);
    return {
      category: '四則計算',
      question: `${a.tok} × ( ${b.tok} + ${c.tok} ) - ${d.tok}`,
      guide: [a.tok, '×', '(', b.tok, '+', c.tok, ')', '-', d.tok, '='],
      value: a.n * (b.n + c.n) - d.n,
      rounding: D2,
    };
  },
  (rng) => {
    // 5個の数値。4級の上限に近い長さ
    const a = dec(rng, 10, 99, 1);
    const b = dec(rng, 1, 9, 1);
    const c = int(rng, 2, 9);
    const d = dec(rng, 10, 90, 1);
    const e = int(rng, 2, 9);
    return {
      category: '四則計算',
      question: `${a.tok} + ${b.tok} × ${c} - ${d.tok} ÷ ${e}`,
      guide: [a.tok, '+', b.tok, '×', String(c), '-', d.tok, '÷', String(e), '='],
      value: a.n + b.n * c - d.n / e,
      rounding: D2,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 4級 集計計算 — 積和・割合
// ────────────────────────────────────────────────────────────

const yon_shukei: Template[] = [
  (rng) => {
    const a = int(rng, 60, 480);
    const m = int(rng, 2, 30);
    const b = int(rng, 60, 480);
    const n = int(rng, 2, 30);
    const c = int(rng, 60, 480);
    const p = int(rng, 2, 30);
    return {
      category: '集計計算',
      question: `1個 ${a} 円を ${m} 個、1個 ${b} 円を ${n} 個、1個 ${c} 円を ${p} 個買ったときの合計金額`,
      guide: [String(a), '×', String(m), '+', String(b), '×', String(n), '+', String(c), '×', String(p), '='],
      value: a * m + b * n + c * p,
      rounding: D0,
    };
  },
  (rng) => {
    const a = int(rng, 1200, 98000);
    const b = dec(rng, 1, 95, 1);
    return {
      category: '集計計算',
      question: `${a} 円の ${b.tok} % はいくらか`,
      guide: [String(a), '×', b.tok, '÷', '100', '='],
      value: (a * b.n) / 100,
      rounding: D2,
    };
  },
  (rng) => {
    const b = int(rng, 200, 9000);
    const a = int(rng, 10, b);
    return {
      category: '集計計算',
      question: `${a} は ${b} の何 % か`,
      guide: [String(a), '÷', String(b), '×', '100', '='],
      value: (a / b) * 100,
      rounding: D1,
    };
  },
  (rng) => {
    const xs = Array.from({ length: 5 }, () => dec(rng, 10, 990, 1));
    return {
      category: '集計計算',
      question: `${xs.map((x) => x.tok).join(' + ')} の平均`,
      guide: [
        '(',
        ...xs.flatMap((x, i) => (i === 0 ? [x.tok] : ['+', x.tok])),
        ')',
        '÷',
        '5',
        '=',
      ],
      value: xs.reduce((sum, x) => sum + x.n, 0) / 5,
      rounding: D2,
    };
  },
  (rng) => {
    const a = int(rng, 800, 48000);
    const b = int(rng, 5, 60);
    return {
      category: '集計計算',
      question: `${a} 円の品を ${b} % 引きで買うといくらか`,
      guide: [String(a), '×', '(', '100', '-', String(b), ')', '÷', '100', '='],
      value: (a * (100 - b)) / 100,
      rounding: D2,
    };
  },
  (rng) => {
    const a = int(rng, 500, 9000);
    const r = int(rng, 8, 12);
    return {
      category: '集計計算',
      question: `税抜 ${a} 円に ${r} % の税を加えるといくらか`,
      guide: [String(a), '×', '(', '100', '+', String(r), ')', '÷', '100', '='],
      value: (a * (100 + r)) / 100,
      rounding: D2,
    };
  },
  (rng) => {
    const a = int(rng, 200, 5000);
    const b = a + int(rng, 20, 4000);
    return {
      category: '集計計算',
      question: `${a} が ${b} になった。何 % 増えたか`,
      guide: ['(', String(b), '-', String(a), ')', '÷', String(a), '×', '100', '='],
      value: ((b - a) / a) * 100,
      rounding: D1,
    };
  },
  (rng) => {
    const a = int(rng, 80, 600);
    const m = int(rng, 2, 40);
    const b = int(rng, 80, 600);
    const n = int(rng, 2, 40);
    return {
      category: '集計計算',
      question: `1個 ${a} 円を ${m} 個、1個 ${b} 円を ${n} 個 買ったときの平均単価`,
      guide: ['(', String(a), '×', String(m), '+', String(b), '×', String(n), ')', '÷', '(', String(m), '+', String(n), ')', '='],
      value: (a * m + b * n) / (m + n),
      rounding: D2,
    };
  },
  (rng) => {
    const xs = Array.from({ length: 6 }, () => dec(rng, 10, 9900, 1));
    return {
      category: '集計計算',
      question: `${xs.map((x) => x.tok).join(' + ')} の合計`,
      guide: [...xs.flatMap((x, i) => (i === 0 ? [x.tok] : ['+', x.tok])), '='],
      value: xs.reduce((sum, x) => sum + x.n, 0),
      rounding: D1,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 4級 実務計算 — 比例・反比例・平方・平方根
// ────────────────────────────────────────────────────────────

const yon_jitsumu: Template[] = [
  (rng) => {
    const a = dec(rng, 1, 20, 2);
    const x = dec(rng, 1, 40, 1);
    return {
      category: '実務計算',
      question: `y = ${a.tok} x において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', x.tok, '='],
      value: a.n * x.n,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 10, 900, 1);
    const x = decNonZero(rng, 0.5, 40, 2, 0.5);
    return {
      category: '実務計算',
      question: `y = ${a.tok} ÷ x において、x = ${x.tok} のときの y`,
      guide: [a.tok, '÷', x.tok, '='],
      value: a.n / x.n,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 0.5, 12, 2);
    const x = dec(rng, 1, 20, 2);
    return {
      category: '実務計算',
      question: `y = ${a.tok} x² において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', x.tok, 'x²', '='],
      value: a.n * x.n * x.n,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 20, 2);
    const x = dec(rng, 0.5, 90, 2);
    return {
      category: '実務計算',
      question: `y = ${a.tok} √x において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', '√', x.tok, '='],
      value: a.n * Math.sqrt(x.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 10, 900, 1);
    const x = decNonZero(rng, 0.5, 30, 2, 0.5);
    return {
      category: '実務計算',
      question: `y = ${a.tok} ÷ x² において、x = ${x.tok} のときの y`,
      guide: [a.tok, '÷', x.tok, 'x²', '='],
      value: a.n / (x.n * x.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 30, 2);
    const x = dec(rng, 1, 90, 2);
    return {
      category: '実務計算',
      question: `y = √( ${a.tok} x ) において、x = ${x.tok} のときの y`,
      guide: ['√', '(', a.tok, '×', x.tok, ')', '='],
      value: Math.sqrt(a.n * x.n),
      rounding: D2,
    };
  },
  (rng) => {
    // 定数 a, b をもつ一次式に代入する
    const a = dec(rng, 0.5, 15, 2);
    const b = dec(rng, 1, 60, 1);
    const x = dec(rng, 1, 40, 1);
    return {
      category: '実務計算',
      question: `y = ${a.tok} x + ${b.tok} において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', x.tok, '+', b.tok, '='],
      value: a.n * x.n + b.n,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 90, 2);
    const b = dec(rng, 1, 90, 2);
    return {
      category: '実務計算',
      question: `直角をはさむ2辺が ${a.tok} と ${b.tok} のときの斜辺 c = √( a² + b² )`,
      guide: ['√', '(', a.tok, 'x²', '+', b.tok, 'x²', ')', '='],
      value: Math.sqrt(a.n ** 2 + b.n ** 2),
      rounding: D2,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 3級 四則計算 — 固定小数点（小数第2位まで）と浮動小数点（有効数字3けた）
// ────────────────────────────────────────────────────────────

const san_shisoku: Template[] = [
  (rng) => {
    const [a, b, c, d, e] = Array.from({ length: 5 }, () => dec(rng, 0.1, 9.99, 2));
    const f = spread(rng, 0.1, 9.99, 2, e.n, 0.3);
    return {
      category: '四則計算',
      question: `${a.tok} - { ${b.tok} - ( ${c.tok} + ${d.tok} ) × ( ${e.tok} - ${f.tok} ) }`,
      guide: [a.tok, '-', '(', b.tok, '-', '(', c.tok, '+', d.tok, ')', '×', '(', e.tok, '-', f.tok, ')', ')', '='],
      value: a.n - (b.n - (c.n + d.n) * (e.n - f.n)),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 0.1, 9.99, 2);
    const b = decNonZero(rng, 0.5, 9.99, 2, 0.5);
    const [c, d, e, f] = Array.from({ length: 4 }, () => dec(rng, 0.1, 9.99, 2));
    return {
      category: '四則計算',
      question: `${a.tok} ÷ ${b.tok} × ( ${c.tok} × ${d.tok} - ${e.tok} × ${f.tok} )`,
      guide: [a.tok, '÷', b.tok, '×', '(', c.tok, '×', d.tok, '-', e.tok, '×', f.tok, ')', '='],
      value: (a.n / b.n) * (c.n * d.n - e.n * f.n),
      rounding: D2,
    };
  },
  (rng) => {
    const [a, b, c, d, e] = Array.from({ length: 5 }, () => dec(rng, 0.1, 9.99, 2));
    const f = spread(rng, 0.1, 9.99, 2, e.n, 0.5);
    return {
      category: '四則計算',
      question: `${a.tok} × { ${b.tok} - ( ${c.tok} + ${d.tok} ) ÷ ( ${e.tok} - ${f.tok} ) }`,
      guide: [a.tok, '×', '(', b.tok, '-', '(', c.tok, '+', d.tok, ')', '÷', '(', e.tok, '-', f.tok, ')', ')', '='],
      value: a.n * (b.n - (c.n + d.n) / (e.n - f.n)),
      rounding: D2,
    };
  },
  (rng) => {
    const [a, b, c, d, e] = Array.from({ length: 5 }, () => dec(rng, 0.1, 9.99, 2));
    const f = decNonZero(rng, 0.5, 9.99, 2, 0.5);
    return {
      category: '四則計算',
      question: `( ${a.tok} + ${b.tok} ) × { - ( ${c.tok} + ${d.tok} ) - ${e.tok} ÷ ${f.tok} }`,
      guide: ['(', a.tok, '+', b.tok, ')', '×', '(', '-', '(', c.tok, '+', d.tok, ')', '-', e.tok, '÷', f.tok, ')', '='],
      value: (a.n + b.n) * (-(c.n + d.n) - e.n / f.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 0.1, 9.99, 2);
    const b = decNonZero(rng, 0.5, 9.99, 2, 0.5);
    const [c, d] = Array.from({ length: 2 }, () => dec(rng, 0.1, 9.99, 2));
    const e = dec(rng, 0.1, 9.99, 2);
    const f = spread(rng, 0.1, 9.99, 2, e.n, 0.3);
    return {
      category: '四則計算',
      question: `( ${a.tok} - ${c.tok} ÷ ${b.tok} ) × ( ${d.tok} - ${e.tok} × ${f.tok} )`,
      guide: ['(', a.tok, '-', c.tok, '÷', b.tok, ')', '×', '(', d.tok, '-', e.tok, '×', f.tok, ')', '='],
      value: (a.n - c.n / b.n) * (d.n - e.n * f.n),
      rounding: D2,
    };
  },
  // ここから浮動小数点（×10ⁿ を使う）
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = spread(rng, 1, 9.99, 2, c.n, 0.8);
    const p = int(rng, 2, 9);
    const q = int(rng, 4, 11);
    const sign = pick(rng, ['+', '-'] as const);
    const num = sign === '+' ? a.n * 10 ** p + b.n * 10 ** p : a.n * 10 ** p - b.n * 10 ** p;
    return {
      category: '四則計算',
      question: `( ${a.tok} × 10^${p} ${sign} ${b.tok} × 10^${p} ) ÷ ( ${c.tok} × 10^${q} - ${d.tok} × 10^${q} )`,
      guide: ['(', a.tok, 'EXP', String(p), sign, b.tok, 'EXP', String(p), ')', '÷',
              '(', c.tok, 'EXP', String(q), '-', d.tok, 'EXP', String(q), ')', '='],
      value: num / (c.n * 10 ** q - d.n * 10 ** q),
      rounding: S3,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const p = int(rng, 2, 5);
    const q = int(rng, 2, 5);
    const r = int(rng, 3, 6);
    return {
      category: '四則計算',
      question: `${a.tok} × 10^-${p} × ( ${b.tok} × 10^-${q} + ${c.tok} × 10^-${r} )`,
      guide: [a.tok, 'EXP', '-', String(p), '×', '(', b.tok, 'EXP', '-', String(q), '+', c.tok, 'EXP', '-', String(r), ')', '='],
      value: a.n * 10 ** -p * (b.n * 10 ** -q + c.n * 10 ** -r),
      rounding: S3,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = dec(rng, 1, 9.99, 2);
    // 割り算で桁が跳ね上がらないよう、分母の指数は分子と近い正の値にする
    const p = int(rng, 4, 10);
    const q = int(rng, 5, 9);
    const r = int(rng, q - 2, q + 2);
    return {
      category: '四則計算',
      question: `${a.tok} × 10^${p} - ${b.tok} × 10^${q} ÷ ( ${c.tok} × 10^${r} + ${d.tok} × 10^${r} )`,
      guide: [a.tok, 'EXP', String(p), '-', b.tok, 'EXP', String(q), '÷',
              '(', c.tok, 'EXP', String(r), '+', d.tok, 'EXP', String(r), ')', '='],
      value: a.n * 10 ** p - (b.n * 10 ** q) / (c.n * 10 ** r + d.n * 10 ** r),
      rounding: S3,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 3級 関数計算 — 合成関数・三角関数（度分秒・ラジアン）
// ────────────────────────────────────────────────────────────

const san_kansuu: Template[] = [
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1.2, 9.99, 2);
    const d = dec(rng, 1, 9.99, 2);
    const denom = b.n * b.n - Math.log10(c.n) * d.n;
    if (Math.abs(denom) < 0.2) {
      // 分母が 0 に近いと答えが桁外れになる。係数をずらして作り直す
      const d2 = Number((d.n + 3).toFixed(2));
      return {
        category: '関数計算',
        question: `${a.tok} + 1 ÷ ( ${b.tok}² - log ${c.tok} × ${d2} )`,
        guide: [a.tok, '+', '(', '1', '÷', '(', b.tok, 'x²', '-', 'log', c.tok, '×', String(d2), ')', ')', '='],
        value: a.n + 1 / (b.n * b.n - Math.log10(c.n) * d2),
        rounding: D2,
      };
    }
    return {
      category: '関数計算',
      question: `${a.tok} + 1 ÷ ( ${b.tok}² - log ${c.tok} × ${d.tok} )`,
      guide: [a.tok, '+', '(', '1', '÷', '(', b.tok, 'x²', '-', 'log', c.tok, '×', d.tok, ')', ')', '='],
      value: a.n + 1 / denom,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const d1 = int(rng, 20, 84);
    const m1 = int(rng, 1, 59);
    const s1 = int(rng, 1, 59);
    const d2 = int(rng, 10, 70);
    const m2 = int(rng, 1, 59);
    const s2 = int(rng, 1, 59);
    const t = Math.tan(toRad(dmsValue(d1, m1, s1)));
    const s = Math.sin(toRad(dmsValue(d2, m2, s2)));
    return {
      category: '関数計算',
      question: `${a.tok} - ${b.tok} × tan ${d1}°${m1}'${s1}" ÷ sin ${d2}°${m2}'${s2}"`,
      guide: [a.tok, '-', b.tok, '×', 'tan', String(d1), '°\'"', String(m1), '°\'"', String(s1), '°\'"',
              '÷', 'sin', String(d2), '°\'"', String(m2), '°\'"', String(s2), '°\'"', '='],
      value: a.n - (b.n * t) / s,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const n = int(rng, 3, 6);
    const c = dec(rng, 1.2, 9.99, 2);
    const d = dec(rng, 1.2, 9.99, 2);
    const e = dec(rng, 1.05, 2.5, 2);
    const denom = -b.n * c.n ** (1 / n) + d.n ** e.n;
    if (Math.abs(denom) < 0.2) {
      return san_kansuu[5](rng);
    }
    return {
      category: '関数計算',
      question: `${a.tok} ÷ ( - ${b.tok} × ${n}√${c.tok} + ${d.tok}^${e.tok} )`,
      guide: [a.tok, '÷', '(', '-', b.tok, '×', String(n), 'x√', c.tok, '+', d.tok, 'x^y', e.tok, ')', '='],
      value: a.n / denom,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const p = dec(rng, 0.2, 1.8, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = dec(rng, 1, 9.99, 2);
    const e = decNonZero(rng, 0.5, 9.99, 2, 0.4);
    return {
      category: '関数計算',
      question: `${a.tok} × 10^${p.tok} - ³√( ${b.tok} × ${c.tok} ) + ${d.tok} ÷ ${e.tok}²`,
      guide: [a.tok, '×', '10^x', p.tok, '-', '³√', '(', b.tok, '×', c.tok, ')', '+', d.tok, '÷', e.tok, 'x²', '='],
      value: a.n * 10 ** p.n - Math.cbrt(b.n * c.n) + d.n / (e.n * e.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const k = int(rng, 3, 8);
    const m = int(rng, 1, 4);
    const n = int(rng, 5, 9);
    return {
      category: '関数計算',
      angleMode: 'RAD',
      question: `${a.tok} × tan ( π ÷ ${k} ) - ${b.tok} × sin ( ${m} ÷ ${n} × π )`,
      guide: [a.tok, '×', 'tan', '(', 'π', '÷', String(k), ')', '-', b.tok, '×', 'sin', '(', String(m), '÷', String(n), '×', 'π', ')', '='],
      value: a.n * Math.tan(Math.PI / k) - b.n * Math.sin((m / n) * Math.PI),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = dec(rng, 1.2, 9.99, 2);
    const e = dec(rng, 0.3, 2.2, 2);
    return {
      category: '関数計算',
      question: `${a.tok} × ( ${b.tok} × √${c.tok} + ${d.tok}^${e.tok} )`,
      guide: [a.tok, '×', '(', b.tok, '×', '√', c.tok, '+', d.tok, 'x^y', e.tok, ')', '='],
      value: a.n * (b.n * Math.sqrt(c.n) + d.n ** e.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1.2, 9.99, 2);
    const d = dec(rng, 1.5, 9.99, 2);
    const logd = Math.log10(d.n);
    if (Math.abs(logd) < 0.15) return san_kansuu[5](rng);
    return {
      category: '関数計算',
      question: `${a.tok} × ( ${b.tok} - ³√${c.tok} ÷ log ${d.tok} )`,
      guide: [a.tok, '×', '(', b.tok, '-', '³√', c.tok, '÷', 'log', d.tok, ')', '='],
      value: a.n * (b.n - Math.cbrt(c.n) / logd),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const t1 = dec(rng, 10, 80, 1);
    const t2 = dec(rng, 10, 80, 1);
    const b = dec(rng, 1, 9.99, 2);
    const denom = Math.cos(toRad(t1.n)) - Math.sin(toRad(t2.n));
    if (Math.abs(denom) < 0.15) return san_kansuu[5](rng);
    return {
      category: '関数計算',
      question: `${a.tok} × ( ${b.tok} ÷ ( cos ${t1.tok}° - sin ${t2.tok}° ) )`,
      guide: [a.tok, '×', '(', b.tok, '÷', '(', 'cos', t1.tok, '-', 'sin', t2.tok, ')', ')', '='],
      value: a.n * (b.n / denom),
      rounding: D2,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 3級 実務計算 — 平方根の比例反比例・順列組合せ・一次式の変形
// ────────────────────────────────────────────────────────────

const san_jitsumu: Template[] = [
  (rng) => {
    const a = dec(rng, 10, 99, 2);
    const b = decNonZero(rng, 0.5, 9.99, 2, 0.5);
    const x = decNonZero(rng, 1, 9.99, 2, 0.8);
    const negative = rng() < 0.4;
    const xTok = negative ? `- ${x.tok}` : x.tok;
    return {
      category: '実務計算',
      question: `y = ${a.tok} ÷ ( ${b.tok} x² ) において、x = ${xTok} のときの y`,
      guide: negative
        ? [a.tok, '÷', '(', b.tok, '×', '(', '-', x.tok, ')', 'x²', ')', '=']
        : [a.tok, '÷', '(', b.tok, '×', x.tok, 'x²', ')', '='],
      value: a.n / (b.n * x.n * x.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const x = dec(rng, 0.5, 90, 2);
    return {
      category: '実務計算',
      question: `y = ${a.tok} √x において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', '√', x.tok, '='],
      value: a.n * Math.sqrt(x.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const x = decNonZero(rng, 0.3, 9.99, 2, 0.3);
    return {
      category: '実務計算',
      question: `y = - ${a.tok} × ${b.tok} ÷ √x において、x = ${x.tok} のときの y`,
      guide: ['-', a.tok, '×', b.tok, '÷', '√', x.tok, '='],
      value: (-a.n * b.n) / Math.sqrt(x.n),
      rounding: D2,
    };
  },
  (rng) => {
    const n = int(rng, 5, 9);
    const r = int(rng, 2, n - 1);
    return {
      category: '実務計算',
      question: `${n} 個から ${r} 個を取り出して並べる順列 ${n}P${r}`,
      guide: [String(n), 'nPr', String(r), '='],
      value: fact(n) / fact(n - r),
      rounding: D0,
    };
  },
  (rng) => {
    const n = int(rng, 6, 17);
    const r = int(rng, 2, Math.min(n - 1, 8));
    return {
      category: '実務計算',
      question: `${n} 個から ${r} 個を選ぶ組合せ ${n}C${r}`,
      guide: [String(n), 'nCr', String(r), '='],
      value: fact(n) / (fact(r) * fact(n - r)),
      rounding: D0,
    };
  },
  (rng) => {
    const n = int(rng, 4, 8);
    return {
      category: '実務計算',
      question: `円順列の数 P = ( n - 1 )! を求めよ。n = ${n} の場合`,
      guide: ['(', String(n), '-', '1', ')', 'x!', '='],
      value: fact(n - 1),
      rounding: D0,
    };
  },
  (rng) => {
    const a = decNonZero(rng, 0.2, 9.99, 2, 0.2);
    // b は負にもなるが、キーは「-」を別に押す。数値トークンに符号は入れない
    const bAbs = dec(rng, 0.1, 9.99, 2);
    const bNegative = rng() < 0.5;
    const bValue = bNegative ? -bAbs.n : bAbs.n;
    const bText = bNegative ? `- ${bAbs.tok}` : bAbs.tok;
    const y = dec(rng, 1, 20, 2);
    return {
      category: '実務計算',
      question: `y = a x + b を x について解き、a = ${a.tok}, b = ${bText}, y = ${y.tok} を代入した値`,
      guide: bNegative
        ? ['(', y.tok, '+', bAbs.tok, ')', '÷', a.tok, '=']
        : ['(', y.tok, '-', bAbs.tok, ')', '÷', a.tok, '='],
      value: (y.n - bValue) / a.n,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = spread(rng, 1, 9.99, 2, b.n, 0.5);
    const y = dec(rng, 1, 20, 2);
    return {
      category: '実務計算',
      question: `y = x ÷ ( a - b ) を x について解き、a = ${b.tok}, b = ${c.tok}, y = ${y.tok} を代入した値`,
      guide: [y.tok, '×', '(', b.tok, '-', c.tok, ')', '='],
      value: y.n * (b.n - c.n),
      rounding: D2,
    };
  },
  (rng) => {
    // 一次式の変形 + 平方根（三平方の定理の形）
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const t = dec(rng, 20, 160, 1);
    return {
      category: '実務計算',
      question: `a = √( b² + c² - 2 b c cos θ ) において、b = ${b.tok}, c = ${c.tok}, θ = ${t.tok}° のときの a`,
      guide: ['√', '(', b.tok, 'x²', '+', c.tok, 'x²', '-', '2', '×', b.tok, '×', c.tok, '×', 'cos', t.tok, ')', '='],
      value: Math.sqrt(b.n ** 2 + c.n ** 2 - 2 * b.n * c.n * Math.cos(toRad(t.n))),
      rounding: D2,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 3級 過去問に合わせて足した形
//
// 手元の過去問（第82・83・85・86回、いずれも3級）を読んで、
// 出題されている「形」をそのまま写したもの。数値だけ毎回作り直す。
//   (1)四則計算  … 逆数の和・入れ子の波かっこ・極小の小数・×10ⁿ表記
//   (2)関数計算  … x乗根と分数指数・関数の累乗と根・度分秒・[RAD]のπ分数
//   (3)実務計算  … 表への代入・順列組合せの式・公式への代入
// ────────────────────────────────────────────────────────────

/** 分母が 0 に近いとき作り直すための、ありふれた保険 */
function retryIfFlat(v: number, floor: number) {
  return Math.abs(v) < floor;
}

const san_shisoku_kakomon: Template[] = [
  // 第86回(1) 逆数の和 ÷ 商の差
  (rng) => {
    const a = decNonZero(rng, 0.5, 9.99, 2, 0.5);
    const b = decNonZero(rng, 0.5, 9.99, 2, 0.5);
    const c = dec(rng, 1, 9.99, 2);
    const d = decNonZero(rng, 1, 9.99, 2, 0.5);
    const e = dec(rng, 1, 9.99, 2);
    const f = decNonZero(rng, 1, 9.99, 2, 0.5);
    const denom = c.n / d.n - e.n / f.n;
    if (retryIfFlat(denom, 0.15)) return san_shisoku_kakomon[1](rng);
    return {
      category: '四則計算',
      question: `( - 1 ÷ ${a.tok} - 1 ÷ ${b.tok} ) ÷ ( ${c.tok} ÷ ${d.tok} - ${e.tok} ÷ ${f.tok} )`,
      guide: ['(', '-', '1', '÷', a.tok, '-', '1', '÷', b.tok, ')', '÷',
              '(', c.tok, '÷', d.tok, '-', e.tok, '÷', f.tok, ')', '='],
      value: (-1 / a.n - 1 / b.n) / denom,
      rounding: D2,
    };
  },

  // 第86回(7) 4つの項をつなぐ長い式
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = dec(rng, 1, 9.99, 2);
    const e = dec(rng, 1, 9.99, 2);
    const f = spread(rng, 1, 9.99, 2, e.n, 0.4);
    const g = dec(rng, 1, 9.99, 2);
    const h = dec(rng, 1, 9.99, 2);
    const i = dec(rng, 1, 9.99, 2);
    const j = dec(rng, 1, 9.99, 2);
    return {
      category: '四則計算',
      question: `${a.tok} × ( ${b.tok} - ${c.tok} ) + ${d.tok} ÷ ( ${e.tok} - ${f.tok} ) - ${g.tok} × ( ${h.tok} - ${i.tok} ) + ${j.tok}`,
      guide: [a.tok, '×', '(', b.tok, '-', c.tok, ')', '+', d.tok, '÷', '(', e.tok, '-', f.tok, ')',
              '-', g.tok, '×', '(', h.tok, '-', i.tok, ')', '+', j.tok, '='],
      value: a.n * (b.n - c.n) + d.n / (e.n - f.n) - g.n * (h.n - i.n) + j.n,
      rounding: D2,
    };
  },

  // 第85回(7)・第83回(7) 波かっこ同士の積
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = spread(rng, 1, 9.99, 2, c.n, 0.4);
    const e = dec(rng, 1, 9.99, 2);
    const f = dec(rng, 1, 9.99, 2);
    const g = dec(rng, 1, 9.99, 2);
    const h = decNonZero(rng, 1, 9.99, 2, 0.5);
    return {
      category: '四則計算',
      question: `{ ${a.tok} × ${b.tok} - ${e.tok} ÷ ( ${c.tok} - ${d.tok} ) } × { ${f.tok} × ( ${g.tok} - ${b.tok} ) + ${e.tok} ÷ ${h.tok} }`,
      guide: ['(', a.tok, '×', b.tok, '-', e.tok, '÷', '(', c.tok, '-', d.tok, ')', ')', '×',
              '(', f.tok, '×', '(', g.tok, '-', b.tok, ')', '+', e.tok, '÷', h.tok, ')', '='],
      value: (a.n * b.n - e.n / (c.n - d.n)) * (f.n * (g.n - b.n) + e.n / h.n),
      rounding: D2,
    };
  },

  // 第83回(3) 分数を含むかっこで割る
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = dec(rng, 1, 9.99, 2);
    const e = decNonZero(rng, 1, 9.99, 2, 0.5);
    const f = decNonZero(rng, 1, 9.99, 2, 0.5);
    const denom = c.n - d.n / (e.n / f.n);
    if (retryIfFlat(denom, 0.15)) return san_shisoku_kakomon[1](rng);
    return {
      category: '四則計算',
      question: `( ${a.tok} + ${b.tok} ) ÷ ( ${c.tok} - ${d.tok} ÷ ( ${e.tok} ÷ ${f.tok} ) )`,
      guide: ['(', a.tok, '+', b.tok, ')', '÷', '(', c.tok, '-', d.tok, '÷', '(', e.tok, '÷', f.tok, ')', ')', '='],
      value: (a.n + b.n) / denom,
      rounding: D2,
    };
  },

  // 第86回(8)・第82回(8) 極小の小数の積と商（有効数字3けた）
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = decNonZero(rng, 1, 9.99, 2, 0.5);
    const ea = int(rng, 7, 9);
    const eb = int(rng, 8, 10);
    const ec = int(rng, 8, 10);
    const at = `0.${'0'.repeat(ea)}${String(a.n).replace('.', '')}`;
    const bt = `0.${'0'.repeat(eb)}${String(b.n).replace('.', '')}`;
    const ct = `0.${'0'.repeat(ec)}${String(c.n).replace('.', '')}`;
    return {
      category: '四則計算',
      question: `- ${at} × ${bt} ÷ ${ct}`,
      guide: ['-', at, '×', bt, '÷', ct, '='],
      value: (-Number(at) * Number(bt)) / Number(ct),
      rounding: S3,
    };
  },

  // 第83回(8) 極小の小数の和と差（有効数字3けた）
  //
  // 過去問は引き算で桁が落ちる形だが、乱数で作ると打ち消し合って
  // 10^-14 まで落ちることがある（実測）。答えの桁が過去問（10^-7 前後）に
  // 収まるよう、3つの数の指数をそろえて作る。
  (rng) => {
    const a = dec(rng, 5, 9.99, 2);
    const b = dec(rng, 1, 4.99, 2);
    const c = dec(rng, 1, 4.99, 2);
    const e = int(rng, 5, 7);
    const at = `0.${'0'.repeat(e)}${String(a.n).replace('.', '')}`;
    const bt = `0.${'0'.repeat(e + 1)}${String(b.n).replace('.', '')}`;
    const ct = `0.${'0'.repeat(e + 1)}${String(c.n).replace('.', '')}`;
    return {
      category: '四則計算',
      question: `${at} - ( ${bt} + ${ct} )`,
      guide: [at, '-', '(', bt, '+', ct, ')', '='],
      value: Number(at) - (Number(bt) + Number(ct)),
      rounding: S3,
    };
  },

  // 第86回(9)・第82回(9) ×10ⁿ 表記の積と商（有効数字3けた）
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = spread(rng, 1, 9.99, 2, c.n, 0.4);
    const ec = int(rng, 5, 8);
    const eb = int(rng, 3, 6);
    // 指数が積み上がると答えが 10^14 を超えて練習にならない。
    // 過去問（第86回(9) は 10^11 前後）に収まるよう頭を抑える。
    const ea = int(rng, 4, Math.min(9, 11 - ec + eb));
    return {
      category: '四則計算',
      question: `( ${a.tok} × 10^${ea} ) ÷ ( ${b.tok} × 10^${eb} ) × ( - ${c.tok} × 10^${ec} - ${d.tok} × 10^${ec} )`,
      guide: ['(', a.tok, 'EXP', String(ea), ')', '÷', '(', b.tok, 'EXP', String(eb), ')', '×',
              '(', '-', c.tok, 'EXP', String(ec), '-', d.tok, 'EXP', String(ec), ')', '='],
      value: ((a.n * 10 ** ea) / (b.n * 10 ** eb)) * (-c.n * 10 ** ec - d.n * 10 ** ec),
      rounding: S3,
    };
  },

  // 第86回(10)・第85回(10) ×10ⁿ 表記の和差（負の指数、有効数字3けた）
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = dec(rng, 1, 9.99, 2);
    const e1 = int(rng, 5, 8);
    const e2 = int(rng, 6, 9);
    return {
      category: '四則計算',
      question: `- ( - ${a.tok} × 10^-${e1} - ${b.tok} × 10^-${e2} ) - ( ${c.tok} × 10^-${e1} + ${d.tok} × 10^-${e2} )`,
      guide: ['-', '(', '-', a.tok, 'EXP', '-', String(e1), '-', b.tok, 'EXP', '-', String(e2), ')',
              '-', '(', c.tok, 'EXP', '-', String(e1), '+', d.tok, 'EXP', '-', String(e2), ')', '='],
      value: -(-a.n * 10 ** -e1 - b.n * 10 ** -e2) - (c.n * 10 ** -e1 + d.n * 10 ** -e2),
      rounding: S3,
    };
  },
];

const san_kansuu_kakomon: Template[] = [
  // 第86回(1) 立方根と常用対数
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1.1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = dec(rng, 1.2, 9.99, 2);
    const lg = Math.log10(d.n);
    if (retryIfFlat(lg, 0.05)) return san_kansuu_kakomon[1](rng);
    return {
      category: '関数計算',
      question: `${a.tok} × ³√${b.tok} - ${c.tok} ÷ log ${d.tok}`,
      guide: [a.tok, '×', '³√', b.tok, '-', c.tok, '÷', 'log', d.tok, '='],
      value: a.n * Math.cbrt(b.n) - c.n / lg,
      rounding: D2,
    };
  },

  // 第86回(2) 度分秒の tan と cos
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const d1 = int(rng, 20, 80);
    const m1 = int(rng, 1, 59);
    const s1 = int(rng, 1, 59);
    const d2 = int(rng, 10, 70);
    const m2 = int(rng, 1, 59);
    const s2 = int(rng, 1, 59);
    const t = Math.tan(toRad(dmsValue(d1, m1, s1)));
    const c = Math.cos(toRad(dmsValue(d2, m2, s2)));
    return {
      category: '関数計算',
      question: `${a.tok} × tan ${d1}°${m1}'${s1}" + ${b.tok} ÷ cos ${d2}°${m2}'${s2}"`,
      guide: [a.tok, '×', 'tan', String(d1), '°\'"', String(m1), '°\'"', String(s1), '°\'"',
              '+', b.tok, '÷', 'cos', String(d2), '°\'"', String(m2), '°\'"', String(s2), '°\'"', '='],
      value: a.n * t + b.n / c,
      rounding: D2,
    };
  },

  // 第86回(3)・第85回(2) 分数指数と n 乗根
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1.2, 9.99, 2);
    const c = dec(rng, 1.2, 9.99, 2);
    const d = dec(rng, 1, 9.99, 2);
    const n = int(rng, 3, 5);
    const e = dec(rng, 1.2, 9.99, 2);
    const denom = b.n ** (1 / c.n) - d.n * e.n ** (1 / n);
    if (retryIfFlat(denom, 0.15)) return san_kansuu_kakomon[0](rng);
    return {
      category: '関数計算',
      question: `${a.tok} ÷ ( ${b.tok}^(1÷${c.tok}) - ${d.tok} × ${n}√${e.tok} )`,
      guide: [a.tok, '÷', '(', b.tok, 'x^y', '(', '1', '÷', c.tok, ')', '-', d.tok, '×', String(n), 'x√', e.tok, ')', '='],
      value: a.n / denom,
      rounding: D2,
    };
  },

  // 第86回(5)・第85回(1) 三角関数の2乗と、三角関数の平方根
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 0.05, 0.95, 2);
    const t1 = dec(rng, 15, 75, 1);
    const t2 = dec(rng, 15, 75, 1);
    const denom = Math.sin(toRad(t1.n)) ** 2 - b.n * Math.sqrt(Math.cos(toRad(t2.n)));
    if (retryIfFlat(denom, 0.1)) return san_kansuu_kakomon[0](rng);
    return {
      category: '関数計算',
      question: `- ${a.tok} ÷ ( sin² ${t1.tok}° - ${b.tok} × √cos ${t2.tok}° )`,
      guide: ['-', a.tok, '÷', '(', '(', 'sin', t1.tok, ')', 'x²', '-', b.tok, '×', '√', 'cos', t2.tok, ')', '='],
      value: -a.n / denom,
      rounding: D2,
    };
  },

  // 第86回(6)・第85回(6) 3乗と 10 のべき乗を含む分数（有効数字3けた）
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = spread(rng, 1, 9.99, 2, a.n, 0.3);
    const c = dec(rng, 1.2, 9.99, 2);
    const d = dec(rng, 0.5, 3, 2);
    const denom = c.n ** 3 + 10 ** d.n;
    return {
      category: '関数計算',
      question: `( ${a.tok} - ${b.tok} ) ÷ ( ${c.tok}³ + 10^${d.tok} )`,
      guide: ['(', a.tok, '-', b.tok, ')', '÷', '(', c.tok, 'x³', '+', '10^x', d.tok, ')', '='],
      value: (a.n - b.n) / denom,
      rounding: S3,
    };
  },

  // 第85回(7) n 乗根と分数指数の和にかける
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const n = int(rng, 3, 5);
    const c = dec(rng, 1.2, 9.99, 2);
    const d = dec(rng, 1.2, 9.99, 2);
    const e = dec(rng, 0.1, 0.99, 2);
    return {
      category: '関数計算',
      question: `${a.tok} × ( ${b.tok} × ${n}√${c.tok} + ${d.tok}^${e.tok} )`,
      guide: [a.tok, '×', '(', b.tok, '×', String(n), 'x√', c.tok, '+', d.tok, 'x^y', e.tok, ')', '='],
      value: a.n * (b.n * c.n ** (1 / n) + d.n ** e.n),
      rounding: D2,
    };
  },

  // 第85回(8) 常用対数と立方根の差にかける
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = decNonZero(rng, 1, 9.99, 2, 0.5);
    const c = dec(rng, 3, 9.99, 2);
    const d = dec(rng, 1, 2.5, 2);
    const e = dec(rng, 1.2, 9.99, 2);
    const f = dec(rng, 1, 9.99, 2);
    const inner = c.n - d.n;
    if (retryIfFlat(inner, 0.3)) return san_kansuu_kakomon[0](rng);
    return {
      category: '関数計算',
      question: `${a.tok} ÷ ${b.tok} × { log ( ${c.tok} - ${d.tok} ) - ³√${e.tok} + ${f.tok} }`,
      guide: [a.tok, '÷', b.tok, '×', '(', 'log', '(', c.tok, '-', d.tok, ')', '-', '³√', e.tok, '+', f.tok, ')', '='],
      value: (a.n / b.n) * (Math.log10(inner) - Math.cbrt(e.n) + f.n),
      rounding: D2,
    };
  },

  // 第86回(10)・第85回(10)・第83回(10)・第82回(10) [RAD] π の分数
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const p1 = int(rng, 1, 3);
    const q1 = int(rng, p1 + 1, 5);
    const p2 = int(rng, 1, 3);
    // tan(π/2) は定義されない。p2/q2 が 1/2 になる組み合わせを避ける。
    // （JavaScript の Math.tan(π/2) は巨大だが有限の値を返すので、
    //   値の大きさを見るだけでは気づけない。実測: iPad版の電卓が
    //   「tanの定義域エラー」で止まって見つかった）
    let q2 = int(rng, p2 + 1, 5);
    if (q2 === p2 * 2) q2 += 1;
    const q3 = int(rng, 4, 7);
    const denom =
      -c.n * Math.cos((p1 / q1) * Math.PI) +
      Math.tan((p2 / q2) * Math.PI) * Math.sin((1 / q3) * Math.PI);
    if (retryIfFlat(denom, 0.15)) return san_kansuu_kakomon[0](rng);
    return {
      category: '関数計算',
      question: `( ${a.tok} + ${b.tok} ) ÷ ( - ${c.tok} × cos ${p1}/${q1}π + tan ${p2}/${q2}π × sin 1/${q3}π )`,
      guide: ['(', a.tok, '+', b.tok, ')', '÷', '(', '-', c.tok, '×',
              'cos', '(', String(p1), '÷', String(q1), '×', 'π', ')', '+',
              'tan', '(', String(p2), '÷', String(q2), '×', 'π', ')', '×',
              'sin', '(', '1', '÷', String(q3), '×', 'π', ')', ')', '='],
      value: (a.n + b.n) / denom,
      rounding: D2,
      angleMode: 'RAD',
    };
  },
];

const san_jitsumu_kakomon: Template[] = [
  // 第86回(1) y = ( a × b ) ÷ x² の表に x を代入
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const x = decNonZero(rng, 1, 9.99, 2, 0.8);
    const negative = rng() < 0.5;
    const xTok = negative ? `- ${x.tok}` : x.tok;
    return {
      category: '実務計算',
      question: `y = ( ${a.tok} × ${b.tok} ) ÷ x² において、x = ${xTok} のときの y`,
      guide: negative
        ? ['(', a.tok, '×', b.tok, ')', '÷', '(', '-', x.tok, ')', 'x²', '=']
        : ['(', a.tok, '×', b.tok, ')', '÷', x.tok, 'x²', '='],
      value: (a.n * b.n) / (x.n * x.n),
      rounding: D2,
    };
  },

  // 第86回(2) y ÷ √x = a × ( - b ) の表に x を代入（小数第1位まで）
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const x = dec(rng, 1, 20, 2);
    return {
      category: '実務計算',
      question: `y ÷ √x = ${a.tok} × ( - ${b.tok} ) において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', '(', '-', b.tok, ')', '×', '√', x.tok, '='],
      value: a.n * -b.n * Math.sqrt(x.n),
      rounding: D1,
    };
  },

  // 第82回(2) √x × y = k の表に x を代入（小数第1位まで）
  (rng) => {
    const k = dec(rng, 100, 999, 1);
    const x = dec(rng, 5, 60, 2);
    return {
      category: '実務計算',
      question: `√x × y = ${k.tok} において、x = ${x.tok} のときの y`,
      guide: [k.tok, '÷', '√', x.tok, '='],
      value: k.n / Math.sqrt(x.n),
      rounding: D1,
    };
  },

  // 第86回(4) 重複組合せ C = ( n + r - 1 )! ÷ { r! × ( n - 1 )! }
  (rng) => {
    const n = int(rng, 5, 9);
    const r = int(rng, 2, 4);
    return {
      category: '実務計算',
      question: `C = ( n + r - 1 )! ÷ { r! × ( n - 1 )! } において、n = ${n}, r = ${r} のときの C`,
      guide: ['(', String(n), '+', String(r), '-', '1', ')', 'x!', '÷', '(',
              String(r), 'x!', '×', '(', String(n), '-', '1', ')', 'x!', ')', '='],
      value: fact(n + r - 1) / (fact(r) * fact(n - 1)),
      rounding: D0,
    };
  },

  // 第82回(3) 同じものを含む順列 P = n! ÷ ( p! × q! )
  (rng) => {
    const p = int(rng, 4, 8);
    const q = int(rng, 2, 10 - p);
    return {
      category: '実務計算',
      question: `P = 10! ÷ ( p! × q! ) において、p = ${p}, q = ${q} のときの P`,
      guide: ['1', '0', 'x!', '÷', '(', String(p), 'x!', '×', String(q), 'x!', ')', '='],
      value: fact(10) / (fact(p) * fact(q)),
      rounding: D0,
    };
  },

  // 第86回(5) t = - 1.44 T logₑ( N ÷ N₀ )
  (rng) => {
    const T = dec(rng, 1, 9.99, 2);
    const n0 = dec(rng, 10, 40, 1);
    const n = dec(rng, 1, n0.n - 1, 2);
    return {
      category: '実務計算',
      question: `t = - 1.44 T logₑ( N ÷ N₀ ) において、T = ${T.tok}, N = ${n.tok}, N₀ = ${n0.tok} のときの t`,
      guide: ['-', '1.44', '×', T.tok, '×', 'ln', '(', n.tok, '÷', n0.tok, ')', '='],
      value: -1.44 * T.n * Math.log(n.n / n0.n),
      rounding: D2,
    };
  },

  // 第86回(8)・第82回(8) D = ( a + b )² - 4 a b cos²( θ ÷ 2 )
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const t = dec(rng, 20, 160, 1);
    return {
      category: '実務計算',
      question: `D = ( a + b )² - 4 a b cos²( θ ÷ 2 ) において、a = ${a.tok}, b = ${b.tok}, θ = ${t.tok}° のときの D`,
      guide: ['(', a.tok, '+', b.tok, ')', 'x²', '-', '4', '×', a.tok, '×', b.tok, '×',
              'cos', '(', t.tok, '÷', '2', ')', ')', 'x²', '='],
      value: (a.n + b.n) ** 2 - 4 * a.n * b.n * Math.cos(toRad(t.n / 2)) ** 2,
      rounding: D2,
    };
  },

  // 第85回(8) [RAD] θ = tan⁻¹( ( ωL - 1 ÷ ( ωC ) ) ÷ R )
  (rng) => {
    const w = dec(rng, 100, 400, 2);
    const L = dec(rng, 0.02, 0.3, 3);
    const C = dec(rng, 0.00002, 0.0002, 6);
    const R = decNonZero(rng, 1, 9.99, 2, 0.5);
    const value = Math.atan((w.n * L.n - 1 / (w.n * C.n)) / R.n);
    return {
      category: '実務計算',
      question: `θ = tan⁻¹( ( ωL - 1 ÷ ( ωC ) ) ÷ R ) において、ω = ${w.tok}, L = ${L.tok}, C = ${C.tok}, R = ${R.tok} のときの θ`,
      guide: ['tan-1', '(', '(', w.tok, '×', L.tok, '-', '1', '÷', '(', w.tok, '×', C.tok, ')', ')', '÷', R.tok, ')', '='],
      value,
      rounding: D2,
      angleMode: 'RAD',
    };
  },
];

// ────────────────────────────────────────────────────────────
// 2級
//
// 2級は3級・4級と構成が違い、四則計算が無く「方程式と不等式」が入る。
//   (1) 関数計算（15分）    … n乗・n乗根、三角・逆三角、指数・対数、順列組合せ
//   (2) 方程式と不等式（20分）… 1〜3次方程式、連立方程式、不等式
//   (3) 応用計算（30分）    … 式の変形、三角関数と三平方の定理
//
// **手元に2級の過去問が無い。** ここに書いてあるのは、公表されている
// 出題範囲（全国工業高等学校長協会／Wikipedia、および倉敷工業高校
// 「計算技術検定2級受験のポイント」）に沿って作った形であって、
// 過去問から写したものではない。3級のテンプレートとはそこが違う。
//
// 答え方の決まりも同じ資料から:
//   - 解答の途中で四捨五入しない
//   - 不等式は、まず四捨五入せずに解き、解答欄の ≦ ≧ の向きに合わせて
//     切上げ・切捨てる（単純な四捨五入にしない）
// ────────────────────────────────────────────────────────────

const D4: Rounding = { kind: 'decimals', value: 4 };
const CEIL2: Rounding = { kind: 'ceil', value: 2 };
const FLOOR2: Rounding = { kind: 'floor', value: 2 };

const ni_kansuu: Template[] = [
  // n乗と n乗根
  (rng) => {
    const a = dec(rng, 1.2, 9.99, 2);
    const b = dec(rng, 1.1, 3.5, 2);
    const n = int(rng, 3, 6);
    const c = dec(rng, 1.2, 99.9, 2);
    return {
      category: '関数計算',
      question: `${a.tok}^${b.tok} + ${n}√${c.tok}`,
      guide: [a.tok, 'x^y', b.tok, ')', '+', String(n), 'x√', c.tok, '='],
      value: a.n ** b.n + c.n ** (1 / n),
      rounding: D4,
    };
  },

  // 逆三角関数。答えは度で出す
  (rng) => {
    const x = dec(rng, 0.05, 0.95, 3);
    const y = dec(rng, 0.05, 0.95, 3);
    return {
      category: '関数計算',
      question: `sin⁻¹ ${x.tok} + cos⁻¹ ${y.tok}  （答えは度）`,
      guide: ['sin-1', x.tok, '+', 'cos-1', y.tok, '='],
      value: (Math.asin(x.n) * 180) / Math.PI + (Math.acos(y.n) * 180) / Math.PI,
      rounding: D2,
    };
  },

  // 度分秒をラジアンで表す（2級の資料にある「32°20′ は 0.564323(RAD)」の形）
  (rng) => {
    const d = int(rng, 10, 80);
    const m = int(rng, 1, 59);
    const value = ((d + m / 60) * Math.PI) / 180;
    return {
      category: '関数計算',
      question: `${d}°${m}′ は何ラジアンか`,
      guide: [String(d), '°\'"', String(m), '°\'"', '×', 'π', '÷', '1', '8', '0', '='],
      value,
      rounding: { kind: 'decimals', value: 6 },
    };
  },

  // 指数関数と自然対数
  (rng) => {
    const a = dec(rng, 0.5, 2.5, 2);
    const b = dec(rng, 1.2, 9.99, 2);
    return {
      category: '関数計算',
      question: `e^${a.tok} - logₑ ${b.tok}`,
      guide: ['e^x', a.tok, ')', '-', 'ln', b.tok, '='],
      value: Math.exp(a.n) - Math.log(b.n),
      rounding: D4,
    };
  },

  // 常用対数と 10 のべき乗
  (rng) => {
    const a = dec(rng, 1.2, 9.99, 2);
    const b = dec(rng, 0.2, 2.5, 2);
    return {
      category: '関数計算',
      question: `log ${a.tok} × 10^${b.tok}`,
      guide: ['log', a.tok, ')', '×', '10^x', b.tok, '='],
      value: Math.log10(a.n) * 10 ** b.n,
      rounding: D4,
    };
  },

  // 順列と組合せ
  (rng) => {
    const n = int(rng, 6, 12);
    const r = int(rng, 2, 4);
    return {
      category: '関数計算',
      question: `${n}P${r} ÷ ${n}C${r}`,
      guide: [String(n), 'nPr', String(r), '÷', '(', String(n), 'nCr', String(r), ')', '='],
      value: (fact(n) / fact(n - r)) / (fact(n) / (fact(r) * fact(n - r))),
      rounding: D2,
    };
  },

  // 三角関数の合成
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const t = dec(rng, 5, 85, 1);
    return {
      category: '関数計算',
      question: `${a.tok} sin ${t.tok}° + ${b.tok} cos ${t.tok}°`,
      guide: [a.tok, '×', 'sin', t.tok, '+', b.tok, '×', 'cos', t.tok, '='],
      value: a.n * Math.sin(toRad(t.n)) + b.n * Math.cos(toRad(t.n)),
      rounding: D4,
    };
  },

  // 割合（％）。資料に「数値と単位は分けて考える。特に％は注意」とある
  (rng) => {
    const a = dec(rng, 1, 99.9, 2);
    const b = decNonZero(rng, 10, 199.9, 2, 5);
    return {
      category: '関数計算',
      question: `R = ${a.tok} ÷ ${b.tok} × 100 の R は何 %`,
      guide: [a.tok, '÷', b.tok, '×', '1', '0', '0', '='],
      value: (a.n / b.n) * 100,
      rounding: D2,
    };
  },
];

const ni_houteishiki: Template[] = [
  // 1次方程式。係数項と定数項に整理して x = 定数項 ÷ 係数項
  (rng) => {
    const a = decNonZero(rng, 1, 9.99, 2, 0.5);
    const b = dec(rng, 1, 9.99, 2);
    const c = decNonZero(rng, 1, 9.99, 2, 0.5);
    const d = dec(rng, 1, 9.99, 2);
    const coef = a.n - c.n;
    if (Math.abs(coef) < 0.3) return ni_houteishiki[1](rng);
    return {
      category: '方程式と不等式',
      question: `${a.tok} x + ${b.tok} = ${c.tok} x + ${d.tok} の x`,
      guide: ['(', d.tok, '-', b.tok, ')', '÷', '(', a.tok, '-', c.tok, ')', '='],
      value: (d.n - b.n) / coef,
      rounding: D2,
    };
  },

  // 1次方程式（分数の形）
  (rng) => {
    const a = decNonZero(rng, 1, 9.99, 2, 0.5);
    const b = dec(rng, 1, 9.99, 2);
    const c = decNonZero(rng, 1, 9.99, 2, 0.5);
    return {
      category: '方程式と不等式',
      question: `x ÷ ${a.tok} + ${b.tok} = ${c.tok} の x`,
      guide: ['(', c.tok, '-', b.tok, ')', '×', a.tok, '='],
      value: (c.n - b.n) * a.n,
      rounding: D2,
    };
  },

  // 2次方程式（解の公式・大きい方の解）
  //
  // 係数は正の数だけを出し、符号は式の見た目に書く。
  // ガイドに "-6.22" のような負のトークンを入れると、
  // そのままでは押せるキーに対応しない。
  (rng) => {
    const a = decNonZero(rng, 0.5, 3, 2, 0.5);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const disc = b.n * b.n + 4 * a.n * c.n;
    return {
      category: '方程式と不等式',
      question: `${a.tok} x² - ${b.tok} x - ${c.tok} = 0 の大きい方の解`,
      guide: ['(', b.tok, '+', '√', '(', b.tok, 'x²', '+', '4', '×', a.tok, '×', c.tok, ')', ')',
              '÷', '(', '2', '×', a.tok, ')', '='],
      value: (b.n + Math.sqrt(disc)) / (2 * a.n),
      rounding: D2,
    };
  },

  // 2次方程式（小さい方の解）
  (rng) => {
    const a = decNonZero(rng, 0.5, 3, 2, 0.5);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const disc = b.n * b.n + 4 * a.n * c.n;
    return {
      category: '方程式と不等式',
      question: `${a.tok} x² - ${b.tok} x - ${c.tok} = 0 の小さい方の解`,
      guide: ['(', b.tok, '-', '√', '(', b.tok, 'x²', '+', '4', '×', a.tok, '×', c.tok, ')', ')',
              '÷', '(', '2', '×', a.tok, ')', '='],
      value: (b.n - Math.sqrt(disc)) / (2 * a.n),
      rounding: D2,
    };
  },

  // 連立方程式（2元1次）の x
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 99.9, 2);
    const d = dec(rng, 1, 9.99, 2);
    const e = dec(rng, 1, 9.99, 2);
    const f = dec(rng, 1, 99.9, 2);
    const det = a.n * e.n - b.n * d.n;
    if (Math.abs(det) < 0.5) return ni_houteishiki[0](rng);
    return {
      category: '方程式と不等式',
      question: `${a.tok} x + ${b.tok} y = ${c.tok} , ${d.tok} x + ${e.tok} y = ${f.tok} の x`,
      guide: ['(', c.tok, '×', e.tok, '-', b.tok, '×', f.tok, ')', '÷',
              '(', a.tok, '×', e.tok, '-', b.tok, '×', d.tok, ')', '='],
      value: (c.n * e.n - b.n * f.n) / det,
      rounding: D2,
    };
  },

  // 連立方程式の y
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 99.9, 2);
    const d = dec(rng, 1, 9.99, 2);
    const e = dec(rng, 1, 9.99, 2);
    const f = dec(rng, 1, 99.9, 2);
    const det = a.n * e.n - b.n * d.n;
    if (Math.abs(det) < 0.5) return ni_houteishiki[0](rng);
    return {
      category: '方程式と不等式',
      question: `${a.tok} x + ${b.tok} y = ${c.tok} , ${d.tok} x + ${e.tok} y = ${f.tok} の y`,
      guide: ['(', a.tok, '×', f.tok, '-', c.tok, '×', d.tok, ')', '÷',
              '(', a.tok, '×', e.tok, '-', b.tok, '×', d.tok, ')', '='],
      value: (a.n * f.n - c.n * d.n) / det,
      rounding: D2,
    };
  },

  // 不等式（≦）。範囲に収まるよう切り捨てる
  (rng) => {
    const a = dec(rng, 1.1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 20, 99.9, 2);
    return {
      category: '方程式と不等式',
      question: `${a.tok} x + ${b.tok} ≦ ${c.tok} を満たす x （x ≦ □）`,
      guide: ['(', c.tok, '-', b.tok, ')', '÷', a.tok, '='],
      value: (c.n - b.n) / a.n,
      rounding: FLOOR2,
    };
  },

  // 不等式（≧）。範囲に収まるよう切り上げる
  (rng) => {
    const a = dec(rng, 1.1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 20, 99.9, 2);
    return {
      category: '方程式と不等式',
      question: `${a.tok} x - ${b.tok} ≧ ${c.tok} を満たす x （x ≧ □）`,
      guide: ['(', c.tok, '+', b.tok, ')', '÷', a.tok, '='],
      value: (c.n + b.n) / a.n,
      rounding: CEIL2,
    };
  },
];

const ni_ouyou: Template[] = [
  // 三平方の定理
  (rng) => {
    const a = dec(rng, 1, 99.9, 2);
    const b = dec(rng, 1, 99.9, 2);
    return {
      category: '応用計算',
      question: `直角をはさむ2辺が ${a.tok} と ${b.tok} の直角三角形の斜辺`,
      guide: ['√', '(', a.tok, 'x²', '+', b.tok, 'x²', ')', '='],
      value: Math.sqrt(a.n ** 2 + b.n ** 2),
      rounding: D2,
    };
  },

  // 余弦定理
  (rng) => {
    const b = dec(rng, 1, 99.9, 2);
    const c = dec(rng, 1, 99.9, 2);
    const t = dec(rng, 20, 160, 1);
    return {
      category: '応用計算',
      question: `2辺が ${b.tok} と ${c.tok}、その間の角が ${t.tok}° の三角形の残りの辺`,
      guide: ['√', '(', b.tok, 'x²', '+', c.tok, 'x²', '-', '2', '×', b.tok, '×', c.tok, '×', 'cos', t.tok, ')', '='],
      value: Math.sqrt(b.n ** 2 + c.n ** 2 - 2 * b.n * c.n * Math.cos(toRad(t.n))),
      rounding: D2,
    };
  },

  // 正弦定理
  (rng) => {
    const b = dec(rng, 1, 99.9, 2);
    const A = dec(rng, 15, 80, 1);
    const B = dec(rng, 15, 80, 1);
    return {
      category: '応用計算',
      question: `b = ${b.tok}, A = ${A.tok}°, B = ${B.tok}° の三角形の a （正弦定理）`,
      guide: [b.tok, '×', 'sin', A.tok, '÷', 'sin', B.tok, '='],
      value: (b.n * Math.sin(toRad(A.n))) / Math.sin(toRad(B.n)),
      rounding: D2,
    };
  },

  // 三角形の面積
  (rng) => {
    const a = dec(rng, 1, 99.9, 2);
    const b = dec(rng, 1, 99.9, 2);
    const t = dec(rng, 15, 165, 1);
    return {
      category: '応用計算',
      question: `2辺が ${a.tok} と ${b.tok}、その間の角が ${t.tok}° の三角形の面積`,
      guide: ['0.5', '×', a.tok, '×', b.tok, '×', 'sin', t.tok, '='],
      value: 0.5 * a.n * b.n * Math.sin(toRad(t.n)),
      rounding: D2,
    };
  },

  // 式の変形（y = (a - b) x を x について解く）
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = spread(rng, 1, 9.99, 2, a.n, 0.5);
    const y = dec(rng, 1, 99.9, 2);
    return {
      category: '応用計算',
      question: `y = ( a - b ) x を x について解き、a = ${a.tok}, b = ${b.tok}, y = ${y.tok} のときの x`,
      guide: [y.tok, '÷', '(', a.tok, '-', b.tok, ')', '='],
      value: y.n / (a.n - b.n),
      rounding: D2,
    };
  },

  // 減衰（自然対数を使って時間を求める）
  (rng) => {
    const n0 = dec(rng, 10, 99.9, 2);
    const n = dec(rng, 1, n0.n - 1, 2);
    const k = dec(rng, 0.05, 0.9, 3);
    return {
      category: '応用計算',
      question: `N = N₀ e^( - k t ) を t について解き、N₀ = ${n0.tok}, N = ${n.tok}, k = ${k.tok} のときの t`,
      guide: ['-', 'ln', '(', n.tok, '÷', n0.tok, ')', '÷', k.tok, '='],
      value: -Math.log(n.n / n0.n) / k.n,
      rounding: D4,
    };
  },

  // 常用対数（利得）
  (rng) => {
    const pin = dec(rng, 0.5, 9.99, 2);
    const pout = dec(rng, 10, 999.9, 2);
    return {
      category: '応用計算',
      question: `G = 10 log ( P₂ ÷ P₁ ) において、P₁ = ${pin.tok}, P₂ = ${pout.tok} のときの G`,
      guide: ['1', '0', '×', 'log', '(', pout.tok, '÷', pin.tok, ')', '='],
      value: 10 * Math.log10(pout.n / pin.n),
      rounding: D2,
    };
  },

  // 円弧の長さ（度をラジアンに直す）
  (rng) => {
    const r = dec(rng, 1, 99.9, 2);
    const t = dec(rng, 10, 350, 1);
    return {
      category: '応用計算',
      question: `半径 ${r.tok}、中心角 ${t.tok}° の円弧の長さ`,
      guide: [r.tok, '×', t.tok, '×', 'π', '÷', '1', '8', '0', '='],
      value: (r.n * t.n * Math.PI) / 180,
      rounding: D2,
    };
  },
];

function fact(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i += 1) r *= i;
  return r;
}

export const TEMPLATES: Record<DrillLevel, Record<string, Template[]>> = {
  '4級': {
    四則計算: yon_shisoku,
    集計計算: yon_shukei,
    実務計算: yon_jitsumu,
  },
  '2級': {
    関数計算: ni_kansuu,
    方程式と不等式: ni_houteishiki,
    応用計算: ni_ouyou,
  },
  '3級': {
    四則計算: [...san_shisoku, ...san_shisoku_kakomon],
    関数計算: [...san_kansuu, ...san_kansuu_kakomon],
    実務計算: [...san_jitsumu, ...san_jitsumu_kakomon],
  },
};

export const CATEGORIES_BY_LEVEL: Record<DrillLevel, DrillCategory[]> = {
  '4級': ['四則計算', '集計計算', '実務計算'],
  '3級': ['四則計算', '関数計算', '実務計算'],
  '2級': ['関数計算', '方程式と不等式', '応用計算'],
};
