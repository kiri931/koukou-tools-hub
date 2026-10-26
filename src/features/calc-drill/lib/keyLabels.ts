import { BUTTON_ROWS } from '@/features/scientific-calculator/components/CalcKeypad';

/**
 * action からキーの表示名を引く表。
 * 「押す順」を、実物のキーに書いてある字で見せるために使う。
 * キー配置を変えても、ここが自動で追従する。
 */
export const KEY_LABELS: Record<string, string> = Object.fromEntries(
  BUTTON_ROWS.flat().flatMap((button) => {
    const entries: [string, string][] = [[button.action, button.label]];
    if (button.shiftAction) entries.push([button.shiftAction, button.shiftLabel ?? button.label]);
    if (button.altAction) entries.push([button.altAction, button.altLabel ?? button.label]);
    return entries;
  })
);

/** SHIFT を押してから出すキー。データには SHIFT を書かないので、見せるときに補う。 */
const SHIFT_ONLY = new Set(
  BUTTON_ROWS.flat()
    .map((button) => button.shiftAction)
    .filter((action): action is string => Boolean(action))
);

const SHIFT_LABEL = KEY_LABELS['toggle-shift'] ?? 'SHIFT';

/**
 * 問題の押す順（keySequence）を、人が読むキーの並びにする。
 *  - 数字と小数点は1つの数にまとめる（3 . 4 6 → 3.46）
 *  - SHIFT 側のキーの前に SHIFT を補う
 *  - 表示名は電卓のキーに書いてある字（KEY_LABELS）
 */
export function keyStepsFor(keySequence: readonly string[]): string[] {
  const steps: string[] = [];
  let number = '';
  const flush = () => {
    if (number) steps.push(number);
    number = '';
  };
  for (const key of keySequence) {
    if (/^[0-9.]$/.test(key)) {
      number += key;
      continue;
    }
    flush();
    if (SHIFT_ONLY.has(key)) steps.push(SHIFT_LABEL);
    steps.push(KEY_LABELS[key] ?? key);
  }
  flush();
  return steps;
}
