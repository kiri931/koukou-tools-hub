export type AngleMode = 'DEG' | 'RAD' | 'GRAD';
export type PanelMode = 'none' | 'stats' | 'digits' | 'consts';

/** 計算技術検定の級。calc-drill の DrillLevel と同じ文字列にそろえてある。 */
export type ExamLevel = '4級' | '3級';

/** 検定の出題区分。4級は集計計算、3級は関数計算が入る。 */
export type ExamCategory = '四則計算' | '集計計算' | '関数計算' | '実務計算';

/**
 * 電卓の使い方。
 *  - calc     … 電卓だけ
 *  - problems … 1問ずつ出して、その場で答え合わせ
 *  - sheet    … 検定の解答用紙と同じ版面で10問まとめて解く
 */
export type CalculatorMode = 'calc' | 'problems' | 'sheet';

/** 最初の画面で選んだ内容 */
export interface ExamChoice {
  level: ExamLevel;
  category: ExamCategory;
  mode: CalculatorMode;
}

/** 表示形式（FSEキーで切り替え）。Norm は従来どおりの見せ方。 */
export type NumberFormatMode = 'NORM' | 'FIX' | 'SCI' | 'ENG';

/** 基数（DEC/HEX/OCT/BIN） */
export type NumberBase = 'DEC' | 'HEX' | 'OCT' | 'BIN';

/** 画面に積み上がる行 */
export interface DisplayLine {
  text: string;
  isResult: boolean;
}

export interface CalculatorState {
  expression: string;
  /** expression の中でのカーソル位置（文字数）。末尾なら expression.length */
  cursorPos: number;
  result: string;
  /** result を数値として持っておく。Ans や続きの計算はこちらを使う。 */
  resultValue: number | null;
  justEvaluated: boolean;
  hasError: boolean;
  shiftActive: boolean;
  /** ALT（第2機能）。SHIFT とは別の面。 */
  altActive: boolean;
  angleMode: AngleMode;
  formatMode: NumberFormatMode;
  /** FIX: 小数点以下の桁数 / SCI・ENG: 有効数字の桁数 */
  digits: number;
  base: NumberBase;
  /** ENG◀ / ENG▶ でずらした指数 */
  engShift: number;
  /** 度分秒表示に切り替えているか */
  dmsView: boolean;
  panelMode: PanelMode;
  memory: number;
  /** 過去の式と答え（新しいものが後ろ） */
  lines: DisplayLine[];
  /** ▲▼ で呼び戻すための、過去に入力した式 */
  inputHistory: string[];
  historyCursor: number | null;
}

export interface DmsState {
  degrees: string;
  minutes: string;
  seconds: string;
}

export type CalcButtonVariant = 'digit' | 'operator' | 'action' | 'function' | 'mode' | 'memory';

export interface ButtonDef {
  label: string;
  shiftLabel?: string;
  action: string;
  shiftAction?: string;
  /** ALT を押したときの機能。SHIFT とは独立して足せる。 */
  altLabel?: string;
  altAction?: string;
  altDescription?: string;
  variant: CalcButtonVariant;
  wide?: boolean;
  description?: string;
  shiftDescription?: string;
}

export interface StatisticsSummary {
  n: number;
  mean: number;
  stddev: number;
}
