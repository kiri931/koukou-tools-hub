export type DrillLevel = '2級' | '3級' | '4級';

/**
 * 計算技術検定の実際の出題区分。
 *   4級: 四則計算（4〜6数値）／集計計算（積和・和と割合）／実務計算（比例・反比例・平方・平方根）
 *   3級: 四則計算／関数計算／実務計算
 *   2級: 関数計算／方程式と不等式／応用計算
 * 2級だけ構成が違い、四則計算が無く、方程式と不等式が入る。
 */
export type DrillCategory =
  | '四則計算'
  | '集計計算'
  | '関数計算'
  | '実務計算'
  | '方程式と不等式'
  | '応用計算';

/**
 * 答えをどこまで丸めて答えるか。自動検算（problems.diagnostic.test.ts）もこれを見る。
 *
 * ceil / floor は2級の不等式用。
 * 「まず四捨五入せずに解き、解答欄の ≦ ≧ の向きに合わせて切上げ・切捨てる」
 * という答え方なので、四捨五入では合わない。
 */
export type Rounding =
  | { kind: 'decimals'; value: number }
  | { kind: 'sigfigs'; value: number }
  | { kind: 'ceil'; value: number }
  | { kind: 'floor'; value: number };

export interface DrillProblem {
  id: string;
  level: DrillLevel;
  category: DrillCategory;
  question: string;
  expectedAnswer: string;
  keySequence: string[];
  /** 'RAD' の問題は、手順に入る前に DEG/RAD キーを押させる */
  angleMode: 'DEG' | 'RAD';
  rounding?: Rounding;
}

export type DrillLevelFilter = DrillLevel | 'すべて';

/** 練習する区分。解答用紙も「自分で解く」も、ここを1つに決めてから始める。 */
export interface DrillChoice {
  level: DrillLevel;
  category: DrillCategory;
}

export function roundingLabel(rounding?: Rounding): string | null {
  if (!rounding) return null;
  switch (rounding.kind) {
    case 'decimals': return `小数第${rounding.value}位まで`;
    case 'sigfigs': return `有効数字${rounding.value}けたまで`;
    case 'ceil': return `小数第${rounding.value}位まで切り上げ`;
    case 'floor': return `小数第${rounding.value}位まで切り捨て`;
  }
}
