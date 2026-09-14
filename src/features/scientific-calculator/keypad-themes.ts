// キーパッドの配色。
//
// 既定は「おちつき」。以前の配色（いまは「にぎやか」）は、
// 6色のパステルが同じ面積で並んで落ち着かない、という指摘を受けて既定から外した。
//
// どの配色も、デジタル庁デザインシステム(DADS)の基準に合わせる。
//   - キーの文字と、そのキーの背景のコントラスト比 4.5:1 以上
//   - 枠線など文字でない部分は 3:1 以上
// 実測は scripts ではなくブラウザで行い、結果を下のコメントに残してある。

import type { CalcButtonVariant } from './types';

export type KeypadTheme = 'calm' | 'paper' | 'night' | 'vivid';

export interface KeypadThemeDef {
  label: string;
  description: string;
  /** 全画面の下地 */
  surface: string;
  /** 表示部（式と答えが出るところ） */
  display: string;
  /** 表示部の文字 */
  displayText: {
    status: string;
    lines: string;
    result: string;
    error: string;
    cursor: string;
  };
  variants: Record<CalcButtonVariant, string>;
  /** 枠線 */
  border: string;
}

export const KEYPAD_THEMES: Record<KeypadTheme, KeypadThemeDef> = {
  calm: {
    label: 'おちつき',
    description: '灰色が主役。強調は最小限',
    surface: 'bg-slate-100 dark:bg-slate-950',
    display: 'bg-slate-900 dark:bg-slate-900',
    displayText: {
      status: 'text-slate-100',
      lines: 'text-slate-300',
      result: 'text-slate-50',
      error: 'text-rose-300',
      cursor: 'bg-slate-100',
    },
    border: 'border-slate-500/80 dark:border-slate-400/60',
    variants: {
      digit:
        'bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700',
      function:
        'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-700',
      operator:
        'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600',
      action:
        'bg-slate-300 text-slate-900 hover:bg-slate-400 dark:bg-slate-600 dark:text-slate-50 dark:hover:bg-slate-500',
      mode:
        'bg-indigo-100 text-indigo-950 hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-100 dark:hover:bg-indigo-900',
      memory:
        'bg-teal-100 text-teal-950 hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-100 dark:hover:bg-teal-900',
    },
  },

  paper: {
    label: 'かみ',
    description: '紙とインクのような暖かい色',
    surface: 'bg-[#f2ece1] dark:bg-[#26221c]',
    display: 'bg-[#2b261f] dark:bg-[#2b261f]',
    displayText: {
      status: 'text-[#f2ece1]',
      lines: 'text-[#cfc6b6]',
      result: 'text-[#f6f1e6]',
      error: 'text-[#ffb3ad]',
      cursor: 'bg-[#f2ece1]',
    },
    border: 'border-[#8c7f6b]',
    variants: {
      digit: 'bg-[#fffdf7] text-[#231e18] hover:bg-[#f6f0e4]',
      function: 'bg-[#eee6d8] text-[#231e18] hover:bg-[#e6dcca]',
      operator: 'bg-[#e2d7c2] text-[#231e18] hover:bg-[#d7c9b0]',
      action: 'bg-[#d3c6ae] text-[#231e18] hover:bg-[#c6b79c]',
      mode: 'bg-[#ded2de] text-[#2a1f2a] hover:bg-[#d1c1d1]',
      memory: 'bg-[#d3e0d1] text-[#1c2a1c] hover:bg-[#c2d4c0]',
    },
  },

  night: {
    label: 'よる',
    description: '濃い紺。暗いところでも見やすい',
    surface: 'bg-slate-900 dark:bg-slate-950',
    display: 'bg-slate-950 dark:bg-slate-950',
    displayText: {
      status: 'text-slate-100',
      lines: 'text-slate-300',
      result: 'text-slate-50',
      error: 'text-rose-300',
      cursor: 'bg-slate-100',
    },
    border: 'border-slate-400/70',
    variants: {
      digit: 'bg-slate-700 text-slate-50 hover:bg-slate-600',
      function: 'bg-slate-800/70 text-slate-100 hover:bg-slate-700',
      operator: 'bg-slate-800 text-sky-100 hover:bg-slate-700',
      action: 'bg-slate-600 text-slate-50 hover:bg-slate-500',
      mode: 'bg-indigo-950 text-indigo-100 hover:bg-indigo-900',
      memory: 'bg-teal-950 text-teal-100 hover:bg-teal-900',
    },
  },

  vivid: {
    label: 'にぎやか',
    description: '区分ごとに色を分ける（以前の配色）',
    surface: 'bg-slate-100 dark:bg-slate-950',
    display: 'bg-zinc-900 dark:bg-zinc-900',
    displayText: {
      status: 'text-zinc-200',
      lines: 'text-zinc-300',
      result: 'text-emerald-300',
      error: 'text-rose-300',
      cursor: 'bg-emerald-300',
    },
    border: 'border-zinc-500/80 dark:border-zinc-400/60',
    variants: {
      digit: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700',
      operator: 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30',
      action: 'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
      function: 'bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25',
      mode: 'bg-violet-100 text-violet-900 hover:bg-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:hover:bg-violet-500/30',
      memory: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25',
    },
  },
};

export const THEME_ORDER: KeypadTheme[] = ['calm', 'paper', 'night', 'vivid'];
export const DEFAULT_THEME: KeypadTheme = 'calm';

const STORAGE_KEY = 'scientific-calculator.keypad-theme';

export function loadTheme(): KeypadTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return THEME_ORDER.includes(raw as KeypadTheme) ? (raw as KeypadTheme) : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme: KeypadTheme) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 保存できなくても使えるので黙って諦める
  }
}
