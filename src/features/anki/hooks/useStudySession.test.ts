// セッションを最初から最後まで通して動かすテスト。
// 選択→記述の切り替え、ヒント、採点の上限が、実際の並び順で崩れないか見る。

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStudySession } from './useStudySession';
import { DEFAULT_SETTINGS } from '../types';
import type { AnswerCheckResult, Card, CardState, Grade, Review, StudyQueueItem } from '../types';
import glossary from '../lib/__fixtures__/glossary.json';
import { isNewLimitReached, makeBudget, type NewCardBudget } from '../lib/newCardLimit';

const cards = glossary.cards as Card[];

function normalize(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase();
}

/** 本物と同じ判定（useDB.checkAnswer の写し） */
function checkAnswer(card: Card, inputText: string): AnswerCheckResult {
  const normalizedInput = normalize(inputText);
  const matchedAnswer = card.answers.find((answer) => normalize(answer) === normalizedInput) ?? null;
  return { isCorrect: Boolean(matchedAnswer), matchedAnswer, normalizedInput };
}

function makeDeps(queue: StudyQueueItem[], pool: Card[] = cards) {
  const saved: CardState[] = [];
  const reviews: Review[] = [];
  return {
    saved,
    reviews,
    deps: {
      buildDueQueue: vi.fn(async () => queue),
      getCardsByDataset: vi.fn(async () => pool),
      checkAnswer,
      detectConfusion: vi.fn(async () => {}),
      upsertCardState: vi.fn(async (state: CardState) => {
        saved.push(state);
      }),
      appendReview: vi.fn(async (review: Review) => {
        reviews.push(review);
      }),
    },
  };
}

function state(reps: number): CardState {
  return {
    cardId: '',
    datasetId: 'koukou-jouhou-glossary',
    stability: 3,
    difficulty: 5,
    lastReviewAt: Date.now() - 1000,
    dueAt: Date.now() - 1000,
    reps,
    lapses: 0,
  };
}

function newQueue(count: number): StudyQueueItem[] {
  return cards.slice(0, count).map((card) => ({ card, cardState: null }));
}

async function start(queue: StudyQueueItem[]) {
  const { deps, saved, reviews } = makeDeps(queue);
  const hook = renderHook(() => useStudySession(deps, DEFAULT_SETTINGS));
  await act(async () => {
    await hook.result.current.startSession('koukou-jouhou-glossary');
  });
  return { hook, deps, saved, reviews };
}

