import { describe, expect, it } from "vitest";

import {
  DEFAULT_COUNT,
  MAX_COUNT,
  clampQuestionCount,
  feedbackMessage,
  pickQuestions,
  pickQuestionsByIds,
} from "./quiz";
import { questions } from "../data/questions";

describe("出題数の丸め方", () => {
  it.each([
    ["10", 10],
    ["1", 1],
    ["20", 20],
    [String(MAX_COUNT), MAX_COUNT],
    ["0", 1],
    ["-5", 1],
    ["3.7", 3],
    ["999", MAX_COUNT],
    ["  7 ", 7],
  ])("%s → %i 問", (input, expected) => {
    expect(clampQuestionCount(input)).toBe(expected);
  });

  it.each([[""], ["   "], ["abc"], ["--"]])(
    "%s のように数として読めない値は既定の10問に戻す",
    (input) => {
      expect(clampQuestionCount(input)).toBe(DEFAULT_COUNT);
    }
  );
});

describe("出題", () => {
  it("指定した数だけ出す", () => {
    expect(pickQuestions(7)).toHaveLength(7);
  });

  it("同じ問題を2回出さない", () => {
    const ids = pickQuestions(MAX_COUNT).map((q) => q.id);
    expect(new Set(ids).size).toBe(MAX_COUNT);
  });

  it("選択肢は4つのまま、中身も変わらない", () => {
    for (const picked of pickQuestions(MAX_COUNT)) {
      const original = questions.find((q) => q.id === picked.id)!;
      expect(picked.shuffledChoices).toHaveLength(4);
      expect([...picked.shuffledChoices].sort()).toEqual([...original.choices].sort());
    }
  });

  it("間違えた問題だけを出せる", () => {
    const picked = pickQuestionsByIds([3, 9, 14]);
    expect(picked.map((q) => q.id).sort((a, b) => a - b)).toEqual([3, 9, 14]);
  });

  it("存在しない id しか無ければ空になる", () => {
    expect(pickQuestionsByIds([999])).toEqual([]);
  });
});

describe("コメント", () => {
  it("10問中の得点でコメントが変わる", () => {
    expect(feedbackMessage(10, 10)).toContain("満点");
    expect(feedbackMessage(8, 10)).toContain("とても良い");
    expect(feedbackMessage(5, 10)).toContain("基礎はできています");
    expect(feedbackMessage(2, 10)).toContain("丁寧に練習");
  });

  it("0問のときは何も言わない", () => {
    expect(feedbackMessage(0, 0)).toBe("");
  });
});
