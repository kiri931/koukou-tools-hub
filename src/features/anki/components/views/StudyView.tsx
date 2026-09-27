import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildHints, hasMoreHints } from '../../lib/hints';
import { gradeCapReason, maxGrade } from '../../lib/gradeCap';
import type { DatasetSummary, Grade, StudySessionState } from '../../types';

type Props = {
  datasets: DatasetSummary[];
  selectedDatasetId: string | null;
  onSelectDataset: (datasetId: string) => void;
  session: StudySessionState;
  onStartSession: (datasetId: string) => Promise<void> | void;
  onSubmitAnswer: (text: string) => Promise<void> | void;
  onSubmitGrade: (grade: Grade) => Promise<void> | void;
  onRevealHint: () => void;
  onResetSession: () => void;
};

const gradeButtons: Array<{ grade: Grade; label: string; keyHint: string; className: string }> = [
  { grade: 2, label: 'Hard', keyHint: '2', className: 'bg-[var(--color-warning)] text-[var(--color-on-warning)] hover:opacity-90' },
  { grade: 3, label: 'Good', keyHint: '3', className: 'bg-[var(--color-success)] text-[var(--color-on-success)] hover:opacity-90' },
  { grade: 4, label: 'Easy', keyHint: '4', className: 'bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:opacity-90' },
];

function ProgressBar({ session }: { session: StudySessionState }) {
  const percent = session.total > 0 ? (session.index / session.total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
        <span>進捗</span>
        <span className="font-mono">{session.index} / {session.total}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-surface-strong)]">
        <div
          className="h-full rounded-full bg-[var(--color-success)] transition-all"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return <kbd className="rounded border px-1.5 py-0.5 font-mono text-sm">{children}</kbd>;
}

