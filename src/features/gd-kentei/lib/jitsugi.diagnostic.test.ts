import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 1級実技の練習課題の配布物が、そろっているかを見張る。
 * **ページからリンクしているのにファイルが無い**という壊れ方を防ぐ。
 */
const dir = join(process.cwd(), "public/gd-jitsugi/dento-iro");

const required = [
  "README.txt",
  "shijisho.pdf",
  "shijizu.pdf",
  "checklist.pdf",
  "dento-iro.zip",
  ...["1", "2", "3", "4", "data1", "data2"].map((n) => `text/${n}.txt`),
  ...["A", "B", "C", "D", "E", "F"].map((n) => `image/${n}.jpg`),
  ...["aizome", "asanoha", "seigaiha", "kikkou", "hyou", "logo"].flatMap((n) => [
    `illust/${n}.svg`,
    `illust/${n}.png`,
  ]),
];

describe("1級実技の練習課題（実データ）", () => {
  it("配布物がすべてそろっている", () => {
    expect(required.filter((f) => !existsSync(join(dir, f)))).toEqual([]);
  });

  it("空のファイルが無い", () => {
    const empty = required.filter((f) => existsSync(join(dir, f)) && statSync(join(dir, f)).size === 0);
    expect(empty).toEqual([]);
  });

  it("PDFが大きくなりすぎていない（1本2MB以内）", () => {
    // IPAmj明朝を pdf-lib で埋め込むと1本31MBになった。Chrome の印刷に切り替えた経緯がある
    const heavy = ["shijisho.pdf", "shijizu.pdf", "checklist.pdf"]
      .map((f) => ({ f, mb: statSync(join(dir, f)).size / 1024 / 1024 }))
      .filter((row) => row.mb > 2)
      .map((row) => `${row.f}: ${row.mb.toFixed(1)}MB`);
    expect(heavy).toEqual([]);
  });

  it("支給データに、実在の団体名を使っていない", async () => {
    const { readFileSync } = await import("node:fs");
    const readme = readFileSync(join(dir, "README.txt"), "utf8");
    expect(readme).not.toContain("全国工業高等学校長協会");
  });
});
