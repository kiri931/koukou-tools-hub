import { describe, expect, it } from "vitest";
import type { GdQuestion, GdTerm } from "../types";
import { coverage, validateQuestions, validateTerms } from "./validate";

const term = (over: Partial<GdTerm> = {}): GdTerm => ({
  id: "nombre",
  term: "ノンブル",
  reading: "のんぶる",
  field: "layout",
  short: "本のページ番号のこと。",
  body: "",
  related: [],
  levels: ["3"],
  seenIn: [],
  ...over,
});

const question = (over: Partial<GdQuestion> = {}): GdQuestion => ({
  id: "layout-001",
  field: "layout",
  level: "3",
  type: "term",
  stem: "本のページ番号を何というか。",
  choices: ["ノンブル", "柱", "丁番", "組み番"],
  answer: 0,
  explanation:
    "ノンブルがページ番号。柱はページ上部などに入る見出し、丁番は折丁の番号、組み番は組版の管理番号で、いずれもページ番号そのものではない。",
  termIds: ["nombre"],
  ...over,
});

describe("用語の点検", () => {
  it("正しい用語は何も言わない", () => {
    expect(validateTerms([term()])).toEqual([]);
  });

  it("id の重複を見つける", () => {
    expect(validateTerms([term(), term()])[0].message).toContain("重複");
  });

  it("定義や読みの空を見つける", () => {
    expect(validateTerms([term({ short: "  " })])[0].message).toContain("short");
    expect(validateTerms([term({ reading: "" })])[0].message).toContain("reading");
  });

  it("関連語のリンク切れを見つける", () => {
    const problems = validateTerms([term({ related: ["hashira"] })]);
    expect(problems[0].message).toContain("hashira");
  });

  it("自分自身への関連付けを見つける", () => {
    const problems = validateTerms([term({ related: ["nombre"] })]);
    expect(problems.some((p) => p.message.includes("自分自身"))).toBe(true);
  });
});

describe("問題の点検", () => {
  it("正しい問題は何も言わない", () => {
    expect(validateQuestions([question()], [term()])).toEqual([]);
  });

  it("選択肢の重複を見つける", () => {
    const problems = validateQuestions(
      [question({ choices: ["ノンブル", "ノンブル", "丁番", "組み番"] })],
      [term()],
    );
    expect(problems.some((p) => p.message.includes("重複"))).toBe(true);
  });

  it("解説が誤答に触れていないと見つける", () => {
    const problems = validateQuestions(
      [question({ explanation: "ノンブルがページ番号です。" })],
      [term()],
    );
    expect(problems[0].message).toContain("柱");
  });

  it("記述判定型で polarity の抜けを見つける", () => {
    const problems = validateQuestions([question({ type: "statement" })], [term()]);
    expect(problems.some((p) => p.message.includes("polarity"))).toBe(true);
  });

  it("用語型に polarity が付いていたら見つける", () => {
    const problems = validateQuestions([question({ polarity: "correct" })], [term()]);
    expect(problems.some((p) => p.message.includes("要らない"))).toBe(true);
  });

  it("存在しない用語への参照を見つける", () => {
    const problems = validateQuestions([question({ termIds: ["hashira"] })], [term()]);
    expect(problems[0].message).toContain("hashira");
  });
});

describe("手当ての薄さ", () => {
  it("6分野すべてを行として返す", () => {
    const rows = coverage([term()], [question()]);
    expect(rows).toHaveLength(6);
    expect(rows.find((r) => r.field === "layout")).toMatchObject({ terms: 1, questions: 1 });
    expect(rows.find((r) => r.field === "photo")).toMatchObject({ terms: 0, questions: 0 });
  });
});
