import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * 対策トップへ戻れなくなっていないかの見張り。
 *
 * 2026-09-27: 以前の GdBackLink（「対策へもどる」の1本リンク）はやめ、Layout のパンくずに任せた。
 * パンくずは URL から作られ、/study/graphic-design/xxx/ なら
 * 「トップ › グラフィックデザイン検定 › xxx」になる（2番目が対策トップへのリンク）。
 * ページが crumbs を自分で渡すときは、その中に対策トップへのリンクが入っていることを確かめる。
 */

const studyDir = "src/pages/study/graphic-design";
const pages = readdirSync(studyDir).filter((f) => f.endsWith(".astro") && f !== "index.astro");
const top = "/study/graphic-design/";

describe("グラフィックデザイン検定のページ", () => {
  it("index 以外のページが1枚以上ある", () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages)("%s のパンくずから対策トップへ戻れる", (page) => {
    const source = readFileSync(join(studyDir, page), "utf8");
    // crumbs を渡していなければ URL から作られる（/study/graphic-design/ が2番目に入る）
    if (source.includes("crumbs=")) {
      expect(source).toContain(`href: "${top}"`);
    }
    expect(source).toContain("<Layout");
  });

  it("Layout のパンくずが、対策トップの名前を知っている", () => {
    expect(readFileSync("src/layouts/Layout.astro", "utf8")).toContain(
      "'graphic-design': 'グラフィックデザイン検定'",
    );
  });

  it("ドリル（/tools/ の下でパンくずが対策トップを通らない）から対策トップへのリンクがある", () => {
    expect(readFileSync("src/pages/tools/gd-kentei.astro", "utf8")).toContain(`href="${top}"`);
  });
});
