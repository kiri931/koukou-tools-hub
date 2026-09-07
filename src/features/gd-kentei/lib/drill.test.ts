import { describe, expect, it } from "vitest";
import type { GdQuestion } from "../types";
import { pickQuestions, polarityBanner, shuffleChoices } from "./drill";

const q = (over: Partial<GdQuestion> & { id: string }): GdQuestion => ({
  field: "layout",
  level: "3",
  type: "term",
  stem: "問題文",
  choices: ["ア", "イ", "ウ", "エ"],
  answer: 0,
  explanation: "解説",
  termIds: [],
  ...over,
});

/** 常に先頭を選ぶ乱数。並びを固定して中身だけ見る */
const noShuffle = () => 0;

describe("出題の選び方", () => {
  const all = [
    q({ id: "layout-1" }),
    q({ id: "layout-2" }),
    q({ id: "photo-1", field: "photo" }),
    q({ id: "printing-1", field: "printing", level: "2" }),
  ];

  it("分野で絞れる", () => {
    const picked = pickQuestions(all, { field: "photo", random: noShuffle });
    expect(picked.map((x) => x.id)).toEqual(["photo-1"]);
  });

  it("級で絞れる", () => {
    const picked = pickQuestions(all, { level: "2", random: noShuffle });
    expect(picked.map((x) => x.id)).toEqual(["printing-1"]);
  });

  it("問題数を超えて出さない", () => {
    expect(pickQuestions(all, { count: 2, random: noShuffle })).toHaveLength(2);
  });

  it("間違えた問題を先に出す", () => {
    const picked = pickQuestions(all, { wrongIds: ["printing-1"], random: noShuffle });
    expect(picked[0].id).toBe("printing-1");
  });

  it("該当する問題が無ければ空で返す", () => {
    expect(pickQuestions(all, { field: "binding", random: noShuffle })).toEqual([]);
  });
});

describe("選択肢の混ぜ方", () => {
  it("混ぜても正解は同じ選択肢を指し続ける", () => {
    const original = q({ id: "x", choices: ["ア", "イ", "ウ", "エ"], answer: 2 });
    for (let seed = 0; seed < 50; seed += 1) {
      const shuffled = shuffleChoices(original, () => Math.random());
      expect(shuffled.choices[shuffled.answer]).toBe("ウ");
      expect([...shuffled.choices].sort()).toEqual([...original.choices].sort());
    }
  });
});

describe("正しい／間違っているの帯", () => {
  it("記述判定型では必ず出す", () => {
    expect(polarityBanner(q({ id: "a", type: "statement", polarity: "incorrect" }))).toBe(
      "間違っているものを1つ選ぶ",
    );
    expect(polarityBanner(q({ id: "b", type: "statement", polarity: "correct" }))).toBe(
      "正しいものを1つ選ぶ",
    );
  });

  it("用語型では出さない", () => {
    expect(polarityBanner(q({ id: "c" }))).toBeNull();
  });
});
