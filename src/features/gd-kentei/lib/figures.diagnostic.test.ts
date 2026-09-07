import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lessons } from "../data/lessons";
import { fields } from "./fields";

const figureDir = join(process.cwd(), "src/features/gd-kentei/figures");
const figures = fields
  .flatMap((f) => lessons[f.id].sections)
  .map((s) => s.figure)
  .filter((f): f is NonNullable<typeof f> => Boolean(f));

/**
 * 解説に添えた図の点検。**ファイルが無いのに本文だけ図に触れている、
 * という壊れ方を防ぐ。**
 */
describe("図解（実データ）", () => {
  it("参照している図がすべて実在する", () => {
    const missing = figures
      .filter((f) => !existsSync(join(figureDir, f.src)))
      .map((f) => f.src);
    expect(missing).toEqual([]);
  });

  it("すべての図に alt と caption がある", () => {
    const bad = figures
      .filter((f) => f.alt.trim().length < 10 || f.caption.trim() === "")
      .map((f) => f.src);
    expect(bad).toEqual([]);
  });

  it("SVG に viewBox と title があり、width/height を持たない", () => {
    const bad: string[] = [];
    for (const f of figures) {
      const svg = readFileSync(join(figureDir, f.src), "utf8");
      if (!svg.includes("viewBox=")) bad.push(`${f.src}: viewBox が無い`);
      if (!svg.includes("<title")) bad.push(`${f.src}: title が無い`);
      if (/<svg[^>]*\s(width|height)=/.test(svg)) bad.push(`${f.src}: width/height が付いている`);
    }
    expect(bad).toEqual([]);
  });

  it("同じ図を2か所で使っていない", () => {
    const srcs = figures.map((f) => f.src);
    expect(srcs.length).toBe(new Set(srcs).size);
  });

  it("10枚の図がすべて使われている", () => {
    expect(figures.length).toBe(10);
  });
});
