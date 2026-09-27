import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnki } from '../hooks/useAnki';
import type { TabId } from '../types';
import DashboardView from './views/DashboardView';
import DataManagementView from './views/DataManagementView';
import HomeView from './views/HomeView';
import SettingsView from './views/SettingsView';
import StudyView from './views/StudyView';

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnkiApp() {
  const [tab, setTab] = useState<TabId>('home');
  const anki = useAnki();

  return (
    // ページの <main> と見出し（h1・説明）は pages/tools/anki.astro が持つ（kj の T4）。
    // ここはツール本体の枠（kj-tool-frame）の中身だけ。
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">問題集 {anki.datasets.length}</Badge>
          <Badge className="bg-[var(--color-success)] text-[var(--color-on-success)]">
            復習まち {anki.dashboard.due.overdue}
          </Badge>
        </div>
      </div>

      {/* /tools/anki/?import=glossary で来たときの結果。
          用語集ページの「覚える君で覚える」ボタンと、先生が配るURLの両方から来る */}
      {anki.deckLink.status !== 'idle' && (
        <div
          role="status"
          className={
            anki.deckLink.status === 'error'
              ? 'mb-6 rounded-lg border border-[var(--color-danger)] bg-[var(--kj-danger-soft)] p-4 text-base text-[var(--color-text)]'
              : 'mb-6 rounded-lg border border-[var(--color-accent)] bg-[var(--kj-accent-soft)] p-4 text-base text-[var(--color-text)]'
          }
        >
          {anki.deckLink.status === 'loading' && <>「{anki.deckLink.label}」を読み込んでいます…</>}
          {anki.deckLink.status === 'done' && (
            <>
              <strong className="font-semibold">「{anki.deckLink.label}」を取り込みました。</strong>
              （{anki.deckLink.cardCount}問）
              <span className="mt-1 block text-base">
                すでに覚えたぶんの記録は消えていません。下の一覧から選んで「学習」に進んでください。
              </span>
            </>
          )}
          {anki.deckLink.status === 'error' && (
            <>
              <strong className="font-semibold">「{anki.deckLink.label}」を読み込めませんでした。</strong>
              <span className="mt-1 block text-base">
                {anki.deckLink.message}／通信できていない可能性があります。時間をおいて開き直してください。
              </span>
            </>
          )}
        </div>
      )}

      <Card className="mb-6 bg-[var(--color-surface)]">
        <CardHeader>
          <CardTitle className="text-xl">使い方</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-base text-[var(--color-text)]">
          <div>
            <ol className="list-decimal space-y-1 pl-5">
              <li>トップでデータセットを選ぶ（または新規作成）</li>
              <li>「学習」タブで問題に対して短答入力し、送信する</li>
              <li>正答例・解説を見て、Unknown / Hard / Good / Easy の4段階で自己採点する</li>
              <li>FSRSアルゴリズムが自己採点結果をもとに次回の復習タイミングを自動調整する</li>
              <li>「ダッシュボード」で期限切れ枚数、本日分、平均保持率、間違えやすいカードのランキングを確認する</li>
              <li>「データ管理」でJSONインポート / バックアップ、カードの追加・編集・削除ができる</li>
            </ol>
          </div>

          <div className="rounded-lg border border-[var(--kj-divider)] bg-[var(--color-background)] p-4">
            <h2 className="mb-2 text-base font-semibold text-[var(--color-text-muted)]">
              この単元とのつながり
            </h2>
            <p>
              情報I・情報IIの用語、ITパスポートや基本情報技術者、全商・全工協検定の一問一答対策、
              プログラミング構文の暗記など、短答形式で繰り返し覚えたい学習全般に使えます。
              FSRS（分散復習アルゴリズム）により、覚えた内容を忘れかけたタイミングで自動的に復習が回ってくるため、
              一夜漬けより記憶が定着しやすい設計です。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-text-muted)]">
              よくある質問
            </h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-[var(--color-text)]">Q. 自分で問題（カード）を追加できますか?</p>
                <p>「データ管理」タブからカードの追加・編集・削除ができます。JSON形式でのインポートにも対応しています。</p>
              </div>
              <div>
                <p className="font-medium text-[var(--color-text)]">Q. データはどこに保存されますか?</p>
                <p>
                  ブラウザのIndexedDBに保存されます。端末やブラウザを変えると引き継がれない点にご注意ください。
                  バックアップ機能で保存内容をエクスポートしておくと安心です。
                </p>
              </div>
              <div>
                <p className="font-medium text-[var(--color-text)]">Q. 目標に合わせて復習頻度を調整できますか?</p>
                <p>「設定」タブで目標保持率や試験日を指定すると、それに応じて復習間隔が調整されます。</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(anki.error || anki.dbError) && (
        <Card className="mb-4 border-[var(--color-danger)]">
          <CardContent className="pt-6 text-base text-[var(--color-danger)]">{anki.error ?? anki.dbError}</CardContent>
        </Card>
      )}

      {!anki.dbReady && (
        <Card>
          <CardHeader>
            <CardTitle>初期化中</CardTitle>
          </CardHeader>
          <CardContent>IndexedDB を初期化しています...</CardContent>
        </Card>
      )}

      {anki.dbReady && (
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)}>
          <TabsList className="grid h-auto grid-cols-2 gap-1 md:grid-cols-5">
            <TabsTrigger value="home">ホーム</TabsTrigger>
            <TabsTrigger value="study">学習</TabsTrigger>
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            <TabsTrigger value="data">データ管理</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <HomeView
              datasets={anki.datasets}
              dueByDataset={anki.dueByDataset}
              selectedDatasetId={anki.selectedDatasetId}
              onSelectDataset={anki.setSelectedDatasetId}
              onStartSession={anki.startSession}
              onMoveToStudy={() => setTab('study')}
              onMoveToData={() => setTab('data')}
            />
          </TabsContent>

          <TabsContent value="study">
            <StudyView
              datasets={anki.datasets}
              selectedDatasetId={anki.selectedDatasetId}
              onSelectDataset={anki.setSelectedDatasetId}
              session={anki.session}
              onStartSession={anki.startSession}
              onSubmitAnswer={anki.submitAnswer}
              onSubmitGrade={anki.submitGrade}
              onRevealHint={anki.revealHint}
              onResetSession={anki.resetSession}
            />
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardView stats={anki.dashboard} />
          </TabsContent>

          <TabsContent value="data">
            <DataManagementView
              datasets={anki.datasets}
              onImportDataset={anki.importDataset}
              onImportBackup={anki.importBackup}
              onExportBackup={async () => {
                const backup = await anki.exportBackup();
                const stamp = new Date().toISOString().replace(/[:.]/g, '-');
                downloadJson(`anki-backup-${stamp}.json`, backup);
              }}
              onDeleteDataset={anki.deleteDataset}
              onGetCards={anki.getCardsForDataset}
              onSaveCard={anki.addOrUpdateCard}
              onDeleteCard={anki.deleteCard}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsView settings={anki.settings} onSave={anki.updateSettings} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