export default function StudyView(props: Props) {
  const {
    datasets,
    selectedDatasetId,
    onSelectDataset,
    session,
    onStartSession,
    onSubmitAnswer,
    onSubmitGrade,
    onRevealHint,
    onResetSession,
  } = props;
  const [answerText, setAnswerText] = useState('');

  const hints = session.current ? buildHints(session.current.card, session.hintLevel) : [];
  const hintLeft = session.current ? hasMoreHints(session.current.card, session.hintLevel) : false;
  const capContext = { mode: session.mode, usedHint: session.usedHint, isCorrect: session.isCorrect };
  const allowedGrade = maxGrade(capContext);
  const capReason = gradeCapReason(capContext);
  const availableGrades = gradeButtons.filter((item) => item.grade <= allowedGrade);
  // 正解したのに押せるボタンが1つしか無いとき、それは採点ではなく「次へ進む」操作。
  // 選ぶ余地が無いのに「Hard」と書いてあると、自己評価を求められているように読める
  const isJustNext = Boolean(session.isCorrect) && availableGrades.length === 1;

  const currentDataset = datasets.find((d) => d.datasetId === (session.datasetId ?? selectedDatasetId));
  const accuracy = useMemo(() => {
    const total = session.correctCount + session.incorrectCount;
    if (total === 0) return null;
    return (session.correctCount / total) * 100;
  }, [session.correctCount, session.incorrectCount]);

  // 選択モードは数字キーでも答えられる。クリック/タップだけでも完結するので、
  // これはあくまで補助。入力欄にフォーカスがあるときは邪魔しない
  useEffect(() => {
    if (session.status !== 'question' || session.mode !== 'choice') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= session.choices.length) return;
      event.preventDefault();
      void onSubmitAnswer(session.choices[index]);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session.status, session.mode, session.choices, onSubmitAnswer]);

  useEffect(() => {
    if (session.status !== 'reviewing') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '1') {
        if (!session.isCorrect) {
          event.preventDefault();
          void onSubmitGrade(1);
        }
        return;
      }
      if (event.key === '2' || event.key === '3' || event.key === '4') {
        event.preventDefault();
        void onSubmitGrade(Number(event.key) as Grade);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session.status, session.isCorrect, onSubmitGrade]);

  const handleSubmit = async () => {
    const text = answerText;
    await onSubmitAnswer(text);
    setAnswerText('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>学習</CardTitle>
          <CardDescription>短答入力してから自己採点し、FSRSで次回出題間隔を更新します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {datasets.map((dataset) => (
              <Button
                key={dataset.datasetId}
                variant={(session.datasetId ?? selectedDatasetId) === dataset.datasetId ? 'default' : 'outline'}
                onClick={() => onSelectDataset(dataset.datasetId)}
                disabled={session.status === 'loading'}
              >
                {dataset.title}
              </Button>
            ))}
            {selectedDatasetId && session.status !== 'question' && session.status !== 'reviewing' && (
              <Button onClick={() => onStartSession(selectedDatasetId)}>
                セッション開始
              </Button>
            )}
            {session.status !== 'idle' && (
              <Button variant="outline" onClick={onResetSession}>リセット</Button>
            )}
          </div>
          {session.error && <p className="text-base text-[var(--color-danger)]">{session.error}</p>}
        </CardContent>
      </Card>

      {session.status === 'idle' && (
        <Card>
          <CardContent className="pt-6 text-base text-[var(--color-text-muted)]">
            {datasets.length === 0 ? 'データセットがありません。データ管理タブで JSON をインポートしてください。' : 'データセットを選択して「セッション開始」を押してください。'}
          </CardContent>
        </Card>
      )}

      {session.status === 'loading' && (
        <Card>
          <CardContent className="pt-6">読み込み中...</CardContent>
        </Card>
      )}

      {session.status === 'question' && session.current && (
        <Card>
          <CardHeader className="space-y-3">
            <ProgressBar session={session} />
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{currentDataset?.title ?? '学習中'}</CardTitle>
                <CardDescription>
                  {session.index + 1} / {session.total}
                </CardDescription>
              </div>
              <Badge variant="outline">{session.mode === 'choice' ? '選んで答える' : '書いて答える'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 出題中はカテゴリを出さない。ヒントの1段階目がカテゴリなので、
                常時出しているとヒントを押す意味が無くなる（採点画面では出す） */}
            <div className="rounded-lg border p-4">
              <p className="whitespace-pre-wrap text-lg leading-relaxed">{session.maskedQuestion}</p>
            </div>

            {session.mode === 'choice' ? (
              <div className="space-y-2">
                <p className="text-base text-[var(--color-text-muted)]">
                  初めての問題です。あてはまるものを選んでください。
                </p>
                <ul className="space-y-2">
                  {session.choices.map((choice, index) => (
                    <li key={choice}>
                      <Button
                        variant="outline"
                        className="h-auto w-full justify-start whitespace-normal py-3 text-left text-base"
                        onClick={() => onSubmitAnswer(choice)}
                      >
                        <span className="mr-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border font-mono text-base">
                          {index + 1}
                        </span>
                        <span>{choice}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                {hints.length > 0 && (
                  <div className="space-y-1 rounded-lg border bg-[var(--color-background)] p-4" aria-live="polite">
                    {hints.map((hint) => (
                      <p key={hint.label} className="text-base">
                        <span className="text-[var(--color-text-muted)]">{hint.label}: </span>
                        <span className="font-medium">{hint.value}</span>
                      </p>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="anki-answer">回答</Label>
                  <Input
                    id="anki-answer"
                    value={answerText}
                    onChange={(event) => setAnswerText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleSubmit();
                      }
                    }}
                    placeholder="短答を入力"
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSubmit} disabled={!answerText.trim()}>
                    送信
                  </Button>
                  {hintLeft && (
                    <Button variant="outline" onClick={onRevealHint}>
                      ヒントを見る（{hints.length + 1}つ目）
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {session.status === 'reviewing' && session.current && (
        <Card>
          <CardHeader className="space-y-3">
            <ProgressBar session={session} />
            <div className="flex items-center justify-between gap-3">
              <CardTitle>採点</CardTitle>
              <Badge className={session.isCorrect ? 'bg-[var(--color-success)] text-[var(--color-on-success)]' : 'bg-[var(--color-danger)] text-[var(--color-on-danger)]'}>
                {session.isCorrect ? '正解' : '不正解'}
              </Badge>
            </div>
            <CardDescription>
              {isJustNext ? '数字キー 2 でも次に進めます。' : '数字キー 1/2/3/4 でも採点できます。'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="mb-1 text-base text-[var(--color-text-muted)]">問題</p>
                {/* 答え合わせの場では伏せない。元の問題文を出す */}
                <p className="whitespace-pre-wrap">{session.current.card.question}</p>
                {session.current.card.topic && (
                  <p className="mt-2 text-base text-[var(--color-text-muted)]">カテゴリ: {session.current.card.topic}</p>
                )}
              </div>
              <div className="rounded-lg border p-4">
                <p className="mb-1 text-base text-[var(--color-text-muted)]">
                  {session.mode === 'choice' ? 'あなたが選んだもの' : 'あなたの回答'}
                </p>
                <p className="whitespace-pre-wrap">{session.userAnswer || '（未入力）'}</p>
                <p className="mt-2 text-base text-[var(--color-text-muted)]">正答例: {session.current.card.answers.join(' / ')}</p>
                {session.matchedAnswer && <p className="mt-1 text-base text-[var(--color-success)]">一致: {session.matchedAnswer}</p>}
              </div>
            </div>
            {session.current.card.explanation && (
              <div className="rounded-lg border bg-[var(--color-background)] p-4 text-base">
                <p className="mb-1 font-medium">解説</p>
                <p className="whitespace-pre-wrap">{session.current.card.explanation}</p>
              </div>
            )}
            {capReason && <p className="text-base text-[var(--color-text-muted)]">{capReason}</p>}
            <div className="flex flex-wrap gap-2">
              {!session.isCorrect && (
                <Button variant="outline" onClick={() => onSubmitGrade(1)}>
                  <span className="inline-flex items-center gap-2"><Kbd>1</Kbd> Unknown</span>
                </Button>
              )}
              {/* 選んで当てただけ・ヒントを見て書けただけのカードを Easy にすると
                  次回が数週間先になってしまうので、押せる上限を下げる */}
              {availableGrades.map((item) => (
                <Button key={item.grade} className={item.className} onClick={() => onSubmitGrade(item.grade)}>
                  <span className="inline-flex items-center gap-2">
                    <Kbd>{item.keyHint}</Kbd> {isJustNext ? '次へ' : item.label}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {session.status === 'done' && (
        <Card>
          <CardHeader>
            <CardTitle>セッション完了</CardTitle>
            <CardDescription>{currentDataset?.title ?? '選択中データセット'} の期限切れカードを処理しました。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-base text-[var(--color-text-muted)]">今回の対象件数: {session.total} 件</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-sm text-[var(--color-text-muted)]">正解</p>
                <p className="font-mono text-xl font-bold text-[var(--color-success)]">{session.correctCount}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-[var(--color-text-muted)]">不正解</p>
                <p className="font-mono text-xl font-bold text-[var(--color-danger)]">{session.incorrectCount}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-[var(--color-text-muted)]">正答率</p>
                <p className="font-mono text-xl font-bold">{accuracy == null ? '-' : `${accuracy.toFixed(1)}%`}</p>
              </div>
            </div>
            {selectedDatasetId && (
              <Button onClick={() => onStartSession(selectedDatasetId)}>
                もう一度開始
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
