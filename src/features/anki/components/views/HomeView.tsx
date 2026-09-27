import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DatasetSummary } from '../../types';
import FsrsExplainer from '../FsrsExplainer';

type Props = {
  datasets: DatasetSummary[];
  dueByDataset: Record<string, number>;
  selectedDatasetId: string | null;
  onSelectDataset: (datasetId: string) => void;
  onStartSession: (datasetId: string) => Promise<void> | void;
  onMoveToStudy: () => void;
  onMoveToData: () => void;
};

/** 1問あたりおよそ20秒として、かかる時間の見当を出す */
function estimateMinutes(count: number): number {
  return Math.max(1, Math.round((count * 20) / 60));
}

export default function HomeView(props: Props) {
  const { datasets, dueByDataset, selectedDatasetId, onSelectDataset, onStartSession, onMoveToStudy, onMoveToData } =
    props;

  // はじめて開いた人が最初に見る画面。
  // **最初の一手を1つに絞る。**「データセットJSONをインポート」と言われても、
  // 何を用意すればよいのか分からない。用語集68語がそのまま入るので、それを既定にする。
  // （画面くらべ 20260801-anki-start / 2026-08-01 採用）
  if (datasets.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>まだ問題が入っていません</CardTitle>
            <CardDescription>
              情報I用語集の68語をそのまま入れて、今日から始められます。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild className="min-h-11">
              <a href="/tools/anki/?import=glossary">情報I用語集（68語）で始める</a>
            </Button>
            <Button variant="outline" className="min-h-11" onClick={onMoveToData}>
              自分で作った問題を入れる
            </Button>
          </CardContent>
        </Card>
        <FsrsExplainer />
      </div>
    );
  }

  const totalDue = datasets.reduce((sum, dataset) => sum + (dueByDataset[dataset.datasetId] ?? 0), 0);
  // 「選択中」が無いときは、期限切れがいちばん多い問題集から始める
  const suggestedId =
    selectedDatasetId ??
    datasets.reduce(
      (best, dataset) =>
        (dueByDataset[dataset.datasetId] ?? 0) > (dueByDataset[best.datasetId] ?? 0) ? dataset : best,
      datasets[0]!,
    ).datasetId;

  return (
    <div className="space-y-4">
      {/* 続けている人が最初に見たいのは「今日ぶんが何問で、どれくらいかかるか」。
          問題集を選ぶところから始めさせない */}
      <Card>
        <CardHeader>
          <CardTitle>今日やること</CardTitle>
          <CardDescription>
            {totalDue > 0
              ? `復習するのは ${totalDue}問（およそ${estimateMinutes(totalDue)}分）です。`
              : '今日ぶんの復習は終わっています。新しく覚えるぶんを進められます。'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="min-h-11"
            onClick={async () => {
              onSelectDataset(suggestedId);
              await onStartSession(suggestedId);
              onMoveToStudy();
            }}
          >
            はじめる
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>問題集を選んで始める</CardTitle>
          <CardDescription>別の問題集をやりたいときはこちらから。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {datasets.map((dataset) => {
            const isSelected = selectedDatasetId === dataset.datasetId;
            return (
              <Button
                key={dataset.datasetId}
                variant={isSelected ? 'default' : 'outline'}
                                onClick={() => onSelectDataset(dataset.datasetId)}
              >
                {dataset.title}
              </Button>
            );
          })}
          {selectedDatasetId && (
            <Button
              onClick={async () => {
                await onStartSession(selectedDatasetId);
                onMoveToStudy();
              }}
             
            >
              学習開始
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {datasets.map((dataset) => (
          <Card key={dataset.datasetId} className={selectedDatasetId === dataset.datasetId ? 'border-2 border-[var(--color-accent)]' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{dataset.title}</CardTitle>
                  <CardDescription>{dataset.description || '説明なし'}</CardDescription>
                </div>
                {/* 英語のままだと、生徒には「due」も「cards」も意味が伝わらない */}
                <Badge variant="secondary">今日 {dueByDataset[dataset.datasetId] ?? 0}問</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">全{dataset.cardCount}問</Badge>
                {(dataset.tags ?? []).slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline">#{tag}</Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onSelectDataset(dataset.datasetId)}>選択</Button>
                <Button
                  onClick={async () => {
                    onSelectDataset(dataset.datasetId);
                    await onStartSession(dataset.datasetId);
                    onMoveToStudy();
                  }}
                 
                >
                  学習開始
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <FsrsExplainer />
    </div>
  );
}