describe('セッションの通し', () => {
  it('初めてのカードは4択で出る', async () => {
    const { hook } = await start(newQueue(5));
    expect(hook.result.current.session.status).toBe('question');
    expect(hook.result.current.session.mode).toBe('choice');
    expect(hook.result.current.session.choices).toHaveLength(4);
  });

  it('1問目にも選択肢と伏せ字が入る', async () => {
    const pdca = cards.find((c) => c.answers.includes('PDCAサイクル'))!;
    const { hook } = await start([{ card: pdca, cardState: null }]);
    expect(hook.result.current.session.choices.length).toBeGreaterThan(1);
    expect(hook.result.current.session.maskedQuestion).not.toContain('PDCAサイクル');
    expect(hook.result.current.session.maskedQuestion).toContain('〇〇〇');
  });

  it('解いたことのあるカードは記述で出る', async () => {
    const { hook } = await start([{ card: cards[0], cardState: { ...state(2), cardId: cards[0].id } }]);
    expect(hook.result.current.session.mode).toBe('input');
    expect(hook.result.current.session.choices).toEqual([]);
  });

  it('選択肢を押すと採点に進み、正解が判定される', async () => {
    const { hook } = await start(newQueue(5));
    const correct = hook.result.current.session.current!.card.answers[0];
    await act(async () => {
      await hook.result.current.submitAnswer(correct);
    });
    expect(hook.result.current.session.status).toBe('reviewing');
    expect(hook.result.current.session.isCorrect).toBe(true);
  });

  it('選択で正解したときは Easy を押しても Good で記録される', async () => {
    const { hook, reviews } = await start(newQueue(5));
    const correct = hook.result.current.session.current!.card.answers[0];
    await act(async () => {
      await hook.result.current.submitAnswer(correct);
    });
    await act(async () => {
      await hook.result.current.submitGrade(4);
    });
    expect(reviews).toHaveLength(1);
    expect(reviews[0].grade).toBe(3);
  });

  it('選択モードではヒントが開かない', async () => {
    const { hook } = await start(newQueue(5));
    act(() => {
      hook.result.current.revealHint();
    });
    expect(hook.result.current.session.hintLevel).toBe(0);
    expect(hook.result.current.session.usedHint).toBe(false);
  });

  it('記述モードではヒントが3段階まで開き、それ以上は増えない', async () => {
    const { hook } = await start([{ card: cards[0], cardState: { ...state(2), cardId: cards[0].id } }]);
    for (let i = 0; i < 5; i += 1) {
      act(() => {
        hook.result.current.revealHint();
      });
    }
    expect(hook.result.current.session.hintLevel).toBe(3);
    expect(hook.result.current.session.usedHint).toBe(true);
  });

  it('ヒントを使って正解したときは Easy を押しても Hard で記録される', async () => {
    const target = cards[0];
    const { hook, reviews } = await start([{ card: target, cardState: { ...state(2), cardId: target.id } }]);
    act(() => {
      hook.result.current.revealHint();
    });
    await act(async () => {
      await hook.result.current.submitAnswer(target.answers[0]);
    });
    await act(async () => {
      await hook.result.current.submitGrade(4);
    });
    expect(reviews[0].grade).toBe(2);
  });

  it('不正解なら何を押しても Unknown で記録される', async () => {
    const { hook, reviews } = await start(newQueue(5));
    await act(async () => {
      await hook.result.current.submitAnswer('でたらめな答え');
    });
    expect(hook.result.current.session.isCorrect).toBe(false);
    await act(async () => {
      await hook.result.current.submitGrade(4);
    });
    expect(reviews[0].grade).toBe(1);
  });

  it('次の問題に進むとヒントは持ち越さない', async () => {
    const withReps = cards.slice(0, 3).map((card) => ({ card, cardState: { ...state(2), cardId: card.id } }));
    const { hook } = await start(withReps);
    act(() => {
      hook.result.current.revealHint();
    });
    await act(async () => {
      await hook.result.current.submitAnswer(withReps[0].card.answers[0]);
    });
    await act(async () => {
      await hook.result.current.submitGrade(2);
    });
    expect(hook.result.current.session.index).toBe(1);
    expect(hook.result.current.session.hintLevel).toBe(0);
    expect(hook.result.current.session.usedHint).toBe(false);
  });

  it('68枚を全部通しても止まらない（選択→記述が混在した状態）', async () => {
    const mixed: StudyQueueItem[] = cards.map((card, i) => ({
      card,
      cardState: i % 2 === 0 ? null : { ...state(3), cardId: card.id },
    }));
    const { hook, reviews } = await start(mixed);

    for (let i = 0; i < cards.length; i += 1) {
      const session = hook.result.current.session;
      expect(session.status).toBe('question');
      // 出題モードごとに、答えられる手段が必ず用意されている
      if (session.mode === 'choice') {
        expect(session.choices.length).toBeGreaterThan(1);
        expect(session.choices).toContain(session.current!.card.answers[0]);
      } else {
        expect(session.choices).toEqual([]);
      }
      // 問題文に答えが残っていない
      for (const answer of session.current!.card.answers) {
        if (answer.length >= 3) expect(session.maskedQuestion).not.toContain(answer);
      }
      const answer = session.current!.card.answers[0];
      await act(async () => {
        await hook.result.current.submitAnswer(answer);
      });
      expect(hook.result.current.session.isCorrect).toBe(true);
      await act(async () => {
        await hook.result.current.submitGrade(3);
      });
    }

    await waitFor(() => expect(hook.result.current.session.status).toBe('done'));
    expect(reviews).toHaveLength(68);
    expect(hook.result.current.session.correctCount).toBe(68);
    expect(hook.result.current.session.incorrectCount).toBe(0);
  });

  it('カードが1枚しかない日は選択肢が作れないので記述になる', async () => {
    const only = cards[0];
    const { deps } = makeDeps([{ card: only, cardState: null }], [only]);
    const hook = renderHook(() => useStudySession(deps, DEFAULT_SETTINGS));
    await act(async () => {
      await hook.result.current.startSession('koukou-jouhou-glossary');
    });
    expect(hook.result.current.session.mode).toBe('input');
  });

  it('期限切れが1枚でも、選択肢はデータセット全体から作る', async () => {
    const { hook } = await start([{ card: cards[0], cardState: null }]);
    expect(hook.result.current.session.mode).toBe('choice');
    expect(hook.result.current.session.choices).toHaveLength(4);
  });

  it('対象が0枚ならすぐ完了になる', async () => {
    const { hook } = await start([]);
    expect(hook.result.current.session.status).toBe('done');
    expect(hook.result.current.session.total).toBe(0);
  });
});

