import { describe, expect, it } from "vitest";
import { levelGuides } from "../data/levels";
import { terms } from "../data/terms";
import { levels } from "./fields";

/**
 * 級ごとの案内に載せる数値の点検。
 * **合格率は協会の報告書の値をそのまま持っている**ので、
 * 合格者÷受験者と大きくずれていないかを見張る（写し間違いの検出）。
 */
describe("級ごとの案内（実データ）", () => {
  it("3級・2級・1級すべてある", () => {
    expect(levels.map((l) => levelGuides[l]?.level)).toEqual(["3", "2", "1"]);
  });

  it("5年分（第26〜30回）の実施結果がそろっている", () => {
    for (const level of levels) {
      expect(levelGuides[level].results.map((r) => r.exam)).toEqual([26, 27, 28, 29, 30]);
    }
  });

  it("載せた合格率が、合格者÷受験者と0.2ポイント以上ずれていない", () => {
    const off = levels.flatMap((level) =>
      levelGuides[level].results
        .map((r) => ({
          key: `${level}級 第${r.exam}回`,
          stated: r.passRate,
          computed: Math.round((r.passed / r.examinees) * 1000) / 10,
          hasNote: Boolean(r.note),
        }))
        .filter((row) => Math.abs(row.stated - row.computed) >= 0.2),
    );
    // 1級の合格率は実技を含むため筆記の合格者数とは一致しない。除いて見る。
    // 第28回の3級・2級は報告書自体が合わないので、注記を付けたものだけ許す。
    const unexplained = off.filter(
      (row) => !row.key.startsWith("1級") && !row.hasNote,
    );
    expect(unexplained).toEqual([]);
  });

  it("設問の内訳が、各級375設問（5年 × 15問 × 5設問）になっている", () => {
    for (const level of levels) {
      const b = levelGuides[level].breakdown;
      expect(b.term + b.statement).toBe(375);
      expect(b.correct + b.incorrect).toBe(b.statement);
    }
  });

  it("級が上がるほど記述判定型が増える", () => {
    const statements = levels.map((l) => levelGuides[l].breakdown.statement);
    expect(statements).toEqual([...statements].sort((a, b) => a - b));
  });

  it("どの級にも、用語辞典に載っている語が20語以上ある", () => {
    const thin = levels
      .map((l) => ({ l, n: terms.filter((t) => t.levels.includes(l)).length }))
      .filter((row) => row.n < 20);
    expect(thin).toEqual([]);
  });

  it("報告書と計算が合わない年には、必ず断り書きが付いている", () => {
    const missing = levels.flatMap((level) =>
      levelGuides[level].results
        .filter(
          (r) =>
            level !== "1" &&
            Math.abs(r.passRate - Math.round((r.passed / r.examinees) * 1000) / 10) >= 0.2 &&
            !r.note,
        )
        .map((r) => `${level}級 第${r.exam}回`),
    );
    expect(missing).toEqual([]);
  });

  it("進め方は3手順以上ある", () => {
    for (const level of levels) {
      expect(levelGuides[level].plan.length).toBeGreaterThanOrEqual(3);
    }
  });
});
