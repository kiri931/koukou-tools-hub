import { BODY_FONT_SIZE, MIN_FONT_SIZE, TEXT_COLOR, type Surface, type TextRole } from './text-colors';

/**
 * 文字色の決まりを、実際にコントラスト比を計算して見張る。
 *
 * 画面を目で見て決めると、下地が変わったときに気づかずに読めなくなる。
 * Tailwind の色は決め打ちの値なので、ここで計算できる。
 */

/** Tailwind v4 の色（oklch ではなく、実際に描画される sRGB 値） */
const SWATCH: Record<string, [number, number, number]> = {
  white: [255, 255, 255],
  'slate-50': [248, 250, 252],
  'slate-100': [241, 245, 249],
  'slate-300': [203, 213, 225],
  'slate-700': [51, 65, 85],
  'slate-900': [15, 23, 42],
  'slate-950': [2, 6, 23],
  'emerald-300': [110, 231, 183],
  'emerald-800': [6, 95, 70],
  'rose-100': [255, 228, 230],
  'rose-300': [253, 164, 175],
  'rose-800': [159, 18, 57],
  'rose-900': [136, 19, 55],
  'rose-950': [76, 5, 25],
  'violet-800': [91, 33, 182],
};

/** 下地の色（ライト / ダーク） */
const SURFACE_BG: Record<Surface, { light: string; dark: string }> = {
  page: { light: 'white', dark: 'slate-950' },
  card: { light: 'white', dark: 'slate-900' },
  display: { light: 'slate-900', dark: 'slate-900' },
  accent: { light: 'violet-800', dark: 'violet-800' },
  warning: { light: 'rose-100', dark: 'rose-950' },
};

function srgb(c: number) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function luminance([r, g, b]: [number, number, number]) {
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
function contrast(a: string, b: string) {
  const l1 = luminance(SWATCH[a]);
  const l2 = luminance(SWATCH[b]);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** "text-slate-900 dark:text-white" → { light: 'slate-900', dark: 'white' } */
function parse(classes: string) {
  let light = '';
  let dark = '';
  for (const token of classes.split(/\s+/)) {
    const darkMatch = token.match(/^dark:text-(.+)$/);
    if (darkMatch) { dark = darkMatch[1]; continue; }
    const lightMatch = token.match(/^text-(.+)$/);
    if (lightMatch) light = lightMatch[1];
  }
  return { light, dark: dark || light };
}

describe('文字色の決まり', () => {
  it('どの組み合わせも 4.5:1 以上ある（ライトもダークも）', () => {
    const failures: string[] = [];
    for (const [surface, roles] of Object.entries(TEXT_COLOR) as [Surface, Partial<Record<TextRole, string>>][]) {
      for (const [role, classes] of Object.entries(roles)) {
        const { light, dark } = parse(classes!);
        for (const [mode, fg, bg] of [
          ['ライト', light, SURFACE_BG[surface].light],
          ['ダーク', dark, SURFACE_BG[surface].dark],
        ] as const) {
          if (!SWATCH[fg]) { failures.push(`${surface}/${role}: 色 ${fg} が表に無い`); continue; }
          const ratio = contrast(fg, bg);
          if (ratio < 4.5) {
            failures.push(`${surface}/${role} ${mode}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('本文は16px、下限は14px', () => {
    expect(BODY_FONT_SIZE).toBeGreaterThanOrEqual(16);
    expect(MIN_FONT_SIZE).toBeGreaterThanOrEqual(14);
  });

  it('薄いグレーを補助の文字に使っていない', () => {
    // slate-400 / slate-500 は白の上で 4.5:1 に届かない。使ったら落ちる。
    const all = Object.values(TEXT_COLOR).flatMap((roles) => Object.values(roles));
    expect(all.join(' ')).not.toMatch(/text-slate-(400|500)\b/);
    expect(all.join(' ')).not.toMatch(/dark:text-slate-(600|700)\b/);
  });
});