describe('新しいカードの1日の上限（画面に出す残り枚数）', () => {
  async function startWithBudget(queue: StudyQueueItem[], budget: NewCardBudget) {
    const { deps, reviews } = makeDeps(queue);
    const withBudget = { ...deps, getNewCardBudget: vi.fn(async () => budget) };
    const hook = renderHook(() => useStudySession(withBudget, DEFAULT_SETTINGS));
    await act(async () => {
      await hook.result.current.startSession('koukou-jouhou-glossary');
    });
    return { hook, reviews };
  }

  async function answerAndGrade(hook: Awaited<ReturnType<typeof startWithBudget>>['hook']) {
    const answer = hook.result.current.session.current!.card.answers[0];
    await act(async () => {
      await hook.result.current.submitAnswer(answer);
    });
    await act(async () => {
      await hook.result.current.submitGrade(3);
    });
  }

  it('始めたときの残り枚数をそのまま持つ', async () => {
    const { hook } = await startWithBudget(newQueue(20), makeBudget(20, 0, 2287));
    expect(hook.result.current.session.newBudget).toEqual({ limit: 20, introducedToday: 0, remaining: 20, unseen: 2287 });
  });

  it('新しいカードを1枚答えると、残りが1枚減る', async () => {
    const { hook } = await startWithBudget(newQueue(20), makeBudget(20, 0, 2287));
    await answerAndGrade(hook);
    expect(hook.result.current.session.newBudget?.remaining).toBe(19);
    expect(hook.result.current.session.newBudget?.introducedToday).toBe(1);
    expect(hook.result.current.session.newBudget?.unseen).toBe(2286);
  });

  it('復習のカードを答えても、新しいカードの残りは減らない', async () => {
    const queue = [{ card: cards[0], cardState: { ...state(2), cardId: cards[0].id } }, ...newQueue(3).slice(1)];
    const { hook } = await startWithBudget(queue, makeBudget(20, 0, 50));
    await answerAndGrade(hook);
    expect(hook.result.current.session.newBudget?.remaining).toBe(20);
  });

  it('上限ぶんを答え終わると完了になり、「今日はここまで」と分かる', async () => {
    const { hook, reviews } = await startWithBudget(newQueue(3), makeBudget(3, 0, 100));
    for (let i = 0; i < 3; i += 1) await answerAndGrade(hook);
    expect(hook.result.current.session.status).toBe('done');
    expect(reviews).toHaveLength(3);
    expect(isNewLimitReached(hook.result.current.session.newBudget!)).toBe(true);
  });

  it('枠を返さない依存（古い呼び出し方）でも学習はできる', async () => {
    const { hook } = await start(newQueue(2));
    expect(hook.result.current.session.status).toBe('question');
    expect(hook.result.current.session.newBudget).toBeNull();
  });
});
