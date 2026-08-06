import { questions as questionBank } from "../data/questions";
import type { Question, RenderedQuestion } from "../types";

export const DEFAULT_COUNT = 10;
export const MAX_COUNT = questionBank.length;

function shuffleArray<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * 出題数の入力欄の値を、実際に出す問題数に直す。
 * 空欄や数字でない値は既定の10問に戻す（1問だけ出るのは事故なので）。
 */
export function clampQuestionCount(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return DEFAULT_COUNT;

  const value = Number(trimmed);
  if (!Number.isFinite(value)) return DEFAULT_COUNT;

  return Math.max(1, Math.min(MAX_COUNT, Math.floor(value)));
}

/** バンクから指定数を選び、選択肢も混ぜて返す */
export function pickQuestions(count: number, from: readonly Question[] = questionBank): RenderedQuestion[] {
  return shuffleArray(from)
    .slice(0, Math.max(1, Math.min(from.length, count)))
    .map((question) => ({
      ...question,
      shuffledChoices: shuffleArray(question.choices),
    }));
}

/** 指定した id の問題だけを出す（間違えた問題のやり直し用） */
export function pickQuestionsByIds(ids: readonly number[]): RenderedQuestion[] {
  const wanted = new Set(ids);
  const matched = questionBank.filter((question) => wanted.has(question.id));
  if (matched.length === 0) return [];
  return pickQuestions(matched.length, matched);
}

export function feedbackMessage(correct: number, total: number): string {
  if (total === 0) return "";
  if (correct === total) return "満点！移項と係数処理が完璧です。";
  if (correct >= Math.ceil(total * 0.8)) {
    return "とても良いです。符号と割り算の扱いを再確認すると満点が見えます。";
  }
  if (correct >= Math.ceil(total * 0.5)) {
    return "基礎はできています。移項時の符号ミスに注意！";
  }
  return "まずは移項→係数で割るの手順を丁寧に練習しましょう。";
}
