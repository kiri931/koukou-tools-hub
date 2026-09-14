// 最初の選択画面で選ぶ「級」と「分野」、およびそれに応じた電卓の初期設定。
//
// 目安（丸め方）は、手元の過去問（第82・83・85・86回、いずれも3級）の
// 表紙の指示をそのまま写したもの。4級の過去問は手元に無いため、
// 3級の書式に合わせた一般的な指示にしてある。

import type {
  AngleMode,
  ExamCategory,
  ExamChoice,
  ExamLevel,
  NumberBase,
  NumberFormatMode,
} from './types';

export interface ExamPreset {
  /** 電卓の初期設定 */
  angleMode: AngleMode;
  formatMode: NumberFormatMode;
  digits: number;
  base: NumberBase;
  /** 画面上部に出す、答えの丸め方の目安 */
  roundingHint: string;
  /** その分野で特によく使うキーの案内 */
  keyHint: string;
}

export const LEVELS: ExamLevel[] = ['4級', '3級'];

export const CATEGORIES_BY_LEVEL: Record<ExamLevel, ExamCategory[]> = {
  '4級': ['四則計算', '集計計算', '実務計算'],
  '3級': ['四則計算', '関数計算', '実務計算'],
};

export const DEFAULT_CHOICE: ExamChoice = { level: '3級', category: '四則計算', mode: 'calc' };

/**
 * 表示形式は Norm のままにしてある。
 * Fix2 を最初から入れると途中の値まで丸めて見えてしまい、
 * 多段の計算で誤差が出たまま気づけない。丸めるのは最後の1回だけにする。
 */
const COMMON = {
  angleMode: 'DEG' as const,
  formatMode: 'NORM' as const,
  digits: 6,
  base: 'DEC' as const,
};

const HINTS: Record<ExamLevel, Record<string, { roundingHint: string; keyHint: string }>> = {
  '4級': {
    四則計算: {
      roundingHint: '答えは四捨五入で小数第2位まで',
      keyHint: 'かっこと四則だけで解けます',
    },
    集計計算: {
      roundingHint: '答えは指示された位まで（整数のものもあります）',
      keyHint: '合計はメモリ（M+）に足していくと速いです',
    },
    実務計算: {
      roundingHint: '答えは四捨五入で小数第2位まで',
      keyHint: '比例・反比例・平方・平方根（√）を使います',
    },
  },
  '3級': {
    四則計算: {
      roundingHint: '小数第2位まで。ただし指示のあるものは有効数字3けたまで',
      keyHint: '×10ⁿ は Exp キー、符号は (−) を使います',
    },
    関数計算: {
      roundingHint: '小数第2位まで。ただし指示のあるものは有効数字3けたまで',
      keyHint: '度分秒は °′″、n乗根は ALT→xʸ、[RAD] の問題は DRG で切り替えます',
    },
    実務計算: {
      roundingHint: '整数と指示のあるものを除き、小数第2位まで',
      keyHint: '順列 nPr・組合せ nCr は ALT→× / ALT→÷、階乗は x! です',
    },
  },
};

export function presetFor(choice: ExamChoice): ExamPreset {
  const hint = HINTS[choice.level][choice.category] ?? {
    roundingHint: '答えは四捨五入で小数第2位まで',
    keyHint: '',
  };
  return { ...COMMON, ...hint };
}

const STORAGE_KEY = 'scientific-calculator.exam-choice';

/** 前回選んだ内容を、次に開いたときの既定にする（選択画面自体は毎回出す） */
export function loadChoice(): ExamChoice {
  if (typeof window === 'undefined') return DEFAULT_CHOICE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CHOICE;
    const parsed = JSON.parse(raw) as Partial<ExamChoice>;
    const level = LEVELS.includes(parsed.level as ExamLevel) ? (parsed.level as ExamLevel) : DEFAULT_CHOICE.level;
    const categories = CATEGORIES_BY_LEVEL[level];
    const category = categories.includes(parsed.category as ExamCategory)
      ? (parsed.category as ExamCategory)
      : categories[0];
    const mode = parsed.mode === 'problems' ? 'problems' : 'calc';
    return { level, category, mode };
  } catch {
    return DEFAULT_CHOICE;
  }
}

export function saveChoice(choice: ExamChoice) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
  } catch {
    // 保存できなくても使えるので、ここは黙って諦める
  }
}
