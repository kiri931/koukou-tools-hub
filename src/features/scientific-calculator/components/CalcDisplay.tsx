import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { AngleMode, DisplayLine, NumberBase } from '../types';

interface CalcDisplayProps {
  /** カーソルより前の式（表示用に整形済み） */
  beforeCursor: string;
  /** カーソルより後ろの式（表示用に整形済み） */
  afterCursor: string;
  ghostExpression?: string;
  /** ゴースト表示のときに使う、カーソルを分けない式 */
  expression: string;
  result: string;
  angleMode: AngleMode;
  shiftActive: boolean;
  altActive: boolean;
  memory: number;
  parenBalance: number;
  hasError: boolean;
  /** Norm / Fix2 / Sci3 のような表示形式のラベル */
  formatLabel: string;
  base: NumberBase;
  engShift: number;
  dmsView: boolean;
  /** 過去の式と答え */
  lines: DisplayLine[];
  /** 全画面のとき。高さを詰めて、キーに場所を譲る。 */
  compact?: boolean;
}

export default function CalcDisplay({
  beforeCursor,
  afterCursor,
  ghostExpression,
  expression,
  result,
  angleMode,
  shiftActive,
  altActive,
  memory,
  parenBalance,
  hasError,
  formatLabel,
  base,
  engShift,
  dmsView,
  lines,
  compact = false,
}: CalcDisplayProps) {
  const [copied, setCopied] = useState(false);
  const normalizedMemory = Object.is(memory, -0) ? 0 : memory;
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新しい行が増えたら、いちばん下（いま打っている式）まで送る
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  const handleCopy = async () => {
    if (hasError) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-zinc-300 bg-zinc-900 text-zinc-100 shadow-inner dark:border-zinc-700 ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* ステータス行。実物の電卓と同じく、いまのモードを常に出す。 */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold tracking-wide text-zinc-200">
        <span className="rounded bg-zinc-700 px-2 py-0.5">{formatLabel}</span>
        <span className="rounded bg-zinc-700 px-2 py-0.5">{base}</span>
        <span className="rounded bg-zinc-700 px-2 py-0.5">[{angleMode}]</span>
        {shiftActive && (
          <span className="rounded bg-violet-500 px-2 py-0.5 text-white">SHIFT</span>
        )}
        {altActive && <span className="rounded bg-amber-500 px-2 py-0.5 text-zinc-950">ALT</span>}
        {normalizedMemory !== 0 && (
          <span className="rounded bg-emerald-600 px-2 py-0.5 text-white">
            M {normalizedMemory.toFixed(4).replace(/\.0+$/, '')}
          </span>
        )}
        {engShift !== 0 && (
          <span className="rounded bg-sky-600 px-2 py-0.5 text-white">
            ENG {engShift > 0 ? `+${engShift}` : engShift}
          </span>
        )}
        {dmsView && <span className="rounded bg-sky-600 px-2 py-0.5 text-white">度分秒</span>}
        {parenBalance > 0 && (
          <span className="rounded bg-amber-500/80 px-2 py-0.5 text-zinc-950">() {parenBalance}</span>
        )}
      </div>

      {/* 過去の式と答え。実物と同じく上へ流れていく。 */}
      {lines.length > 0 && (
        <div
          ref={scrollRef}
          className={`mb-2 overflow-y-auto break-all border-b border-zinc-700 pb-2 text-left font-mono text-sm text-zinc-400 ${compact ? 'max-h-16' : 'max-h-28'}`}
        >
          {lines.map((line, index) => (
            <div
              key={`${index}-${line.text}`}
              className={line.isResult ? 'font-semibold text-zinc-200' : 'text-zinc-400'}
            >
              {line.text}
            </div>
          ))}
        </div>
      )}

      <div
        className={`break-all text-right font-mono text-base text-zinc-200 ${compact ? 'min-h-8' : 'min-h-10'}`}
      >
        {ghostExpression ? (
          <>
            <span className="text-zinc-200">{expression}</span>
            <span className="text-zinc-600">{ghostExpression.slice(expression.length)}</span>
          </>
        ) : beforeCursor || afterCursor ? (
          <span className="inline-flex items-center">
            <span>{beforeCursor}</span>
            {/* カーソル。色ではなく「縦棒」という形で位置を示す */}
            <span
              aria-hidden="true"
              className="mx-px inline-block h-5 w-0.5 animate-pulse bg-emerald-300 align-middle"
            />
            <span>{afterCursor}</span>
          </span>
        ) : (
          '0'
        )}
      </div>

      <div className="flex items-start gap-2">
        <div
          className={`flex-1 break-all text-right font-mono font-bold ${compact ? 'min-h-10 text-2xl' : 'min-h-12 text-2xl sm:text-3xl'} ${hasError ? 'text-rose-300' : 'text-emerald-300'}`}
        >
          {result}
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={hasError}
          className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-600/80 text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={copied ? 'コピー済み' : '結果をコピー'}
          title={copied ? 'コピー済み' : 'コピー'}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
