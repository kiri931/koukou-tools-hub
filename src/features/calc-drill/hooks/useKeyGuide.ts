import { useCallback, useEffect, useMemo, useState } from 'react';
import { BUTTON_ROWS } from '@/features/scientific-calculator/components/CalcKeypad';
import type { DrillProblem } from '../types';

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
export function useKeyGuide(
  problem: DrillProblem | null,
  enabled: boolean,
  /** いまの式の長さ。BS で消したぶんを見て、案内を戻すのに使う。 */
  expressionLength = 0
) {
  const steps = useMemo(
    () => (problem ? withLayerKeys(problem.keySequence) : []),
    [problem]
  );
  const [index, setIndex] = useState(0);
  const [offTrack, setOffTrack] = useState(false);
  /** 手順から外れた時点の式の長さ。ここまで消せば案内に戻れる。 */
  const [markLength, setMarkLength] = useState(0);
  /** 余計な入力が実際に式へ入ったか。押した直後はまだ式が伸びていないので、
   *  これを見ないと「外れた瞬間に戻った」ことになってしまう。 */
  const [sawExtra, setSawExtra] = useState(false);

  useEffect(() => {
    setIndex(0);
    setOffTrack(false);
    setMarkLength(0);
    setSawExtra(false);
  }, [problem?.id, enabled]);

  // BS で余計に打ったぶんを消し切ったら、案内を自動で戻す。
  // 「AC して最初から」しか道が無いと、1打まちがえただけで
  // それまでの入力を全部捨てることになる。
  useEffect(() => {
    if (!offTrack) return;
    if (expressionLength > markLength) {
      if (!sawExtra) setSawExtra(true);
      return;
    }
    if (sawExtra) {
      setOffTrack(false);
      setSawExtra(false);
    }
  }, [offTrack, expressionLength, markLength, sawExtra]);

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
      // 消す方向のキーで外れることはない（消せば戻れる）
      if (action === 'del' || action === 'del-forward' || action === 'ac') return;
      setOffTrack(true);
      setMarkLength(expressionLength);
      setSawExtra(false);
    },
    [enabled, expressionLength, index, offTrack, steps]
  );

  const reset = useCallback(() => {
    setIndex(0);
    setOffTrack(false);
    setMarkLength(0);
    setSawExtra(false);
  }, []);

  return {
    nextAction,
    offTrack: enabled && offTrack,
    /** 案内に戻るまでに、あと何文字消せばよいか */
    extraLength: offTrack ? Math.max(0, expressionLength - markLength) : 0,
    done: enabled && !offTrack && steps.length > 0 && index >= steps.length,
    step: index,
    total: steps.length,
    observe,
    reset,
  };
}
