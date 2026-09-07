import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * 対策トップへ戻れなくなっていないかの見張り。
 * ページを1枚足したときに、戻るリンクを付け忘れるのを防ぐ。
 */

const studyDir = "src/pages/study/graphic-design";
const pages = readdirSync(studyDir).filter((f) => f.endsWith(".astro") && f !== "index.astro");

describe("グラフィックデザイン検定のページ", () => {
  it("index 以外のページが1枚以上ある", () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages)("%s に対策トップへ戻るリンクがある", (page) => {
    expect(readFileSync(join(studyDir, page), "utf8")).toContain("<GdBackLink />");
  });

  it("ドリルからも対策トップへ戻れる", () => {
    expect(readFileSync("src/pages/tools/gd-kentei.astro", "utf8")).toContain("<GdBackLink />");
  });

  it("戻り先が対策トップになっている", () => {
    expect(readFileSync("src/components/GdBackLink.astro", "utf8")).toContain(
      '"/study/graphic-design/"',
    );
  });
});
