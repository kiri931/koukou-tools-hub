import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { AppSettings } from '../../types';

type Props = {
  settings: AppSettings;
  onSave: (next: Partial<AppSettings>) => Promise<unknown>;
};

export default function SettingsView({ settings, onSave }: Props) {
  const [targetRetentionRate, setTargetRetentionRate] = useState(settings.targetRetentionRate);
  const [examDate, setExamDate] = useState(settings.examDate ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTargetRetentionRate(settings.targetRetentionRate);
    setExamDate(settings.examDate ?? '');
  }, [settings]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await onSave({
        targetRetentionRate,
        examDate: examDate || null,
      });
      setMessage('設定を保存しました。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>設定</CardTitle>
        <CardDescription>どれくらい忘れかけたら復習するかを決めます。まずは既定のままで構いません。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>目標保持率</Label>
            <span className="font-mono text-base">{(targetRetentionRate * 100).toFixed(0)}%</span>
          </div>
          <Slider
            min={0.7}
            max={0.97}
            step={0.01}
            value={[targetRetentionRate]}
            onValueChange={([value]) => setTargetRetentionRate(value)}
          />
          <p className="text-sm text-[var(--color-text-muted)]">
            「思い出せる見込みがこの値まで下がったら、もう一度出す」という目安です。
            高くすると忘れにくくなりますが、1日にこなす枚数が増えます。既定は90%。
          </p>
        </section>

        <section className="space-y-2">
          <Label htmlFor="anki-exam-date">試験日</Label>
          <input
            id="anki-exam-date"
            type="date"
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-base"
            value={examDate}
            onChange={(event) => setExamDate(event.target.value)}
          />
          <p className="text-sm text-[var(--color-text-muted)]">
            入れておくと、復習の間隔がこの日を飛び越えないように調整されます。
            「試験前に一度も出ないまま本番」を防ぐためのものです。
          </p>
        </section>

        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={saving}>
            保存
          </Button>
          {message && <p className="text-base text-[var(--color-success)]">{message}</p>}
          {error && <p className="text-base text-[var(--color-danger)]">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
