// 新しいカード（まだ一度も答えていないカード）を1日に出す枚数の上限。
//
// 試験用語集（ITパスポート 2287枚・基本情報 4280枚）を取り込むと、
// 上限が無いと全部がその日の「今日の復習」に入ってしまう（2026-10-22 オーナー決定で上限を付けた）。
//
// - 上限は問題集（デッキ）ごとにかかる。値そのものは設定タブの1つを全デッキで共有する
// - 復習（一度でも答えたカード）は今までどおり制限しない
// - 「今日すでに出した枚数」は別に数えて保存せず、reviews（答えた記録）から数える。
//   答えた記録は IndexedDB にすでに残っているので、同じことを2か所に書くと食い違う
// - 「1日」の区切りは端末の時刻の0時。countDue の「今日」（その日の 23:59:59.999 まで）と同じ

import type { Card, CardState, StudyQueueItem } from '../types';

export const DEFAULT_NEW_CARDS_PER_DAY = 20;
/** 打ち間違い（0を1つ多く打つなど）で桁が飛んでも、画面が固まらない程度の上限 */
export const MAX_NEW_CARDS_PER_DAY = 9999;

/**
 * 保存された値を、上限として使える数にそろえる。
 * 無い・数でない → 既定の20。負の数 → 0。小数 → 切り捨て。大きすぎる → 9999。
 * 0 は「今日は新しいカードを出さない（復習だけ）」として、そのまま使う。
 */
export function normalizeNewCardsPerDay(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_NEW_CARDS_PER_DAY;
  return Math.min(MAX_NEW_CARDS_PER_DAY, Math.max(0, Math.floor(value)));
}

export type ParsedLimitInput = { ok: true; value: number } | { ok: false; message: string };

/**
 * 設定画面の入力欄の文字を読む。
 * 空欄は既定の20に戻す。負の数・小数・数でないものは保存させずに理由を返す
 * （黙って丸めると、入れたつもりの値と違う枚数が出て気づけない）。
 */
export function parseNewCardsPerDayInput(raw: string): ParsedLimitInput {
  const text = raw.normalize('NFKC').trim();
  if (text === '') return { ok: true, value: DEFAULT_NEW_CARDS_PER_DAY };
  if (!/^-?\d+$/.test(text)) {
    return { ok: false, message: '新しいカードの枚数は、0以上の整数で入れてください。' };
  }
  const value = Number(text);
  if (value < 0) return { ok: false, message: '新しいカードの枚数は、0以上の整数で入れてください。' };
  if (value > MAX_NEW_CARDS_PER_DAY) {
    return { ok: false, message: `新しいカードの枚数は、${MAX_NEW_CARDS_PER_DAY}枚までにしてください。` };
  }
  return { ok: true, value };
}

/** その時刻を含む日の0時（端末の時刻） */
export function startOfLocalDay(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * 今日はじめて答えたカードの枚数。
 * カードごとに最初の記録の時刻を見て、それが今日の0時以降なら「今日出した新しいカード」。
 * 昨日はじめて答えて今日もう一度答えたカードは、復習なので数えない。
 * cardIds を渡すと、いまの問題集に残っているカードだけを数える（用語集の読み直しで消えたカードを除く）。
 */
export function countNewIntroducedToday(
  reviews: Array<{ cardId: string; reviewedAt: number }>,
  now: number,
  cardIds?: Set<string>,
): number {
  const firstSeen = new Map<string, number>();
  for (const review of reviews) {
    const prev = firstSeen.get(review.cardId);
    if (prev === undefined || review.reviewedAt < prev) firstSeen.set(review.cardId, review.reviewedAt);
  }
  const dayStart = startOfLocalDay(now);
  let count = 0;
  for (const [cardId, at] of firstSeen) {
    if (at < dayStart) continue;
    if (cardIds && !cardIds.has(cardId)) continue;
    count += 1;
  }
  return count;
}

/** 新しいカードの今日の枠 */
export interface NewCardBudget {
  /** 1日の上限 */
  limit: number;
  /** 今日すでに出した（答えた）新しいカード */
  introducedToday: number;
  /** 今日あと出せる枚数（上限 − 今日出したぶん。まだ見ていないカードの数は考えない） */
  remaining: number;
  /** まだ一度も答えていないカードの総数 */
  unseen: number;
}

export function makeBudget(limit: number, introducedToday: number, unseen: number): NewCardBudget {
  return {
    limit,
    introducedToday,
    remaining: Math.max(0, limit - introducedToday),
    unseen,
  };
}

/** 今日このあと実際に出る新しいカードの枚数 */
export function newCardsAvailable(budget: NewCardBudget): number {
  return Math.min(budget.remaining, budget.unseen);
}

/** 上限で止まっていて、まだ見ていないカードが残っている */
export function isNewLimitReached(budget: NewCardBudget): boolean {
  return budget.remaining === 0 && budget.unseen > 0;
}

/** cardState が無いか、reps が 0 のカードを「新しいカード」とみなす（出題モードの判定と同じ） */
export function isNewCard(state: CardState | null | undefined): boolean {
  return !state || state.reps === 0;
}

/**
 * 今日の出題の並びに、新しいカードの上限をかける。
 * 復習のカードはすべて残し、新しいカードは並び順の先頭から remaining 枚だけ残す。
 * 並び順そのものは変えない。
 */
export function applyNewCardLimit(items: StudyQueueItem[], remaining: number): StudyQueueItem[] {
  let left = Math.max(0, remaining);
  return items.filter((item) => {
    if (!isNewCard(item.cardState)) return true;
    if (left <= 0) return false;
    left -= 1;
    return true;
  });
}

/**
 * 1つの問題集について、今日の出題の並びと新しいカードの枠を作る。
 * useDB.buildDueQueue / countDue はこれを呼ぶだけにして、判定はここでテストする。
 *
 * 並び順は以前と同じ：新しいカード（問題文の五十音順）→ 復習（期日の早い順）。
 */
export function buildTodayQueue(params: {
  cards: Card[];
  states: CardState[];
  reviews: Array<{ cardId: string; reviewedAt: number }>;
  now: number;
  newCardsPerDay: unknown;
}): { queue: StudyQueueItem[]; budget: NewCardBudget } {
  const { cards, states, reviews, now } = params;
  const limit = normalizeNewCardsPerDay(params.newCardsPerDay);
  const stateMap = new Map(states.map((state) => [state.cardId, state]));
  const cardIds = new Set(cards.map((card) => card.id));

  const due = cards
    .map<StudyQueueItem>((card) => ({ card, cardState: stateMap.get(card.id) ?? null }))
    .filter((item) => isNewCard(item.cardState) || item.cardState!.dueAt <= now)
    .sort((a, b) => {
      const aNew = isNewCard(a.cardState);
      const bNew = isNewCard(b.cardState);
      if (aNew && bNew) return a.card.question.localeCompare(b.card.question, 'ja');
      if (aNew) return -1;
      if (bNew) return 1;
      return a.cardState!.dueAt - b.cardState!.dueAt;
    });

  const unseen = due.filter((item) => isNewCard(item.cardState)).length;
  const budget = makeBudget(limit, countNewIntroducedToday(reviews, now, cardIds), unseen);
  return { queue: applyNewCardLimit(due, budget.remaining), budget };
}
