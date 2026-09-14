import { useCallback, useEffect, useMemo, useState } from 'react';
import { BUTTON_ROWS } from '../components/CalcKeypad';
import type { DrillProblem } from '@/features/calc-drill/types';

/** SHIFT を押さないと出せないキー。キー配置を変えてもここが自動で追従する。 */
const SHIFT_ONLY = new Set(
  BUTTON_ROWS.flat()
    .filter((b) => b.shiftAction && !BUTTON_ROWS.flat().some((o) => o.action === b.shiftAction))
    .map((b) => b.shiftAction as string)
);

/** ALT を押さないと出せないキー。 */
const ALT_ONLY = new Set(
  BUTTON_ROWS.flat()
    .filter((b) => b.altAction && !BUTTON_ROWS.flat().some((o) => o.action === b.altAction))
    .map((b) => b.altAction as string)
);

/**
 * 問題の手順に、SHIFT / ALT の1手を差し込む。
 * データ側には書かず、ここで足す（キー配置を変えても問題を直さずに済む）。
 */
export function withLayerKeys(sequence: string[]): string[] {
  const out: string[] = [];
  for (const action of sequence) {
    if (SHIFT_ONLY.has(action)) out.push('toggle-shift');
    else if (ALT_ONLY.has(action)) out.push('toggle-alt');
    out.push(action);
  }
  return out;
}

/**
 * 入力補助。
 * いまの問題を解くのに次へ押すキーを1つだけ光らせる。
 * 押す順を教えるだけで、ほかのキーも押せる（電卓としては素通し）。
 * ただし手順から外れたら、そこで案内を止める。ずれたまま最後まで
 * 案内すると、出てくる答えが違うのに合っているように見えてしまう。
 */
export function useKeyGuide(problem: DrillProblem | null, enabled: boolean) {
  const steps = useMemo(
    () => (problem ? withLayerKeys(problem.keySequence) : []),
    [problem]
  );
  const [index, setIndex] = useState(0);
  const [offTrack, setOffTrack] = useState(false);

  useEffect(() => {
    setIndex(0);
    setOffTrack(false);
  }, [problem?.id, enabled]);

  const nextAction = enabled && !offTrack ? (steps[index] ?? null) : null;

  const observe = useCallback(
    (action: string) => {
      if (!enabled || offTrack) return;
      if (steps[index] === action) {
        setIndex((i) => i + 1);
        return;
      }
      // 表示のしかたを変えるだけのキーは、手順から外れたとみなさない
      if (action.startsWith('digits:') || action === 'cycle-format' || action === 'consts') return;
      setOffTrack(true);
    },
    [enabled, index, offTrack, steps]
  );

  const reset = useCallback(() => {
    setIndex(0);
    setOffTrack(false);
  }, []);

  return {
    nextAction,
    offTrack: enabled && offTrack,
    done: enabled && !offTrack && steps.length > 0 && index >= steps.length,
    step: index,
    total: steps.length,
    observe,
    reset,
  };
}
