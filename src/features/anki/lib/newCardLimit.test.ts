// 新しいカードの1日の上限。
// 上限で止まる・日付が変わると戻る・設定を変えると反映・復習は制限されない、の4つを見る。

import { describe, expect, it } from 'vitest';
import type { Card, CardState } from '../types';
import {
  DEFAULT_NEW_CARDS_PER_DAY,
  applyNewCardLimit,
  buildTodayQueue,
  countNewIntroducedToday,
  isNewLimitReached,
  makeBudget,
  newCardsAvailable,
  normalizeNewCardsPerDay,
  parseNewCardsPerDayInput,
  startOfLocalDay,
} from './newCardLimit';

const DAY = 24 * 60 * 60 * 1000;
// 端末の時刻で 2026-10-22 の昼。0時の区切りをまたぐテストのため、ローカル時刻で作る
const NOON = new Date(2026, 9, 22, 12, 0, 0).getTime();

function makeCards(count: number, prefix = 'c'): Card[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${String(i).padStart(4, '0')}`,
    question: `問題${String(i).padStart(4, '0')}`,
    answers: [`答え${i}`],
  }));
}

function reviewed(cardId: string, dueAt: number, reps = 1): CardState {
  return {
    cardId,
    datasetId: 'ds',
    stability: 2,
    difficulty: 5,
    lastReviewAt: dueAt - DAY,
    dueAt,
    reps,
    lapses: 0,
  };
}

describe('上限で止まる', () => {
  it('既定は1日20枚', () => {
    expect(DEFAULT_NEW_CARDS_PER_DAY).toBe(20);
    const { queue, budget } = buildTodayQueue({
      cards: makeCards(2287),
      states: [],
      reviews: [],
      now: NOON,
      newCardsPerDay: undefined,
    });
    expect(queue).toHaveLength(20);
    expect(budget).toEqual({ limit: 20, introducedToday: 0, remaining: 20, unseen: 2287 });
  });

  it('今日すでに答えた新しいカードのぶん、残りが減る', () => {
    const cards = makeCards(100);
    // 今日 5枚を初めて答えた
    const reviews = cards.slice(0, 5).map((c, i) => ({ cardId: c.id, reviewedAt: NOON - 1000 * (i + 1) }));
    const states = cards.slice(0, 5).map((c) => reviewed(c.id, NOON + DAY));
    const { queue, budget } = buildTodayQueue({ cards, states, reviews, now: NOON, newCardsPerDay: 20 });
    expect(budget.introducedToday).toBe(5);
    expect(budget.remaining).toBe(15);
    expect(queue).toHaveLength(15);
    expect(queue.every((item) => item.cardState === null)).toBe(true);
  });

  it('20枚答えたら、21枚目は出ない', () => {
    const cards = makeCards(100);
    const reviews = cards.slice(0, 20).map((c) => ({ cardId: c.id, reviewedAt: NOON - 1000 }));
    const states = cards.slice(0, 20).map((c) => reviewed(c.id, NOON + DAY));
    const { queue, budget } = buildTodayQueue({ cards, states, reviews, now: NOON, newCardsPerDay: 20 });
    expect(queue).toHaveLength(0);
    expect(budget.remaining).toBe(0);
    expect(isNewLimitReached(budget)).toBe(true);
  });

  it('上限を超えて答えていても、残りは負にならない', () => {
    expect(makeBudget(20, 25, 10).remaining).toBe(0);
  });

  it('まだ見ていないカードが上限より少なければ、出るのはその枚数', () => {
    const budget = makeBudget(20, 0, 7);
    expect(newCardsAvailable(budget)).toBe(7);
    expect(isNewLimitReached(budget)).toBe(false);
  });

  it('全部見終わっていれば「上限で止まっている」とは言わない', () => {
    expect(isNewLimitReached(makeBudget(20, 20, 0))).toBe(false);
  });

  it('並び順の先頭から上限ぶんだけ残す', () => {
    const items = makeCards(5).map((card) => ({ card, cardState: null }));
    expect(applyNewCardLimit(items, 2).map((i) => i.card.id)).toEqual(['c0000', 'c0001']);
  });
});

describe('日付が変わると戻る', () => {
  it('昨日はじめて答えたカードは、今日の枚数に入らない', () => {
    const cards = makeCards(50);
    const yesterday = NOON - DAY;
    const reviews = cards.slice(0, 20).map((c) => ({ cardId: c.id, reviewedAt: yesterday }));
    const states = cards.slice(0, 20).map((c) => reviewed(c.id, NOON + DAY));
    const { queue, budget } = buildTodayQueue({ cards, states, reviews, now: NOON, newCardsPerDay: 20 });
    expect(budget.introducedToday).toBe(0);
    expect(budget.remaining).toBe(20);
    expect(queue).toHaveLength(20);
  });

  it('0時ちょうどで区切る（23:59 は前の日、0:00 は次の日）', () => {
    const midnight = new Date(2026, 9, 23, 0, 0, 0).getTime();
    const reviews = [
      { cardId: 'a', reviewedAt: midnight - 60 * 1000 },
      { cardId: 'b', reviewedAt: midnight },
    ];
    expect(countNewIntroducedToday(reviews, midnight + 1000)).toBe(1);
    // 0時の1秒前に見れば、23:59 の1枚はその日のぶん
    expect(countNewIntroducedToday([reviews[0]!], midnight - 1000)).toBe(1);
    expect(startOfLocalDay(midnight + 5 * 60 * 60 * 1000)).toBe(midnight);
  });

  it('昨日はじめて答え、今日もう一度答えたカードは、今日の新しいカードに数えない', () => {
    const reviews = [
      { cardId: 'a', reviewedAt: NOON - DAY },
      { cardId: 'a', reviewedAt: NOON - 1000 },
    ];
    expect(countNewIntroducedToday(reviews, NOON)).toBe(0);
  });

  it('問題集から消えたカードの記録は数えない', () => {
    const reviews = [
      { cardId: 'gone', reviewedAt: NOON - 1000 },
      { cardId: 'kept', reviewedAt: NOON - 1000 },
    ];
    expect(countNewIntroducedToday(reviews, NOON, new Set(['kept']))).toBe(1);
  });
});

describe('設定を変えると反映', () => {
  const cards = makeCards(100);

  it('上限を5にすると5枚', () => {
    const { queue } = buildTodayQueue({ cards, states: [], reviews: [], now: NOON, newCardsPerDay: 5 });
    expect(queue).toHaveLength(5);
  });

  it('上限を0にすると、新しいカードは出ない', () => {
    const { queue, budget } = buildTodayQueue({ cards, states: [], reviews: [], now: NOON, newCardsPerDay: 0 });
    expect(queue).toHaveLength(0);
    expect(isNewLimitReached(budget)).toBe(true);
  });

  it('今日20枚答えたあと上限を30に上げると、あと10枚出る', () => {
    const reviews = cards.slice(0, 20).map((c) => ({ cardId: c.id, reviewedAt: NOON - 1000 }));
    const states = cards.slice(0, 20).map((c) => reviewed(c.id, NOON + DAY));
    const { queue } = buildTodayQueue({ cards, states, reviews, now: NOON, newCardsPerDay: 30 });
    expect(queue).toHaveLength(10);
  });

  it('保存された値がおかしいときの扱い', () => {
    expect(normalizeNewCardsPerDay(undefined)).toBe(20);
    expect(normalizeNewCardsPerDay(null)).toBe(20);
    expect(normalizeNewCardsPerDay(Number.NaN)).toBe(20);
    expect(normalizeNewCardsPerDay('30')).toBe(20);
    expect(normalizeNewCardsPerDay(-3)).toBe(0);
    expect(normalizeNewCardsPerDay(7.9)).toBe(7);
    expect(normalizeNewCardsPerDay(0)).toBe(0);
    expect(normalizeNewCardsPerDay(1e9)).toBe(9999);
  });

  it('入力欄：空欄は既定の20、0はそのまま、負の数・小数・文字は保存させない', () => {
    expect(parseNewCardsPerDayInput('')).toEqual({ ok: true, value: 20 });
    expect(parseNewCardsPerDayInput('  ')).toEqual({ ok: true, value: 20 });
    expect(parseNewCardsPerDayInput('0')).toEqual({ ok: true, value: 0 });
    expect(parseNewCardsPerDayInput('３０')).toEqual({ ok: true, value: 30 });
    expect(parseNewCardsPerDayInput('-1').ok).toBe(false);
    expect(parseNewCardsPerDayInput('2.5').ok).toBe(false);
    expect(parseNewCardsPerDayInput('abc').ok).toBe(false);
    expect(parseNewCardsPerDayInput('10000').ok).toBe(false);
    expect(parseNewCardsPerDayInput('9999')).toEqual({ ok: true, value: 9999 });
  });
});

describe('復習は制限されない', () => {
  it('期日の来た復習は、新しいカードの上限と関係なく全部出る', () => {
    const cards = makeCards(300);
    // 200枚は以前に答えていて、今日が期日
    const states = cards.slice(0, 200).map((c) => reviewed(c.id, NOON - 1000, 3));
    const reviews = cards.slice(0, 200).map((c) => ({ cardId: c.id, reviewedAt: NOON - 3 * DAY }));
    const { queue, budget } = buildTodayQueue({ cards, states, reviews, now: NOON, newCardsPerDay: 20 });
    const reviewCount = queue.filter((item) => item.cardState !== null).length;
    const newCount = queue.filter((item) => item.cardState === null).length;
    expect(reviewCount).toBe(200);
    expect(newCount).toBe(20);
    expect(budget.unseen).toBe(100);
  });

  it('上限が0でも、復習は全部出る', () => {
    const cards = makeCards(10);
    const states = cards.slice(0, 4).map((c) => reviewed(c.id, NOON - 1000));
    const reviews = cards.slice(0, 4).map((c) => ({ cardId: c.id, reviewedAt: NOON - 2 * DAY }));
    const { queue } = buildTodayQueue({ cards, states, reviews, now: NOON, newCardsPerDay: 0 });
    expect(queue).toHaveLength(4);
  });

  it('期日がまだの復習は、今までどおり出ない', () => {
    const cards = makeCards(3);
    const states = [reviewed(cards[0]!.id, NOON + DAY)];
    const reviews = [{ cardId: cards[0]!.id, reviewedAt: NOON - 2 * DAY }];
    const { queue } = buildTodayQueue({ cards, states, reviews, now: NOON, newCardsPerDay: 20 });
    expect(queue.map((i) => i.card.id)).toEqual([cards[1]!.id, cards[2]!.id]);
  });

  it('並び順は以前と同じ（新しいカードが先、復習は期日の早い順）', () => {
    const cards = makeCards(4);
    const states = [reviewed(cards[2]!.id, NOON - 1000), reviewed(cards[3]!.id, NOON - 5000)];
    const reviews = [
      { cardId: cards[2]!.id, reviewedAt: NOON - 3 * DAY },
      { cardId: cards[3]!.id, reviewedAt: NOON - 3 * DAY },
    ];
    const { queue } = buildTodayQueue({ cards, states, reviews, now: NOON, newCardsPerDay: 20 });
    expect(queue.map((i) => i.card.id)).toEqual([cards[0]!.id, cards[1]!.id, cards[3]!.id, cards[2]!.id]);
  });
});
