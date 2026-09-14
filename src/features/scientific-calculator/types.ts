export type AngleMode = 'DEG' | 'RAD' | 'GRAD';
export type PanelMode = 'none' | 'stats' | 'digits' | 'consts';

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
