export type DrillLevel = '3級' | '4級';

/** 計算技術検定の実際の出題区分。4級は集計計算、3級は関数計算。 */
export type DrillCategory = '四則計算' | '集計計算' | '関数計算' | '実務計算';

/** 答えをどこまで丸めて答えるか。自動検算（problems.diagnostic.test.ts）もこれを見る。 */
export type Rounding =
  | { kind: 'decimals'; value: number }
  | { kind: 'sigfigs'; value: number };

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

export type DrillLevelFilter = DrillLevel | '両方';

/** 練習する区分。解答用紙も「自分で解く」も、ここを1つに決めてから始める。 */
export interface DrillChoice {
  level: DrillLevel;
  category: DrillCategory;
}

export function roundingLabel(rounding?: Rounding): string | null {
  if (!rounding) return null;
  return rounding.kind === 'decimals'
    ? `小数第${rounding.value}位まで`
    : `有効数字${rounding.value}けたまで`;
}
