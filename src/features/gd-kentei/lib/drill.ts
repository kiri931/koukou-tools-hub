import type { FieldId, GdQuestion, Level } from "../types";

/**
 * 分野別ドリルと復習の出題。模擬試験（`exam.ts`）とは別で、
 * こちらは**1問ずつ正誤と解説を出す**軽い練習用。
 */

export interface DrillOptions {
  field?: FieldId;
  level?: Level;
  /** 出す問題数 */
  count?: number;
  /** 直近に間違えた問題の id。前に出す */
  wrongIds?: string[];
  /** 並びを決める乱数。テストでは固定したものを渡す */
  random?: () => number;
}

/**
 * 出題順を決める。
 *
 * **間違えた問題を先に出す。** 分散復習そのものは『覚える君』の担当なので、
 * ここは「直前に間違えたものを取りこぼさない」ところまでにとどめる。
 */
export function pickQuestions(all: GdQuestion[], options: DrillOptions = {}): GdQuestion[] {
  const { field, level, count = 10, wrongIds = [], random = Math.random } = options;

  const pool = all.filter(
    (q) => (field ? q.field === field : true) && (level ? q.level === level : true),
  );

  const wrong = new Set(wrongIds);
  const [prioritized, rest] = partition(pool, (q) => wrong.has(q.id));

  return [...shuffle(prioritized, random), ...shuffle(rest, random)].slice(0, count);
}

/**
 * 選択肢を混ぜる。**answer の添字も一緒に付け替える。**
 * データ側の並びのまま出すと、正解の位置に癖が出て記憶されてしまう。
 */
export function shuffleChoices(
  question: GdQuestion,
  random: () => number = Math.random,
): GdQuestion {
  const indices = shuffle([0, 1, 2, 3], random);
  const choices = indices.map((i) => question.choices[i]) as GdQuestion["choices"];
  const answer = indices.indexOf(question.answer) as 0 | 1 | 2 | 3;
  return { ...question, choices, answer };
}

/**
 * 記述判定型で、画面に出す帯の文言。
 * 「正しいもの」と「間違っているもの」の取り違えが本番の失点源なので、
 * 問題文とは別に必ず出す（仕様書 §6.3）。
 */
export function polarityBanner(question: GdQuestion): string | null {
  if (question.type !== "statement" || !question.polarity) {
    return null;
  }
  return question.polarity === "correct"
    ? "正しいものを1つ選ぶ"
    : "間違っているものを1つ選ぶ";
}

function partition<T>(items: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const yes: T[] = [];
  const no: T[] = [];
  for (const item of items) {
    (predicate(item) ? yes : no).push(item);
  }
  return [yes, no];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
