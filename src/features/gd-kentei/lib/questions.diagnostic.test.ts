import { describe, expect, it } from "vitest";
import { questions } from "../data/questions";
import { terms } from "../data/terms";
import { fields } from "./fields";
import { MINIMUM_PER_FIELD, coverage, validateQuestions } from "./validate";

/**
 * 本物の問題データを流して品質を見張る診断テスト。
 * 問題を書き足す人が増えても、解説の抜けやリンク切れが公開されないようにする。
 */
describe("問題（実データ）", () => {
  it("点検に引っかかる問題が無い", () => {
    const problems = validateQuestions(questions, terms);
    expect(problems.map((p) => `${p.id}: ${p.message}`)).toEqual([]);
  });

  it("id が重複していない", () => {
    const ids = questions.map((q) => q.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("正解の位置が1つの選択肢に偏っていない", () => {
    const counts = [0, 1, 2, 3].map((i) => questions.filter((q) => q.answer === i).length);
    // 出題時にシャッフルするが、データそのものの偏りも見ておく
    const max = Math.max(...counts);
    expect(max).toBeLessThanOrEqual(questions.length * 0.6);
  });

  it("記述判定型には必ず polarity がある", () => {
    const bad = questions.filter((q) => q.type === "statement" && !q.polarity).map((q) => q.id);
    expect(bad).toEqual([]);
  });

  it("どの分野も問題が20問以上ある（まだ手が回っていない分野を洗い出す）", () => {
    const thin = coverage(terms, questions)
      .filter((row) => row.questions < MINIMUM_PER_FIELD)
      .map((row) => `${row.label}: ${row.questions}問`);
    expect(thin).toEqual([]);
  });
});
