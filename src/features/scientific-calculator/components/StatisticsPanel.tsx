import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useStatistics } from '../hooks/useStatistics';

interface StatisticsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatStat(value: number) {
  if (!Number.isFinite(value)) return '-';
  return String(Math.round(value * 1e10) / 1e10);
}

export default function StatisticsPanel({ open, onOpenChange }: StatisticsPanelProps) {
  const [bulkDraft, setBulkDraft] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { draft, setDraft, values, stats, addValue, addMany, removeValueAt, clearValues } = useStatistics();

  const handleCopy = async (key: 'mean' | 'stddev') => {
    const value = key === 'mean' ? stats.mean : stats.stddev;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1200);
    } catch {
      setCopiedKey(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[92vw] max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>統計処理</SheetTitle>
          <SheetDescription>値を入力して n・平均・母標準偏差 (σ) を計算します。</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 pb-6">
          <div className="space-y-2">
            <label className="text-base font-medium">値を追加</label>
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                inputMode="decimal"
                placeholder="例: 42.5"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addValue();
                  }
                }}
              />
              <Button type="button" onClick={() => addValue()}>
                追加
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-base font-medium">一括追加（改行/カンマ区切り）</label>
            <textarea
              value={bulkDraft}
              onChange={(e) => setBulkDraft(e.target.value)}
              rows={4}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-base outline-none focus-visible:ring-[3px]"
              placeholder={'10, 20, 30\n40'}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const count = addMany(bulkDraft);
                  if (count > 0) setBulkDraft('');
                }}
              >
                取り込み
              </Button>
              <Button type="button" variant="ghost" onClick={() => setBulkDraft('')}>
                消去
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-base">
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-sm">n</p>
              <p className="font-mono text-lg font-semibold">{stats.n}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-sm">平均</p>
              <p className="font-mono text-lg font-semibold">{formatStat(stats.mean)}</p>
              <Button type="button" size="xs" variant="ghost" onClick={() => handleCopy('mean')}>
                {copiedKey === 'mean' ? 'コピー済み' : 'コピー'}
              </Button>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-sm">σ</p>
              <p className="font-mono text-lg font-semibold">{formatStat(stats.stddev)}</p>
              <Button type="button" size="xs" variant="ghost" onClick={() => handleCopy('stddev')}>
                {copiedKey === 'stddev' ? 'コピー済み' : 'コピー'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium">値リスト</p>
              <Button type="button" size="xs" variant="ghost" onClick={clearValues}>
                全クリア
              </Button>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
              {values.length === 0 ? (
                <p className="text-muted-foreground px-2 py-3 text-base">まだ値がありません。</p>
              ) : (
                values.map((value, index) => (
                  <div key={`${value}-${index}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="font-mono text-base">{formatStat(value)}</span>
                    <Button type="button" size="xs" variant="ghost" onClick={() => removeValueAt(index)}>
                      削除
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
