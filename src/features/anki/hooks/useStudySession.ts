import { useState } from 'react';
import { fsrsScheduleNext } from './useFsrs';
import { resolveQuestion } from '../lib/questionMode';
import { maskQuestion } from '../lib/maskQuestion';
import { hasMoreHints } from '../lib/hints';
import { capGrade } from '../lib/gradeCap';
import { isNewCard, type NewCardBudget } from '../lib/newCardLimit';
import type { AnswerCheckResult, AppSettings, Card, CardState, Grade, Review, StudySessionState } from '../types';

type StudyDeps = {
  buildDueQueue: (datasetId: string) => Promise<StudySessionState['queue']>;
  getCardsByDataset: (datasetId: string) => Promise<Card[]>;
  checkAnswer: (card: Card, inputText: string) => AnswerCheckResult;
  detectConfusion: (params: { datasetId: string; cardId: string; inputText: string }) => Promise<void>;
  upsertCardState: (state: CardState) => Promise<void>;
  appendReview: (review: Review) => Promise<void>;
  /** 新しいカードの今日の枠（上限・今日出したぶん・残り）。画面に「残り N 枚」を出すのに使う */
  getNewCardBudget?: (datasetId: string) => Promise<NewCardBudget>;
};

const initialState: StudySessionState = {
  status: 'idle',
  datasetId: null,
  queue: [],
  choicePool: [],
  index: 0,
  total: 0,
  correctCount: 0,
  incorrectCount: 0,
  current: null,
  mode: 'input',
  choices: [],
  maskedQuestion: '',
  hintLevel: 0,
  usedHint: false,
  userAnswer: '',
  isCorrect: null,
  matchedAnswer: null,
  responseMs: null,
  submittedAt: null,
  error: null,
  newBudget: null,
};

/**
 * 次の問題を組み立てる。
 *
 * 出題モード・選択肢・伏せ字の問題文はここで一度だけ決める。
 * 描画のたびに作り直すと、選択肢の並びが押すたびに変わってしまう。
 */
function toQuestionState(base: StudySessionState, index: number): StudySessionState {
  const current = base.queue[index] ?? null;
  if (!current) {
    return {
      ...base,
      status: 'done',
      index,
      current: null,
      mode: 'input',
      choices: [],
      maskedQuestion: '',
      hintLevel: 0,
      usedHint: false,
      userAnswer: '',
      isCorrect: null,
      matchedAnswer: null,
      responseMs: null,
      submittedAt: null,
      error: null,
    };
  }

  // 誤答の候補は期限が来たカードだけでなくデータセット全体から拾う。
  // 期限切れが数枚しかない日に、その数枚だけで4択を作ろうとすると選択肢が痩せる
  const question = resolveQuestion(current, base.choicePool.length > 0 ? base.choicePool : base.queue);

  return {
    ...base,
    status: 'question',
    index,
    current,
    mode: question.mode,
    choices: question.choices,
    maskedQuestion: maskQuestion(current.card.question, current.card.answers).text,
    hintLevel: 0,
    usedHint: false,
    userAnswer: '',
    isCorrect: null,
    matchedAnswer: null,
    responseMs: null,
    submittedAt: Date.now(),
    error: null,
  };
}

