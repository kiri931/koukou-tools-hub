import { describe, expect, it } from "vitest";
import type { GdTerm } from "../types";
import { toAnkiGlossary } from "./toAnkiGlossary";

const terms: GdTerm[] = [
  {
    id: "nombre",
    term: "ノンブル",
    reading: "のんぶる",
    field: "layout",
    short: "本のページ番号のこと。",
    body: "",
    related: [],
    levels: ["3", "2"],
    seenIn: ["30-3-7-2"],
  },
  {
    id: "marbling",
    term: "マーブリング",
    reading: "まーぶりんぐ",
    field: "planning",
    short: "水面の流れ模様を紙に写し取る技法。墨流しとも呼ぶ。",
    body: "",
    related: [],
    levels: ["3"],
    seenIn: ["30-3-1-3"],
  },
];

describe("覚える君への変換", () => {
  it("覚える君のスキーマで出す", () => {
    const dataset = toAnkiGlossary(terms);
    expect(dataset.schema).toBe("memory-app-dataset/1");
    expect(dataset.cards).toHaveLength(2);
  });

  it("説明文を問い、用語と読みの両方を正解にする", () => {
    const [card] = toAnkiGlossary(terms).cards;
    expect(card.question).toBe("本のページ番号のこと。");
    expect(card.answers).toEqual(["ノンブル", "のんぶる"]);
  });

  it("分野名を topic とタグに入れる", () => {
    const [card] = toAnkiGlossary(terms).cards;
    expect(card.topic).toBe("編集レイアウト");
    expect(card.tags).toContain("編集レイアウト");
    expect(card.tags).toContain("3級");
    expect(card.tags).toContain("2級");
  });

  it("級で絞れる", () => {
    const dataset = toAnkiGlossary(terms, { level: "2" });
    expect(dataset.cards.map((c) => c.id)).toEqual(["nombre"]);
    expect(dataset.datasetId).toBe("gd-kentei-glossary-2");
  });

  it("用語と読みが同じでも答えを重複させない", () => {
    const dataset = toAnkiGlossary([{ ...terms[0], reading: "ノンブル" }]);
    expect(dataset.cards[0].answers).toEqual(["ノンブル"]);
  });
});
