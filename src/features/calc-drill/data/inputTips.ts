import type { DrillCategory, DrillLevel } from '../types';

/**
 * 直感どおりに打つと違う答えになる入力のしかた。
 *
 * どれも過去問（第82・83・85・86回）に実際に出てくる形で、
 * 「そのまま左から打つと別の式になる」ものだけを集めてある。
 * 正しい押し順は keys に入れてあり、画面から電卓へそのまま流せる。
 */
export interface InputTip {
  id: string;
  title: string;
  /** どの級・分野で出るか */
  levels: DrillLevel[];
  categories: DrillCategory[];
  /** 紙に書かれている形 */
  written: string;
  /** そのまま左から打つとどうなるか */
  naive: string;
  /** なぜそうなるか */
  why: string;
  /** 正しい押し順 */
  keys: string[];
  /** その手順を試すときの角度モード */
  angleMode?: 'DEG' | 'RAD';
  /** 押し切ったときに出る答え（確かめ算のため、テストで検算する） */
  expected: number;
}

export const INPUT_TIPS: InputTip[] = [
  {
    id: 'function-paren',
    title: '関数のかっこは自分で閉じる',
    levels: ['3級'],
    categories: ['関数計算'],
    written: 'log 3.08 × 9.86',
    naive: 'log ( 3.08 × 9.86 ) … 掛けてから対数をとってしまう',
    why: 'log を押すと「log(」が開く。閉じないまま × を押すと、続きが中に入る。先に ) を押して閉じる。',
    keys: ['log(', '3.08', ')', '*', '9.86', '='],
    expected: Math.log10(3.08) * 9.86,
  },
  {
    id: 'trig-square',
    title: '三角関数の2乗は、かっこで囲んでから x²',
    levels: ['3級'],
    categories: ['関数計算'],
    written: 'sin² 32.8°',
    naive: 'sin ( 32.8² ) … 角度のほうを2乗してしまう',
    why: 'sin 32.8 x² と打つと 2乗が「かっこの中」に入る。( sin 32.8 ) と閉じてから x² を押す。',
    keys: ['(', 'sin(', '32.8', ')', '^2', '='],
    expected: Math.sin((32.8 * Math.PI) / 180) ** 2,
  },
  {
    id: 'exp-key',
    title: '×10ⁿ は「×10」を押さない',
    levels: ['3級'],
    categories: ['四則計算', '実務計算'],
    written: '5.73 × 10⁻³',
    naive: '5.73 × 1 0 ×10ⁿ (−) 3 … 10 を余分に掛けてしまう',
    why: '×10ⁿ キーが「×10の何乗」そのもの。数のすぐ後に押して、指数だけを入れる。',
    keys: ['5.73', 'exp10', '-', '3', '='],
    expected: 5.73e-3,
  },
  {
    id: 'root-order',
    title: 'ʸ√x は「根の数」を先に押す',
    levels: ['3級'],
    categories: ['関数計算'],
    written: '⁴√ 8.62',
    naive: '8.62 ʸ√x 4 … 8.62乗根になってしまう',
    why: '打つ順は「4 → ʸ√x → 8.62」。紙の左上に小さく書いてある数が先。',
    keys: ['4', 'xroot(', '8.62', '='],
    expected: 8.62 ** (1 / 4),
  },
  {
    id: 'npr-order',
    title: 'nPr・nCr は数と数の間に押す',
    levels: ['3級'],
    categories: ['実務計算'],
    written: '₇P₂',
    naive: 'nPr 7 2 … 関数のように先に押すと入らない',
    why: '「7 → nPr → 2」の順。x! も同じで、数を打ってから押す。',
    keys: ['7', 'nPr(', '2', '='],
    expected: 42,
  },
  {
    id: 'dms-key',
    title: '度分秒は °′″ を3回押す',
    levels: ['3級'],
    categories: ['関数計算', '実務計算'],
    written: '85°29′17″',
    naive: '85.2917 … 小数として打つと別の角度になる',
    why: '押すたびに度→分→秒と進む。分・秒は60進なので、小数に直して打ってはいけない。',
    keys: ['8', '5', 'dms', '2', '9', 'dms', '1', '7', 'dms', '='],
    expected: 85 + 29 / 60 + 17 / 3600,
  },
  {
    id: 'fraction-denominator',
    title: '分数の分母は、丸ごとかっこで囲む',
    levels: ['4級', '3級'],
    categories: ['四則計算', '実務計算'],
    written: '9.13 ÷ ( 1.09 ÷ ( 8.41 − 7.52 ) )',
    naive: '9.13 ÷ 1.09 ÷ 8.41 − 7.52 … 横線の下だけを割ったことにならない',
    why: '紙の横線は「下ぜんぶで割る」という意味。÷ のあとに ( を開いて、分母を全部入れてから閉じる。',
    keys: ['9.13', '/', '(', '1.09', '/', '(', '8.41', '-', '7.52', ')', ')', '='],
    expected: 9.13 / (1.09 / (8.41 - 7.52)),
  },
  {
    id: 'fraction-exponent',
    title: '分数の指数は、かっこを開いてから',
    levels: ['3級'],
    categories: ['関数計算'],
    written: '6.35^(1/3.05)',
    naive: '6.35 xʸ 1 ÷ 3.05 … 6.35の1乗を3.05で割ってしまう',
    why: 'xʸ を押すと指数のかっこが開く。1 ÷ 3.05 を入れてから ) で閉じる。',
    keys: ['6.35', '^(', '1', '/', '3.05', ')', '='],
    expected: 6.35 ** (1 / 3.05),
  },
  {
    id: 'rad-mode',
    title: '〔RAD〕の問題は、打つ前にモードを変える',
    levels: ['3級'],
    categories: ['関数計算', '実務計算'],
    written: 'cos ⅔π 〔RAD〕',
    naive: 'DEG のまま cos ( 2 ÷ 3 × π ) … 角度を「度」として計算してしまう',
    why: '毎回 (10) に1問出る。DEG のままだと全部ちがう答えになる。DRG で RAD にしてから打つ。',
    keys: ['cos(', '(', '2', '/', '3', '*', 'pi', ')', '='],
    angleMode: 'RAD',
    expected: Math.cos((2 / 3) * Math.PI),
  },
  {
    id: 'negative-sign',
    title: '符号のマイナスと、引き算のマイナス',
    levels: ['3級'],
    categories: ['四則計算', '関数計算'],
    written: '−2.48 × 10⁻⁴',
    naive: '前の数から引く形になり、式がつながってしまう',
    why: '数の符号は (−)、引き算は −。かっこの直後や式の先頭では (−) を使う。',
    keys: ['(', 'neg', '2.48', 'exp10', '-', '4', ')', '='],
    expected: -2.48e-4,
  },
];

export function tipsFor(level: DrillLevel, category: DrillCategory): InputTip[] {
  return INPUT_TIPS.filter(
    (t) => t.levels.includes(level) && t.categories.includes(category)
  );
}
