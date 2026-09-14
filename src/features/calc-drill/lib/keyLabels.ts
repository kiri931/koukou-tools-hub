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
