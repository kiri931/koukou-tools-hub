import { useId, useState } from 'react';
import { keyStepsFor } from '../lib/keyLabels';
import type { DrillProblem } from '../types';

/**
 * このサイトの電卓の入力方式。コード（parseGuide.ts の closeFunctionArgs、
 * expression.ts の splitTrailingOperand）で確かめた範囲だけを書く。
 *  - sin・log・√ などは数より先に押し、押すと「(」が開く
 *  - x²・x! は数の後に押す
 *  - 式を左から打ち、最後に = を押す
 * 実在の機種名は、確かめていないので書かない。
 */
export const KEY_STEPS_NOTE =
  'このサイトの電卓（式を左から打ち、最後に = を押す方式。sin・log・√ は数の前、x² は数の後に押す）での押す順です。機種によっては異なります。';

interface KeyStepsProps {
  problem: DrillProblem;
  /**
   * 解答用紙の上に置くとき。用紙は明暗にかかわらず白い紙の色なので、
   * サイトの色変数（ダークでは明るい文字）を使うと読めなくなる。
   */
  paper?: boolean;
}

const TONE = {
  site: {
    text: 'text-[var(--color-text)]',
    muted: 'text-[var(--color-text-muted)]',
    chip: 'border-[var(--color-border)] bg-[var(--color-surface)]',
  },
  // 用紙は白（dark でも slate-50）。slate-900 / slate-700 で 4.5:1 以上、枠 slate-500 で 3:1 以上
  paper: {
    text: 'text-slate-900',
    muted: 'text-slate-700',
    chip: 'border-slate-500 bg-white',
  },
} as const;

/**
 * 問題ごとの「打ち方を見る」。答えを見る前に開いてよい。
 * ガイド練習と同じ押す順（problem.keySequence）を、キーの並びで見せる。
 */
export default function KeySteps({ problem, paper = false }: KeyStepsProps) {
  const tone = paper ? TONE.paper : TONE.site;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const steps = keyStepsFor(problem.keySequence);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`inline-flex min-h-11 items-center gap-2 rounded px-1 text-base font-bold underline underline-offset-2 ${tone.text}`}
      >
        {/* 開閉は色ではなく記号と文言で示す */}
        <span aria-hidden="true">{open ? '▼' : '▶'}</span>
        {open ? '打ち方をたたむ' : '打ち方を見る'}
      </button>

      {open && (
        <div id={panelId} className={`mt-1 space-y-2 text-base ${tone.text}`}>
          {problem.angleMode === 'RAD' && (
            <p className="font-bold">最初に DEG キーを押して、角度を RAD にします。</p>
          )}
          <ol aria-label="押す順" className="flex flex-wrap items-center gap-1">
            {steps.map((label, i) => (
              <li
                key={i}
                className={`rounded border px-2 py-0.5 font-mono text-base ${tone.chip}`}
              >
                {label}
              </li>
            ))}
          </ol>
          <p className={`text-base ${tone.muted}`}>{KEY_STEPS_NOTE}</p>
        </div>
      )}
    </div>
  );
}
