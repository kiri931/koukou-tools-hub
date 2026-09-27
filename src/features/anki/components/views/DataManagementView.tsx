import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Card as AnkiCard, DatasetSummary } from '../../types';

type EditingCard = (Partial<AnkiCard> & { isNew: boolean }) | null;

type Props = {
  datasets: DatasetSummary[];
  onImportDataset: (text: string) => Promise<void>;
  onImportBackup: (text: string) => Promise<void>;
  onExportBackup: () => Promise<void>;
  onDeleteDataset: (datasetId: string) => Promise<void>;
  onGetCards: (datasetId: string) => Promise<AnkiCard[]>;
  onSaveCard: (datasetId: string, card: AnkiCard) => Promise<void>;
  onDeleteCard: (datasetId: string, cardId: string) => Promise<void>;
};

function emptyNewCard(): EditingCard {
  return {
    isNew: true,
    id: `card-${Date.now()}`,
    question: '',
    answers: [],
    topic: '',
    explanation: '',
    tags: [],
  };
}

export default function DataManagementView(props: Props) {
  const {
    datasets,
    onImportDataset,
    onImportBackup,
    onExportBackup,
    onDeleteDataset,
    onGetCards,
    onSaveCard,
    onDeleteCard,
  } = props;
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expandedDatasetId, setExpandedDatasetId] = useState<string | null>(null);
  const [datasetCards, setDatasetCards] = useState<AnkiCard[]>([]);
  const [editingCard, setEditingCard] = useState<EditingCard>(null);
  const [answersText, setAnswersText] = useState('');
  const [tagsText, setTagsText] = useState('');

  useEffect(() => {
    if (expandedDatasetId && !datasets.some((dataset) => dataset.datasetId === expandedDatasetId)) {
      setExpandedDatasetId(null);
      setDatasetCards([]);
      setEditingCard(null);
    }
  }, [datasets, expandedDatasetId]);

  const expandedDataset = useMemo(
    () => datasets.find((dataset) => dataset.datasetId === expandedDatasetId) ?? null,
    [datasets, expandedDatasetId],
  );

  const readFile = async (file: File | null) => {
    if (!file) return null;
    return file.text();
  };

  const importPresetDataset = async (presetPath: string, presetLabel: string, busyKey: string) => {
    setError(null);
    setMessage(null);
    try {
      setBusy(busyKey);
      const response = await fetch(presetPath);
      if (!response.ok) {
        throw new Error('プリセットデータセットを読み込めませんでした');
      }
      await onImportDataset(await response.text());
      setMessage(`「${presetLabel}」をインポートしました。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プリセットデータセットのインポートに失敗しました');
    } finally {
      setBusy(null);
    }
  };

  const loadCards = async (datasetId: string) => {
    const cards = await onGetCards(datasetId);
    setDatasetCards(cards);
  };

  const startEdit = (card: AnkiCard) => {
    setEditingCard({ ...card, isNew: false });
    setAnswersText(card.answers.join(', '));
    setTagsText((card.tags ?? []).join(', '));
  };

  const startAdd = () => {
    const next = emptyNewCard();
    setEditingCard(next);
    setAnswersText('');
    setTagsText('');
  };

  const resetEditor = () => {
    setEditingCard(null);
    setAnswersText('');
    setTagsText('');
  };

  const saveEditingCard = async () => {
    if (!expandedDatasetId || !editingCard) return;
    const question = (editingCard.question ?? '').trim();
    const answers = answersText.split(',').map((s) => s.trim()).filter(Boolean);
    const tags = tagsText.split(',').map((s) => s.trim()).filter(Boolean);

    if (!question) {
      setError('質問は必須です');
      return;
    }
    if (answers.length === 0) {
      setError('正答は1つ以上必要です');
      return;
    }

    const nowIso = new Date().toISOString();
    const payload: AnkiCard = {
      id: (editingCard.id ?? `card-${Date.now()}`).trim(),
      question,
      answers,
      topic: (editingCard.topic ?? '').trim(),
      explanation: (editingCard.explanation ?? '').trim(),
      tags,
      createdAt: editingCard.createdAt ?? nowIso,
      updatedAt: nowIso,
    };

    if (!payload.id) {
      setError('カードIDの生成に失敗しました');
      return;
    }

    setError(null);
    setMessage(null);
    try {
      setBusy('save-card');
      await onSaveCard(expandedDatasetId, payload);
      await loadCards(expandedDatasetId);
      setMessage(editingCard.isNew ? 'カードを追加しました。' : 'カードを更新しました。');
      resetEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'カード保存に失敗しました');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>データ管理</CardTitle>
          <CardDescription>データセットJSONのインポート、バックアップのエクスポート/インポートを行います。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-base font-medium" htmlFor="dataset-import">データセットJSONをインポート</label>
            <input
              id="dataset-import"
              type="file"
              accept="application/json,.json"
              className="block w-full text-base"
              onChange={async (event) => {
                setError(null);
                setMessage(null);
                try {
                  const text = await readFile(event.target.files?.[0] ?? null);
                  if (!text) return;
                  setBusy('dataset-import');
                  await onImportDataset(text);
                  setMessage('データセットをインポートしました。');
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'インポートに失敗しました');
                } finally {
                  setBusy(null);
                  event.currentTarget.value = '';
                }
              }}
            />
            <p className="text-sm text-[var(--color-text-muted)]">
              <a
                href="/tools/anki/sample-dataset.json"
                download
                className="text-[var(--color-accent)] underline underline-offset-2"
              >
                サンプルのデータセット（JSON）
              </a>
              をダウンロードしてインポートすると、動作確認できます。
            </p>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-[var(--color-background)] p-3">
              <p className="text-base text-[var(--color-text-muted)]">プリセット: 情報I頻出用語（141件）</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy === 'preset-import:joho1-vocab'}
                onClick={() => importPresetDataset('/tools/joho1-vocab.json', '情報I頻出用語', 'preset-import:joho1-vocab')}
              >
                インポート
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-[var(--color-background)] p-3">
              <p className="text-base text-[var(--color-text-muted)]">プリセット: ITパスポート頻出用語（103件）</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy === 'preset-import:it-passport'}
                onClick={() => importPresetDataset('/tools/it-passport.json', 'ITパスポート頻出用語', 'preset-import:it-passport')}
              >
                インポート
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-[var(--color-background)] p-3">
              <p className="text-base text-[var(--color-text-muted)]">プリセット: 基本情報技術者試験 頻出用語（100件）</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy === 'preset-import:fe-vocab'}
                onClick={() => importPresetDataset('/tools/fe-vocab.json', '基本情報技術者試験 頻出用語', 'preset-import:fe-vocab')}
              >
                インポート
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-[var(--color-background)] p-3">
              <p className="text-base text-[var(--color-text-muted)]">プリセット: 情報セキュリティマネジメント試験 頻出用語（89件）</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy === 'preset-import:sg-vocab'}
                onClick={() => importPresetDataset('/tools/sg-vocab.json', '情報セキュリティマネジメント試験 頻出用語', 'preset-import:sg-vocab')}
              >
                インポート
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-[var(--color-background)] p-3">
              <p className="text-base text-[var(--color-text-muted)]">プリセット: 計算技術検定 頻出用語・公式（50件）</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy === 'preset-import:calc-drill-vocab'}
                onClick={() => importPresetDataset('/tools/calc-drill-vocab.json', '計算技術検定 頻出用語・公式', 'preset-import:calc-drill-vocab')}
              >
                インポート
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-4">
              <p className="font-medium">バックアップをエクスポート</p>
              <p className="text-base text-[var(--color-text-muted)]">全データ（学習履歴・設定含む）をJSONで保存します。</p>
              <Button
                variant="outline"
                disabled={busy === 'backup-export'}
                onClick={async () => {
                  setError(null);
                  setMessage(null);
                  try {
                    setBusy('backup-export');
                    await onExportBackup();
                    setMessage('バックアップをエクスポートしました。');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'エクスポートに失敗しました');
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                バックアップ出力
              </Button>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <p className="font-medium">バックアップをインポート</p>
              <p className="text-base text-[var(--color-text-muted)]">既存DBを置き換えて復元します。</p>
              <input
                type="file"
                accept="application/json,.json"
                className="block w-full text-base"
                onChange={async (event) => {
                  setError(null);
                  setMessage(null);
                  try {
                    const text = await readFile(event.target.files?.[0] ?? null);
                    if (!text) return;
                    setBusy('backup-import');
                    await onImportBackup(text);
                    setMessage('バックアップをインポートしました。');
                    if (expandedDatasetId) {
                      await loadCards(expandedDatasetId);
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'バックアップ復元に失敗しました');
                  } finally {
                    setBusy(null);
                    event.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>

          {message && <p className="text-base text-[var(--color-success)]">{message}</p>}
          {error && <p className="text-base text-[var(--color-danger)]">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>データセット一覧</CardTitle>
          <CardDescription>カード管理・データセット削除を行えます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {datasets.length === 0 && <p className="text-base text-[var(--color-text-muted)]">データセットはありません。</p>}
          {datasets.map((dataset) => {
            const isExpanded = expandedDatasetId === dataset.datasetId;
            return (
              <div key={dataset.datasetId} className="rounded-lg border p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{dataset.title}</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline">{dataset.cardCount} cards</Badge>
                      <Badge variant="outline">{dataset.datasetId}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setError(null);
                        setMessage(null);
                        try {
                          if (isExpanded) {
                            setExpandedDatasetId(null);
                            setDatasetCards([]);
                            resetEditor();
                            return;
                          }
                          setBusy(`manage:${dataset.datasetId}`);
                          setExpandedDatasetId(dataset.datasetId);
                          resetEditor();
                          await loadCards(dataset.datasetId);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'カード一覧の取得に失敗しました');
                          setExpandedDatasetId(null);
                        } finally {
                          setBusy(null);
                        }
                      }}
                      disabled={busy === `manage:${dataset.datasetId}`}
                    >
                      {isExpanded ? '閉じる' : 'カードを管理'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--kj-danger-soft)]"
                      onClick={async () => {
                        if (!window.confirm(`「${dataset.title}」を削除しますか？`)) return;
                        setError(null);
                        setMessage(null);
                        try {
                          setBusy(`delete:${dataset.datasetId}`);
                          await onDeleteDataset(dataset.datasetId);
                          setMessage('データセットを削除しました。');
                          if (isExpanded) {
                            setExpandedDatasetId(null);
                            setDatasetCards([]);
                            resetEditor();
                          }
                        } catch (err) {
                          setError(err instanceof Error ? err.message : '削除に失敗しました');
                        } finally {
                          setBusy(null);
                        }
                      }}
                      disabled={busy === `delete:${dataset.datasetId}`}
                    >
                      削除
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-medium">カード一覧 ({datasetCards.length})</p>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => void loadCards(dataset.datasetId)}>
                          再読み込み
                        </Button>
                        <Button onClick={startAdd}>
                          + カードを追加
                        </Button>
                      </div>
                    </div>

                    {datasetCards.length === 0 ? (
                      <p className="text-base text-[var(--color-text-muted)]">カードはありません。</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-base">
                          <thead>
                            <tr className="border-b bg-[var(--color-background)] text-left">
                              <th className="px-3 py-2">質問</th>
                              <th className="px-3 py-2">正答例</th>
                              <th className="px-3 py-2">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {datasetCards.map((card) => (
                              <tr key={card.id} className="border-b last:border-b-0 align-top">
                                <td className="px-3 py-2 whitespace-pre-wrap">{card.question}</td>
                                <td className="px-3 py-2">{card.answers[0] ?? '-'}</td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" onClick={() => startEdit(card)}>編集</Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--kj-danger-soft)]"
                                      onClick={async () => {
                                        if (!window.confirm('このカードを削除しますか？')) return;
                                        setError(null);
                                        setMessage(null);
                                        try {
                                          setBusy(`delete-card:${card.id}`);
                                          await onDeleteCard(dataset.datasetId, card.id);
                                          await loadCards(dataset.datasetId);
                                          if (editingCard && editingCard.id === card.id) {
                                            resetEditor();
                                          }
                                          setMessage('カードを削除しました。');
                                        } catch (err) {
                                          setError(err instanceof Error ? err.message : 'カード削除に失敗しました');
                                        } finally {
                                          setBusy(null);
                                        }
                                      }}
                                      disabled={busy === `delete-card:${card.id}`}
                                    >
                                      削除
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {editingCard && expandedDataset && (
                      <div className="space-y-4 rounded-lg border bg-[var(--color-background)] p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{editingCard.isNew ? 'カードを追加' : 'カードを編集'}</p>
                          <Badge variant="outline">{expandedDataset.title}</Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="card-question">質問（必須）</Label>
                            <textarea
                              id="card-question"
                              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                              value={editingCard.question ?? ''}
                              onChange={(event) => setEditingCard((prev) => (prev ? { ...prev, question: event.target.value } : prev))}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="card-answers">正答（必須 / カンマ区切り）</Label>
                            <Input id="card-answers" value={answersText} onChange={(event) => setAnswersText(event.target.value)} />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="card-topic">トピック</Label>
                            <Input
                              id="card-topic"
                              value={editingCard.topic ?? ''}
                              onChange={(event) => setEditingCard((prev) => (prev ? { ...prev, topic: event.target.value } : prev))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="card-tags">タグ（カンマ区切り）</Label>
                            <Input id="card-tags" value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="card-explanation">解説</Label>
                            <textarea
                              id="card-explanation"
                              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                              value={editingCard.explanation ?? ''}
                              onChange={(event) => setEditingCard((prev) => (prev ? { ...prev, explanation: event.target.value } : prev))}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button onClick={saveEditingCard} disabled={busy === 'save-card'}>
                            保存
                          </Button>
                          <Button variant="outline" onClick={resetEditor}>キャンセル</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
