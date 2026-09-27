import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTypingGame } from '../hooks/useTypingGame';
import type { Difficulty, Mode, ProgrammingDifficulty, ProgrammingLanguage } from '../types';

const japaneseDiffOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'やさしい' },
  { value: 'normal', label: 'ふつう' },
  { value: 'hard', label: 'むずかしい' },
];

const programmingDiffOptions: { value: ProgrammingDifficulty; label: string }[] = [
  { value: 'beginner', label: '入門' },
  { value: 'intermediate', label: '基礎' },
  { value: 'advanced', label: '実践' },
];

const programmingLanguageOptions: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

const durationOptions = [30, 60, 120];

// 主ボタンは Button の既定（--primary = kj の藍）に任せ、文字だけ本文の大きさにする
const primaryButton = 'text-base';
// shadcn 既定の border-input は白背景に対して 1.26:1 しかなく、
// 「どこが選択肢の丸なのか」が見えない(DADS 非テキスト3:1)
const radioMark = 'border-slate-500 dark:border-slate-400';
const optionLabel =
  'flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 text-base font-medium text-slate-700 transition hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-strong)] dark:border-slate-800 dark:text-slate-200';
const sectionHeading = 'text-base font-semibold tracking-wide text-slate-600 dark:text-slate-400';

// 半角スペースを「打つ場所」として見せるチップ。
// 記号(␣)と枠線の2つの手がかりを持たせ、色だけに情報を乗せない(DADS)。
// お題と入力欄で同じ形を使い、塗りの濃さだけ変える。詳細は docs/typing-japanese/spec.md §3
function SpaceMark({ tone }: { tone: 'question' | 'input' }) {
  const base =
    'mx-[0.1em] inline-flex items-center justify-center rounded border px-[0.15em] align-baseline text-[0.8em] leading-none';
  const toneClass =
    tone === 'question'
      ? 'border-slate-500 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-200'
      : 'border-[var(--color-accent)] bg-[var(--color-surface-strong)] text-[var(--color-accent)]';

  return (
    <span className={`${base} ${toneClass}`}>
      <span aria-hidden="true">␣</span>
      <span className="sr-only">スペース</span>
    </span>
  );
}

// お題の1文字ずつを描き分ける。スペースは両モードでチップ、
// 記号の強調はプログラミングモードのみ(スペースには二重に掛けない)。
function renderQuestionText(text: string, isProgramming: boolean): ReactNode {
  return text.split('').map((char, i) => {
    if (char === ' ') return <SpaceMark key={`sp-${i}`} tone="question" />;
    const isSpecial = isProgramming && /[^a-zA-Z0-9]/.test(char);
    return (
      <span
        key={`${char}-${i}`}
        className={isSpecial ? 'font-bold text-amber-700 dark:text-amber-400' : undefined}
      >
        {char}
      </span>
    );
  });
}

// 打ち終えた文字列。お題と同じ形のチップでスペースを見せる。
function renderUserInput(text: string): ReactNode {
  return text
    .split('')
    .map((char, i) =>
      char === ' ' ? <SpaceMark key={`sp-${i}`} tone="input" /> : <span key={`${char}-${i}`}>{char}</span>
    );
}

