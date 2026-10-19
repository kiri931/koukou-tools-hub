import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Dataset } from '../../types';
import {
  EXAMS,
  FIELD_OPTIONS,
  PRIORITIES,
  buildExamDataset,
  countSelection,
  countTotal,
  selectionTitle,
  type ExamKey,
  type ExamSelection,
  type Priority,
} from '../../lib/examGlossary';

type Props = {
  onSyncDataset: (dataset: Dataset) => Promise<void>;
};

const INDENT: Record<string, string> = { all: '', kei: '', dai: '　', chu: '　　' };

// 本体は大きい（基本情報で約1.7MB）ので、取り込むときに初めて読む。2回目からは手元のものを使う
const sourceCache = new Map<ExamKey, Dataset>();

async function loadSource(exam: ExamKey): Promise<Dataset> {
  const cached = sourceCache.get(exam);
  if (cached) return cached;
  const path = EXAMS.find((e) => e.key === exam)!.path;
  const res = await fetch(path);
  if (!res.ok) throw new Error('用語集を読み込めませんでした。通信状態を確かめて、もう一度押してください。');
  const data = (await res.json()) as Dataset;
  sourceCache.set(exam, data);
  return data;
}

export default function ExamGlossaryPicker({ onSyncDataset }: Props) {
  const [selection, setSelection] = useState<ExamSelection>({
    exam: 'it-passport',
    field: 'all',
    priorities: ['A'],
    excludeUnsure: false,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = countTotal(selection);
  const update = (next: Partial<ExamSelection>) => {
    setSelection((prev) => ({ ...prev, ...next }));
    setMessage(null);
    setError(null);
  };

  const togglePriority = (key: Priority, checked: boolean) => {
    const set = new Set(selection.priorities);
    if (checked) set.add(key);
    else set.delete(key);
    update({ priorities: PRIORITIES.map((p) => p.key).filter((k) => set.has(k)) });
  };

  const run = async () => {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const source = await loadSource(selection.exam);
      const dataset = buildExamDataset(source, selection);
      await onSyncDataset(dataset);
      setMessage(`「${dataset.title}」を${dataset.cards.length}枚取り込みました。ホームで選ぶと学習を始められます。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '取り込みに失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-1">
        <p className="text-lg font-bold">試験の用語集（ITパスポート・基本情報）</p>
        <p className="text-base text-[var(--color-text-muted)]">
          IPAのシラバスと公開問題から集めた用語です。分野と優先度を選んで、必要な分だけ取り込めます。
          同じ選び方で取り込み直しても、復習の進み具合は消えません。
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-base font-medium">試験</legend>
        <div className="flex flex-wrap gap-2">
          {EXAMS.map((exam) => {
            const id = `exam-glossary-exam-${exam.key}`;
            return (
              <label
                key={exam.key}
                htmlFor={id}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 text-base has-[:checked]:border-[var(--color-accent)] has-[:checked]:font-bold dark:border-slate-700"
              >
                <input
                  id={id}
                  type="radio"
                  name="exam-glossary-exam"
                  className="size-5"
                  checked={selection.exam === exam.key}
                  onChange={() => update({ exam: exam.key })}
                />
                {exam.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="exam-glossary-field" className="block text-base font-medium">
          分野
        </label>
        <select
          id="exam-glossary-field"
          className="min-h-11 w-full rounded-md border border-slate-500 bg-[var(--color-background)] px-3 text-base dark:border-slate-400"
          value={selection.field}
          onChange={(event) => update({ field: event.target.value })}
        >
          {FIELD_OPTIONS.map((field) => {
            const n = PRIORITIES.reduce((sum, p) => sum + countSelection({ ...selection, field: field.slug }, p.key), 0);
            return (
              <option key={field.slug} value={field.slug}>
                {INDENT[field.level]}
                {field.label}（{n}枚）
              </option>
            );
          })}
        </select>
        <p className="text-base text-[var(--color-text-muted)]">系 → 大分類 → 中分類の順に字下げしてあります。</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-base font-medium">優先度（複数選べます）</legend>
        <div className="grid gap-2">
          {PRIORITIES.map((p) => {
            const id = `exam-glossary-priority-${p.key}`;
            return (
              <label
                key={p.key}
                htmlFor={id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-slate-300 px-3 py-2 text-base dark:border-slate-700"
              >
                <input
                  id={id}
                  type="checkbox"
                  className="size-5 shrink-0"
                  checked={selection.priorities.includes(p.key)}
                  onChange={(event) => togglePriority(p.key, event.target.checked)}
                />
                <span>
                  <span className="font-bold">{p.label}</span>：{p.detail}（{countSelection(selection, p.key)}枚）
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label
        htmlFor="exam-glossary-unsure"
        className="flex min-h-11 cursor-pointer items-center gap-3 text-base"
      >
        <input
          id="exam-glossary-unsure"
          type="checkbox"
          className="size-5 shrink-0"
          checked={selection.excludeUnsure}
          onChange={(event) => update({ excludeUnsure: event.target.checked })}
        />
        「要確認」のカードを除く（説明文を作った側が、定義に自信がないとしたもの）
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className="min-h-11 text-base"
          disabled={busy || total === 0}
          aria-describedby="exam-glossary-summary"
          onClick={() => void run()}
        >
          {busy ? '取り込み中…' : `${total}枚を取り込む`}
        </Button>
        <p id="exam-glossary-summary" className="text-base text-[var(--color-text-muted)]">
          {selection.priorities.length === 0
            ? '優先度を1つ以上選んでください。'
            : `データセット名: ${selectionTitle(selection)}`}
        </p>
      </div>

      <div aria-live="polite" className="text-base">
        {message && <p>{message}</p>}
        {error && <p className="font-bold text-red-700 dark:text-red-300">{error}</p>}
      </div>
    </div>
  );
}