export function useStudySession(deps: StudyDeps, settings: AppSettings, onPersisted?: () => void | Promise<void>) {
  const [session, setSession] = useState<StudySessionState>(initialState);

  const startSession = async (datasetId: string) => {
    setSession({
      ...initialState,
      status: 'loading',
      datasetId,
      error: null,
    });

    try {
      const queue = await deps.buildDueQueue(datasetId);
      // 残り枚数が取れなくても学習は続けられる。表示が出ないだけにする
      const newBudget = deps.getNewCardBudget
        ? await deps.getNewCardBudget(datasetId).catch(() => null)
        : null;
      // 選択肢を作るための候補。取れなくても学習は続けられるので、失敗は握りつぶす
      const choicePool = await deps
        .getCardsByDataset(datasetId)
        .then((cards) => cards.map((card) => ({ card, cardState: null })))
        .catch(() => [] as StudySessionState['queue']);
      if (queue.length === 0) {
        setSession({
          ...initialState,
          status: 'done',
          datasetId,
          queue,
          total: 0,
          error: null,
          newBudget,
        });
        return;
      }

      // 1問目も2問目以降と同じ組み立て方を通す。
      // ここだけ手で組むと、1問目にだけ選択肢や伏せ字が入らない
      setSession(
        toQuestionState(
          {
            ...initialState,
            datasetId,
            queue,
            choicePool,
            total: queue.length,
            newBudget,
          },
          0
        )
      );
    } catch (err) {
      setSession((prev) => ({
        ...prev,
        status: 'idle',
        error: err instanceof Error ? err.message : 'セッション開始に失敗しました',
      }));
    }
  };

  const submitAnswer = async (text: string) => {
    if (session.status !== 'question' || !session.current || !session.datasetId) return;

    const result = deps.checkAnswer(session.current.card, text);
    if (!result.isCorrect) {
      try {
        await deps.detectConfusion({
          datasetId: session.datasetId,
          cardId: session.current.card.id,
          inputText: text,
        });
      } catch {
        // keep study flow even if confusion logging fails
      }
    }

    setSession((prev) => ({
      ...prev,
      status: 'reviewing',
      userAnswer: text,
      isCorrect: result.isCorrect,
      matchedAnswer: result.matchedAnswer,
      responseMs: prev.submittedAt ? Math.max(0, Date.now() - prev.submittedAt) : 0,
      error: null,
    }));
  };

  /**
   * ヒントを1段階開く。
   *
   * 選択モードでは開かない。4択のうえヒントまで出すと答えが確定する。
   */
  const revealHint = () => {
    setSession((prev) => {
      if (prev.status !== 'question' || !prev.current || prev.mode === 'choice') return prev;
      if (!hasMoreHints(prev.current.card, prev.hintLevel)) return prev;
      return { ...prev, hintLevel: prev.hintLevel + 1, usedHint: true };
    });
  };

  const submitGrade = async (rawGrade: Grade) => {
    if (session.status !== 'reviewing' || !session.current || !session.datasetId) return;

    // ボタンを出さないだけでは数字キーの 4 がそのまま通ってしまうので、ここでも丸める
    const grade = capGrade(rawGrade, {
      mode: session.mode,
      usedHint: session.usedHint,
      isCorrect: session.isCorrect,
    });

    const now = Date.now();
    const nextState = fsrsScheduleNext({
      now,
      cardState: session.current.cardState,
      grade,
      baseTargetR: settings.targetRetentionRate,
      examDateIso: settings.examDate,
    });

    nextState.cardId = session.current.card.id;
    nextState.datasetId = session.datasetId;

    try {
      await deps.upsertCardState(nextState);
      await deps.appendReview({
        cardId: session.current.card.id,
        datasetId: session.datasetId,
        grade,
        responseMs: session.responseMs ?? 0,
        reviewedAt: now,
      });

      if (onPersisted) {
        await onPersisted();
      }

      setSession((prev) => {
        const updatedQueue = [...prev.queue];
        if (updatedQueue[prev.index]) {
          updatedQueue[prev.index] = {
            ...updatedQueue[prev.index],
            cardState: nextState,
          };
        }
        // 新しいカードを答えたら、今日の残りを1枚減らす（保存は reviews に残った記録で数え直せる）
        const wasNew = isNewCard(prev.queue[prev.index]?.cardState);
        const newBudget =
          wasNew && prev.newBudget
            ? {
                ...prev.newBudget,
                introducedToday: prev.newBudget.introducedToday + 1,
                remaining: Math.max(0, prev.newBudget.remaining - 1),
                unseen: Math.max(0, prev.newBudget.unseen - 1),
              }
            : prev.newBudget;
        return toQuestionState({
          ...prev,
          newBudget,
          queue: updatedQueue,
          correctCount: prev.correctCount + (prev.isCorrect ? 1 : 0),
          incorrectCount: prev.incorrectCount + (prev.isCorrect ? 0 : 1),
        }, prev.index + 1);
      });
    } catch (err) {
      setSession((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : '採点保存に失敗しました',
      }));
    }
  };

  const resetSession = () => {
    setSession(initialState);
  };

  return {
    session,
    startSession,
    submitAnswer,
    submitGrade,
    revealHint,
    resetSession,
  };
}