export default function TypingGame() {
  const {
    gameState,
    mode,
    handleSetMode,
    difficulty,
    setDifficulty,
    programmingDifficulty,
    setProgrammingDifficulty,
    programmingLanguage,
    setProgrammingLanguage,
    timeLimit,
    setTimeLimit,
    timeLeft,
    elapsedSeconds,
    currentProblem,
    problemNumber,
    problemCount,
    userInput,
    stats,
    accuracy,
    charsPerMinute,
    errorSignal,
    startGame,
    handleKeyInput,
    deleteLastChar,
    skipProblem,
    backToHome,
  } = useTypingGame();
  const isProgramming = mode === 'programming';
  const currentDifficultyOptions = isProgramming ? programmingDiffOptions : japaneseDiffOptions;
  // 入門は全問が言語共通なので、言語を選んでも出題が変わらない。
  const languageSelectable = isProgramming && programmingDifficulty !== 'beginner';

  // 日本語入力(IME)がオンだと keydown の key が 'Process' などになり、
  // これまでは誤入力にすらならず画面が一切動かなかった。検出して知らせる。
  const [imeDetected, setImeDetected] = useState(false);
  // 誤入力を打った直後だけ知らせる。これが無いと「キーが効かない」と受け取られる。
  const [showInputError, setShowInputError] = useState(false);
  const playingPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.isComposing || event.key === 'Process' || event.keyCode === 229) {
        setImeDetected(true);
        return;
      }
      if (event.key === 'Backspace') {
        event.preventDefault();
        deleteLastChar();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        backToHome();
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        setImeDetected(false);
        handleKeyInput(' ');
        return;
      }
      if (event.key.length !== 1) return;
      setImeDetected(false);
      handleKeyInput(event.key);
    };

    const onCompositionStart = () => setImeDetected(true);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('compositionstart', onCompositionStart);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('compositionstart', onCompositionStart);
    };
  }, [backToHome, deleteLastChar, gameState, handleKeyInput]);

  useEffect(() => {
    if (gameState !== 'playing') {
      setImeDetected(false);
      return;
    }
    // スタート直後にフォーカスが body へ抜けていたため、キーボードだけで
    // 操作している人が現在地を見失っていた。プレイ領域へ移す。
    playingPanelRef.current?.focus();
  }, [gameState]);

  useEffect(() => {
    if (errorSignal === 0) return;
    setShowInputError(true);
    const timer = window.setTimeout(() => setShowInputError(false), 700);
    return () => window.clearTimeout(timer);
  }, [errorSignal]);

  return (
    // ページの <main>・h1 と、幅・枠は pages/tools/typing-japanese.astro が持つ（kj の T4）。
    // 以前ここにあった外側の Card は kj-tool-frame と二重の枠になるので外した。
    <div>
      <p className="mb-6 text-base text-[var(--color-text-muted)]">
        {isProgramming
          ? 'プログラミングで使う特殊文字をコードで練習するタイピングゲーム'
          : 'ひらがなのローマ字入力を練習するタイピングゲーム'}
      </p>

      <div>
          {gameState === 'home' && (
            <div className="space-y-8">
              <section className="space-y-3" aria-labelledby="typing-mode-heading">
                <h2 id="typing-mode-heading" className={sectionHeading}>
                  モード
                </h2>
                <Tabs value={mode} onValueChange={(value) => handleSetMode(value as Mode)}>
                  <TabsList className="grid h-auto w-full max-w-sm grid-cols-2">
                    <TabsTrigger value="japanese">日本語</TabsTrigger>
                    <TabsTrigger value="programming">プログラミング</TabsTrigger>
                  </TabsList>
                </Tabs>
              </section>

              <Separator />

              <section className="space-y-3" aria-labelledby="typing-difficulty-heading">
                <h2 id="typing-difficulty-heading" className={sectionHeading}>
                  難易度
                </h2>
                <RadioGroup
                  aria-labelledby="typing-difficulty-heading"
                  value={isProgramming ? programmingDifficulty : difficulty}
                  onValueChange={(value) => {
                    if (isProgramming) {
                      setProgrammingDifficulty(value as ProgrammingDifficulty);
                      return;
                    }
                    setDifficulty(value as Difficulty);
                  }}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {currentDifficultyOptions.map((option) => (
                    <label key={option.value} htmlFor={`difficulty-${option.value}`} className={optionLabel}>
                      {/* label と紐づけても Radix の role="radio" には名前が付かないため
                          aria-label を直接渡す。支援技術で選択肢を区別できなくなる。 */}
                      <RadioGroupItem
                        id={`difficulty-${option.value}`}
                        value={option.value}
                        aria-label={option.label}
                        className={radioMark}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </section>

              <Separator />

              {isProgramming && (
                <>
                  <section className="space-y-3" aria-labelledby="typing-language-heading">
                    <h2 id="typing-language-heading" className={sectionHeading}>
                      言語
                    </h2>
                    {languageSelectable ? (
                      <RadioGroup
                        aria-labelledby="typing-language-heading"
                        value={programmingLanguage}
                        onValueChange={(value) => setProgrammingLanguage(value as ProgrammingLanguage)}
                        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
                      >
                        {programmingLanguageOptions.map((option) => (
                          <label key={option.value} htmlFor={`language-${option.value}`} className={optionLabel}>
                            <RadioGroupItem
                              id={`language-${option.value}`}
                              value={option.value}
                              aria-label={option.label}
                              className={radioMark}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    ) : (
                      <p className="rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-700 dark:border-slate-800 dark:text-slate-200">
                        入門はどの言語でも共通の書き方だけを出題するため、言語は選べません。
                        言語ごとの問題は「基礎」「実践」で選べます。
                      </p>
                    )}
                  </section>

                  <Separator />
                </>
              )}

              <section className="space-y-4" aria-labelledby="typing-duration-heading">
                <div className="flex items-center justify-between">
                  <h2 id="typing-duration-heading" className={sectionHeading}>
                    時間
                  </h2>
                  <Badge variant="secondary" className="font-mono text-base">
                    {timeLimit}秒
                  </Badge>
                </div>
                <Slider
                  min={30}
                  max={120}
                  step={30}
                  value={[timeLimit]}
                  onValueChange={([value]) => setTimeLimit(value)}
                  thumbLabel="制限時間（秒）"
                  className="max-w-xl"
                />
                <div className="flex gap-2">
                  {durationOptions.map((seconds) => (
                    <Button
                      key={seconds}
                      variant={timeLimit === seconds ? 'default' : 'outline'}
                      size="sm"
                      aria-pressed={timeLimit === seconds}
                      className={timeLimit === seconds ? primaryButton : ''}
                      onClick={() => setTimeLimit(seconds)}
                    >
                      {seconds}秒
                    </Button>
                  ))}
                </div>
              </section>

              <Button onClick={startGame} className={primaryButton}>
                スタート
              </Button>
            </div>
          )}

          {gameState === 'playing' && currentProblem && (
            <div
              ref={playingPanelRef}
              tabIndex={-1}
              aria-label="タイピング中。キーボードで入力してください。Backspace で1文字消す、Esc でやめる。"
              className="space-y-6 outline-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="border-[var(--color-accent)] text-base text-[var(--color-accent)]"
                  >
                    入力中
                  </Badge>
                  <span className="text-base text-slate-600 dark:text-slate-400">
                    {problemNumber} / {problemCount} 問目
                  </span>
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-[var(--color-accent)]">
                  残り {timeLeft}秒
                </div>
              </div>

              {imeDetected && (
                <div
                  role="alert"
                  className="rounded-lg border-2 border-[var(--color-warning)] bg-[var(--kj-notice-bg)] px-4 py-3 text-base font-medium text-[var(--color-text)]"
                >
                  日本語入力（IME）がオンになっています。半角英数に切り替えてください。
                  <span className="mt-1 block text-sm font-normal">
                    Windows は「半角/全角」キー、Mac は「英数」キーで切り替えられます。
                  </span>
                </div>
              )}

              <Card className="border-slate-300 dark:border-slate-800">
                <CardHeader>
                  <CardDescription>{isProgramming ? 'タイプしてください' : 'お題（かな）'}</CardDescription>
                  {/* お題が切り替わったことを読み上げで伝える */}
                  <CardTitle
                    role="status"
                    aria-live="polite"
                    className="text-4xl font-mono leading-relaxed break-all"
                  >
                    {renderQuestionText(currentProblem.question, isProgramming)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    className={`rounded-lg border bg-slate-50 px-4 py-3 font-mono text-xl leading-relaxed break-all dark:bg-slate-950/50 ${
                      showInputError
                        ? 'border-2 border-[var(--color-danger)]'
                        : 'border-slate-500 dark:border-slate-600'
                    }`}
                  >
                    <span>{renderUserInput(userInput)}</span>
                    <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-[var(--color-accent)] align-middle" />
                  </div>

                  {/* 色だけでなく文字でも知らせる。高さを常に確保して画面が揺れないようにする */}
                  <p
                    role="status"
                    aria-live="polite"
                    className={`min-h-6 text-base font-medium ${
                      showInputError ? 'text-[var(--color-danger)]' : 'text-transparent'
                    }`}
                  >
                    {showInputError ? '✗ その文字はここには入りません。お題を見て打ち直してください。' : '　'}
                  </p>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={skipProblem}>
                  この問題をとばす
                </Button>
                <Button variant="outline" onClick={backToHome}>
                  やめる（Esc）
                </Button>
              </div>
            </div>
          )}

          {gameState === 'result' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">結果</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-800">
                  <p className="text-base text-slate-600 dark:text-slate-400">完了問題数</p>
                  <p className="font-mono text-2xl font-bold">{stats.completedProblems}</p>
                </div>
                <div className="rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-800">
                  <p className="text-base text-slate-600 dark:text-slate-400">正解文字数</p>
                  <p className="font-mono text-2xl font-bold">{stats.correctChars}</p>
                </div>
                <div className="rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-800">
                  <p className="text-base text-slate-600 dark:text-slate-400">誤入力数</p>
                  <p className="font-mono text-2xl font-bold">{stats.wrongChars}</p>
                </div>
                <div className="rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-800">
                  <p className="text-base text-slate-600 dark:text-slate-400">正解率</p>
                  <p className="font-mono text-2xl font-bold">{accuracy.toFixed(1)}%</p>
                </div>
                <div className="rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-800">
                  <p className="text-base text-slate-600 dark:text-slate-400">分速（1分あたりの文字数）</p>
                  <p className="font-mono text-2xl font-bold">{Math.round(charsPerMinute)}</p>
                </div>
                <div className="rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-800">
                  <p className="text-base text-slate-600 dark:text-slate-400">かかった時間</p>
                  <p className="font-mono text-2xl font-bold">{elapsedSeconds}秒</p>
                </div>
              </div>

              <p className="text-base text-slate-700 dark:text-slate-300">
                スコアは保存されません。記録を残す場合は、この画面を控えてください。
              </p>

              <Button onClick={backToHome} className={primaryButton}>
                ホームに戻る
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
