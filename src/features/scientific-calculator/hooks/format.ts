// 計算結果を表示形式（Norm / Fix / Sci / Eng）と基数（DEC/HEX/OCT/BIN）に従って
// 文字列にする。React にも mathjs にも依存しない純関数。

import type { NumberBase, NumberFormatMode } from '../types';

export interface FormatOptions {
  formatMode: NumberFormatMode;
  digits: number;
  base: NumberBase;
  engShift?: number;
}

export const BASE_RADIX: Record<NumberBase, number> = {
  DEC: 10,
  HEX: 16,
  OCT: 8,
  BIN: 2,
};

/** その基数で使える文字か（'A'〜'F' は16進のときだけ） */
export function baseAllowsChar(base: NumberBase, ch: string) {
  const v = Number.parseInt(ch, 16);
  if (Number.isNaN(v)) return false;
  return v < BASE_RADIX[base];
}

/**
 * 従来からの見せ方（Norm）。ここは変えない。
 * 既存のドリルや検定モードが、この文字列をそのまま答え合わせに使っている。
 */
export function formatNumberLike(value: number) {
  if (!Number.isFinite(value)) return 'Error';
  if (Object.is(value, -0)) return '0';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-10)) {
    return value.toExponential(10).replace(/\.0+e/, 'e').replace(/(\.\d*?)0+e/, '$1e');
  }
  const rounded = Math.round(value * 1e12) / 1e12;
  return String(rounded);
}

/** 2進/8進/16進。負の数は32ビットの2の補数で表す（市販機と同じ）。 */
export function formatInBase(value: number, base: NumberBase) {
  if (!Number.isFinite(value)) return 'Error';
  const truncated = Math.trunc(value);
  if (Math.abs(truncated) > 0xffffffff) return 'Error';
  const bits = truncated < 0 ? truncated >>> 0 : truncated;
  return bits.toString(BASE_RADIX[base]).toUpperCase();
}

/**
 * 科学表記・工学表記。
 * exponentStep=3 が工学表記（指数を3の倍数にそろえる）。
 */
export function formatScientific(
  value: number,
  significantDigits: number,
  exponentStep: 1 | 3,
  engShift = 0
) {
  if (!Number.isFinite(value)) return 'Error';
  const digits = Math.max(1, Math.min(significantDigits, 10));
  if (value === 0) return `${(0).toFixed(digits - 1)}E0`;

  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  let exponent = Math.floor(Math.log10(abs));
  if (exponentStep === 3) exponent = Math.floor(exponent / 3) * 3;

  // 丸めで桁が繰り上がる場合の補正（9.999 → 10.0）。
  // engShift を引く前に済ませる。引いたあとだと、ずらした指数が元に戻ってしまう。
  const provisional = abs / 10 ** exponent;
  const carryDecimals = Math.max(0, digits - 1 - Math.floor(Math.log10(provisional)));
  const roundedProvisional =
    Math.round(provisional * 10 ** carryDecimals) / 10 ** carryDecimals;
  const limit = exponentStep === 3 ? 1000 : 10;
  if (roundedProvisional >= limit) exponent += exponentStep;

  exponent -= engShift;
  const mantissa = abs / 10 ** exponent;
  const intDigits = mantissa >= 1 ? Math.floor(Math.log10(mantissa)) + 1 : 1;
  const fractionDigits = Math.max(0, Math.min(20, digits - intDigits));
  return `${sign}${mantissa.toFixed(fractionDigits)}E${exponent}`;
}

/** 十進の角度 → 度分秒（1.5 → 1°30'0"） */
export function formatDms(value: number) {
  if (!Number.isFinite(value)) return 'Error';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  let degrees = Math.floor(abs);
  let minutes = Math.floor((abs - degrees) * 60);
  let seconds = Math.round(((abs - degrees) * 60 - minutes) * 60 * 100) / 100;
  if (seconds >= 60) {
    seconds -= 60;
    minutes += 1;
  }
  if (minutes >= 60) {
    minutes -= 60;
    degrees += 1;
  }
  const secText = Number.isInteger(seconds) ? String(seconds) : seconds.toFixed(2);
  return `${sign}${degrees}°${minutes}'${secText}"`;
}

/** 結果の表示文字列を作る入口 */
export function formatResult(value: number, options: FormatOptions) {
  if (!Number.isFinite(value)) return 'Error';
  if (options.base !== 'DEC') return formatInBase(value, options.base);

  const digits = Math.max(0, Math.min(options.digits, 10));
  const engShift = options.engShift ?? 0;

  switch (options.formatMode) {
    case 'FIX': {
      const text = value.toFixed(digits);
      // -0.00 のような表示を避ける
      return Number(text) === 0 ? (0).toFixed(digits) : text;
    }
    case 'SCI':
      return formatScientific(value, Math.max(1, digits), 1, engShift);
    case 'ENG':
      return formatScientific(value, Math.max(1, digits), 3, engShift);
    case 'NORM':
    default:
      if (engShift !== 0) return formatScientific(value, 10, 3, engShift);
      return formatNumberLike(value);
  }
}

/** ステータス行に出す表示形式の名前（Sci3 など） */
export function formatModeLabel(formatMode: NumberFormatMode, digits: number) {
  switch (formatMode) {
    case 'FIX': return `Fix${digits}`;
    case 'SCI': return `Sci${digits}`;
    case 'ENG': return `Eng${digits}`;
    case 'NORM':
    default: return 'Norm';
  }
}
