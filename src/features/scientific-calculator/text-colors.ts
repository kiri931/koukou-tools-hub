/**
 * 文字の色と大きさの決まり。
 *
 * 「なんとなく読みやすい色」を各所で書くと、下地が変わったときに気づかずに
 * 読めなくなる。使ってよい組み合わせをここに列挙し、
 * text-colors.test.ts が実際にコントラスト比を計算して見張る。
 *
 * 基準はデジタル庁デザインシステム(DADS) / WCAG 2.2 AA:
 *   - 文字と、その文字が乗る下地のコントラスト比 4.5:1 以上
 *     （24px以上、または18.66px以上の太字は 3:1 以上）
 *   - 非テキスト（枠線・アイコン）は 3:1 以上
 *   - 本文は16px以上。14px未満は使わない
 *
 * 決まりごと:
 *   1. **文字色は、乗る下地とセットで決める。** 下地が明るいか暗いかで
 *      使う色が変わる。どちらに乗るか分からない文字は作らない。
 *   2. **色だけに意味を持たせない。** 正誤・状態は記号(✓ ✗ ▶ ▲)や
 *      文言も必ず添える。色覚の違いや、白黒印刷でも伝わるようにする。
 *   3. **薄いグレーで「控えめ」を表さない。** 補助の文字も 4.5:1 を守る。
 *      目立たせたくないときは、色を薄くするのではなく大きさや配置で下げる。
 *   4. **上付き・下付きも14px を下回らない。** 指数は答えを左右するので、
 *      小さくして読み違えさせない（実測: 16px×0.75 = 12px になっていた）。
 */

/** 文字が乗る下地の種類 */
export type Surface =
  | 'page'        // ページの地（白 / 濃紺）
  | 'card'        // カード・用紙の上（白）
  | 'display'     // 電卓の表示部（濃い）
  | 'accent'      // 塗りつぶしたボタンの上（濃い色）
  | 'warning';    // 警告の帯の上（淡い赤 / 濃い赤）

/** 文字の役割 */
export type TextRole =
  | 'body'        // 本文
  | 'muted'       // 補助（それでも 4.5:1 を守る）
  | 'strong'      // 強調
  | 'correct'     // 正解
  | 'wrong'       // 不正解・警告
  | 'onFilled';   // 塗りつぶしの上の文字

/** 役割 × 下地 で使う Tailwind のクラス。ここに無い組み合わせは作らない。 */
export const TEXT_COLOR: Record<Surface, Partial<Record<TextRole, string>>> = {
  page: {
    body: 'text-slate-900 dark:text-slate-100',
    muted: 'text-slate-700 dark:text-slate-300',
    strong: 'text-slate-900 dark:text-white',
    correct: 'text-emerald-800 dark:text-emerald-300',
    wrong: 'text-rose-800 dark:text-rose-300',
  },
  card: {
    body: 'text-slate-900 dark:text-slate-100',
    muted: 'text-slate-700 dark:text-slate-300',
    strong: 'text-slate-900 dark:text-white',
    correct: 'text-emerald-800 dark:text-emerald-300',
    wrong: 'text-rose-800 dark:text-rose-300',
  },
  display: {
    body: 'text-slate-100',
    muted: 'text-slate-300',
    strong: 'text-slate-50',
    wrong: 'text-rose-300',
  },
  accent: {
    onFilled: 'text-white',
  },
  warning: {
    strong: 'text-rose-900 dark:text-rose-100',
    body: 'text-rose-900 dark:text-rose-100',
  },
};

/** 文字の最小サイズ(px)。上付きや注記もここを下回らない。 */
export const MIN_FONT_SIZE = 14;
/** 本文の目安サイズ(px) */
export const BODY_FONT_SIZE = 16;
