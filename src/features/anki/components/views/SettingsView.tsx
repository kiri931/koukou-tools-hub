import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { AppSettings } from '../../types';
import { DEFAULT_NEW_CARDS_PER_DAY, MAX_NEW_CARDS_PER_DAY, parseNewCardsPerDayInput } from '../../lib/newCardLimit';

type Props = {
  settings: AppSettings;
  onSave: (next: Partial<AppSettings>) => Promise<unknown>;
};

export default function SettingsView({ settings, onSave }: Props) {
  const [targetRetentionRate, setTargetRetentionRate] = useState(settings.targetRetentionRate);
  const [examDate, setExamDate] = useState(settings.examDate ?? '');
  // 入力中は文字のまま持つ（空欄や打ちかけを数に直すと、消した瞬間に 0 や 20 に戻ってしまう）
  const [newCardsText, setNewCardsText] = useState(String(settings.newCardsPerDay));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTargetRetentionRate(settings.targetRetentionRate);
    setExamDate(settings.examDate ?? '');
    setNewCardsText(String(settings.newCardsPerDay));
  }, [settings]);

  const save = async () => {
    setMessage(null);
    setError(null);
    const parsed = parseNewCardsPerDayInput(newCardsText);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setSaving(true);
    try {
      await onSave({
        targetRetentionRate,
        examDate: examDate || null,
        newCardsPerDay: parsed.value,
      });
      setNewCardsText(String(parsed.value));
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
          <Label htmlFor="anki-new-cards">1日に出す新しいカード</Label>
          <div className="flex items-center gap-2">
            <input
              id="anki-new-cards"
              // type="number" にしない。数でない文字を打つと value が空になり、
              // 「空欄＝既定の20」と区別できず、黙って20で保存されてしまう
              type="text"
              inputMode="numeric"
              maxLength={String(MAX_NEW_CARDS_PER_DAY).length + 1}
              className="h-11 w-28 rounded-md border border-input bg-background px-3 py-2 text-base"
              value={newCardsText}
              onChange={(event) => setNewCardsText(event.target.value)}
              aria-describedby="anki-new-cards-help"
            />
            <span className="text-base">枚（問題集ごと）</span>
          </div>
          <p id="anki-new-cards-help" className="text-base text-[var(--color-text-muted)]">
            まだ一度も答えていないカードを、1日にこの枚数まで出します。
            試験の用語集のように数千枚ある問題集でも、毎日少しずつ進められます。
            一度答えたカードの復習は、この枚数に関係なく全部出ます。
            0にすると復習だけになります。空欄で保存すると既定の{DEFAULT_NEW_CARDS_PER_DAY}枚に戻ります。
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
