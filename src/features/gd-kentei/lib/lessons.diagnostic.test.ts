import { describe, expect, it } from "vitest";
import { lessons } from "../data/lessons";
import { terms } from "../data/terms";
import { fields } from "./fields";

const termIds = new Set(terms.map((t) => t.id));

function allText(field: keyof typeof lessons) {
  const lesson = lessons[field];
  return [...lesson.intro, ...lesson.sections.flatMap((s) => s.paragraphs), ...lesson.pitfalls];
}

function linkedIds(field: keyof typeof lessons) {
  return [...new Set(allText(field).flatMap((p) => [...p.matchAll(/\[\[([a-z0-9-]+)\]\]/g)].map((m) => m[1])))];
}

/**
 * 本物の解説を流して品質を見張る診断テスト。
 * 用語を消したり id を変えたりしたときに、本文のリンクが黙って壊れないようにする。
 */
describe("解説（実データ）", () => {
  it("6分野すべてに解説がある", () => {
    const missing = fields.filter((f) => !lessons[f.id]).map((f) => f.id);
    expect(missing).toEqual([]);
  });

  it("本文の [[用語]] がすべて実在する", () => {
    const broken = fields.flatMap((f) =>
      linkedIds(f.id)
        .filter((id) => !termIds.has(id))
        .map((id) => `${f.id}: ${id}`),
    );
    expect(broken).toEqual([]);
  });

  it("リンクした用語は、その分野の用語である", () => {
    const byId = new Map(terms.map((t) => [t.id, t]));
    const stray = fields.flatMap((f) =>
      linkedIds(f.id)
        .map((id) => byId.get(id))
        .filter((t) => t && t.field !== f.id)
        .map((t) => `${f.id}: ${t!.id} は ${t!.field} の語`),
    );
    expect(stray).toEqual([]);
  });

  it("どの分野も用語を15語以上リンクしている", () => {
    const thin = fields
      .map((f) => ({ id: f.id, n: linkedIds(f.id).length }))
      .filter((row) => row.n < 15)
      .map((row) => `${row.id}: ${row.n}語`);
    expect(thin).toEqual([]);
  });

  it("どの分野も見出しが4つ以上あり、取り違えやすい点が3つ以上ある", () => {
    const thin = fields
      .filter((f) => lessons[f.id].sections.length < 4 || lessons[f.id].pitfalls.length < 3)
      .map((f) => f.id);
    expect(thin).toEqual([]);
  });

  it("見出しが分野の中で重複していない", () => {
    const dup = fields.flatMap((f) => {
      const headings = lessons[f.id].sections.map((s) => s.heading);
      return headings.length === new Set(headings).size ? [] : [f.id];
    });
    expect(dup).toEqual([]);
  });
});
