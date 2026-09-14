import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { DEFAULT_THEME, KEYPAD_THEMES, type KeypadTheme } from '../keypad-themes';
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
  /** 配色 */
  theme?: KeypadTheme;
  /** 過去の式と答えを出すか。問題モードでは場所をキーに譲るため出さない。 */
  showLines?: boolean;
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
  theme = DEFAULT_THEME,
  showLines = true,
}: CalcDisplayProps) {
  const palette = KEYPAD_THEMES[theme];
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
      className={`rounded-2xl border shadow-inner ${palette.border} ${palette.display} ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* ステータス行。実物の電卓と同じく、いまのモードを常に出す。 */}
      <div className={`mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold tracking-wide ${palette.displayText.status}`}>
        <span className="rounded bg-white/15 px-2 py-0.5">{formatLabel}</span>
        <span className="rounded bg-white/15 px-2 py-0.5">{base}</span>
        <span className="rounded bg-white/15 px-2 py-0.5">[{angleMode}]</span>
        {shiftActive && (
          <span className="rounded bg-violet-500 px-2 py-0.5 text-white">SHIFT</span>
        )}
        {altActive && <span className="rounded bg-amber-300 px-2 py-0.5 text-slate-950">ALT</span>}
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
          <span className="rounded bg-amber-300 px-2 py-0.5 text-slate-950">() {parenBalance}</span>
        )}
      </div>

      {/* 過去の式と答え。実物と同じく上へ流れていく。 */}
      {showLines && lines.length > 0 && (
        <div
          ref={scrollRef}
          className={`mb-2 overflow-y-auto break-all border-b border-white/20 pb-2 text-left font-mono text-sm ${palette.displayText.lines} ${compact ? 'max-h-16' : 'max-h-28'}`}
        >
          {lines.map((line, index) => (
            <div
              key={`${index}-${line.text}`}
              className={line.isResult ? `font-semibold ${palette.displayText.result}` : palette.displayText.lines}
            >
              {line.text}
            </div>
          ))}
        </div>
      )}

      <div
        className={`break-all text-right font-mono text-base ${palette.displayText.status} ${compact ? 'min-h-8' : 'min-h-10'}`}
      >
        {ghostExpression ? (
          <>
            <span className={palette.displayText.status}>{expression}</span>
            <span className="opacity-50">{ghostExpression.slice(expression.length)}</span>
          </>
        ) : beforeCursor || afterCursor ? (
          <span className="inline-flex items-center">
            <span>{beforeCursor}</span>
            {/* カーソル。色ではなく「縦棒」という形で位置を示す */}
            <span
              aria-hidden="true"
              className={`mx-px inline-block h-5 w-0.5 animate-pulse align-middle ${palette.displayText.cursor}`}
            />
            <span>{afterCursor}</span>
          </span>
        ) : (
          '0'
        )}
      </div>

      <div className="flex items-start gap-2">
        <div
          className={`flex-1 break-all text-right font-mono font-bold ${compact ? 'min-h-10 text-2xl' : 'min-h-12 text-2xl sm:text-3xl'} ${hasError ? palette.displayText.error : palette.displayText.result}`}
        >
          {result}
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={hasError}
          className={`mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-white/50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 ${palette.displayText.lines}`}
          aria-label={copied ? 'コピー済み' : '結果をコピー'}
          title={copied ? 'コピー済み' : 'コピー'}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
