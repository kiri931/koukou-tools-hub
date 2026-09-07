import { describe, expect, it } from "vitest";
import { terms } from "../data/terms";
import { fields } from "./fields";
import { MINIMUM_PER_FIELD, coverage, validateTerms } from "./validate";

/**
 * 本物の用語辞典を流して品質を見張る診断テスト。
 * 機能の合否ではなく、**語を書き足したときに崩れていないか**を見る。
 */
describe("用語辞典（実データ）", () => {
  it("点検に引っかかる語が無い", () => {
    const problems = validateTerms(terms);
    expect(problems.map((p) => `${p.id}: ${p.message}`)).toEqual([]);
  });

  it("どの分野も最低20語ある", () => {
    const thin = coverage(terms, [])
      .filter((row) => row.terms < MINIMUM_PER_FIELD)
      .map((row) => `${row.label}: ${row.terms}語`);
    expect(thin).toEqual([]);
  });

  it("分野の値が6つのいずれかになっている", () => {
    const known = new Set(fields.map((f) => f.id));
    const stray = terms.filter((t) => !known.has(t.field)).map((t) => t.id);
    expect(stray).toEqual([]);
  });

  it("id が英小文字・数字・ハイフンだけでできている（URLの#に使うため）", () => {
    const bad = terms.filter((t) => !/^[a-z0-9-]+$/.test(t.id)).map((t) => t.id);
    expect(bad).toEqual([]);
  });
});

describe("出題実績（seenIn）", () => {
  it("識別子の形が「回-級-問-設問」になっている", () => {
    const bad = terms
      .flatMap((t) => t.seenIn.map((s) => ({ id: t.id, s })))
      .filter(({ s }) => !/^(2[6-9]|30)-[123]-(1[0-5]|[1-9])-[1-5]$/.test(s));
    expect(bad).toEqual([]);
  });

  it("seenIn がある語は、levels がその出題実績と食い違わない", () => {
    const mismatched = terms
      .filter((t) => t.seenIn.length > 0)
      .filter((t) => {
        const fromSeen = new Set(t.seenIn.map((s) => s.split("-")[1]));
        return t.levels.some((l) => !fromSeen.has(l)) || [...fromSeen].some((l) => !t.levels.includes(l as never));
      })
      .map((t) => t.id);
    expect(mismatched).toEqual([]);
  });

  it("出題実績が確かめられた語が7割以上ある", () => {
    const withSeen = terms.filter((t) => t.seenIn.length > 0).length;
    expect(withSeen / terms.length).toBeGreaterThanOrEqual(0.7);
  });
});
