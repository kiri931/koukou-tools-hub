import { BUTTON_ROWS } from '@/features/scientific-calculator/components/CalcKeypad';
import { Button } from '@/components/ui/button';
import { topMisses, totalMisses, type MissCounts } from '../lib/missLog';

/** action からキーの表示名を引く表。「SHIFT」「°′″」のように、実物のキーの字で出す。 */
const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  BUTTON_ROWS.flat().flatMap((button) => {
    const entries: [string, string][] = [[button.action, button.label]];
    if (button.shiftAction) entries.push([button.shiftAction, button.shiftLabel ?? button.label]);
    return entries;
  })
);

interface WeakKeySummaryProps {
  missCounts: MissCounts;
  weakFirst: boolean;
  onToggleWeakFirst: () => void;
  onReset: () => void;
}

export default function WeakKeySummary({
  missCounts,
  weakFirst,
  onToggleWeakFirst,
  onReset,
}: WeakKeySummaryProps) {
  const total = totalMisses(missCounts);
  if (total === 0) return null;

  const top = topMisses(missCounts, 4);

  return (
    <div className="mt-6 rounded-lg border border-[var(--color-border)] p-3">
      <p className="text-base font-semibold text-[var(--color-text)]">
        つまずいたキー
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {top.map(({ action, count }) => (
          <li
            key={action}
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2 py-1"
          >
            <span className="font-mono text-base font-bold">{ACTION_LABELS[action] ?? action}</span>
            <span className="text-base text-[var(--color-text-muted)]">{count} 回</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={weakFirst ? 'default' : 'outline'}
          onClick={onToggleWeakFirst}
          aria-pressed={weakFirst}
        >
          {weakFirst ? '苦手なキーから出している' : '苦手なキーから出す'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onReset}>
          記録を消す
        </Button>
      </div>
      <p className="mt-2 text-base text-[var(--color-text-muted)]">
        この記録はこの端末の中だけに残ります。先生や外部に送られることはありません。
      </p>
    </div>
  );
}
