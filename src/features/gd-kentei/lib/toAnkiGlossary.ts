import type { Dataset } from "../../anki/types";
import type { GdTerm } from "../types";
import { getField } from "./fields";

/**
 * 用語辞典を『覚える君』のデータセットに変換する。
 *
 * **変換はこちら側にだけ置く。覚える君のデータ形式（`memory-app-dataset/1`）は変えない。**
 * 覚える君は説明文を見せて用語名を答えさせる作りなので、
 * `short`（1行の定義）を question に、用語そのものを answers にする。
 */

const SCHEMA = "memory-app-dataset/1";

export interface ToAnkiOptions {
  /** 級で絞る。省略すると全部入れる */
  level?: GdTerm["levels"][number];
  /** 解説ページのURLの前半。explanation に付ける */
  baseUrl?: string;
}

export function toAnkiGlossary(terms: GdTerm[], options: ToAnkiOptions = {}): Dataset {
  const { level, baseUrl = "https://koukou-jouhou.org/study/graphic-design" } = options;

  const target = level ? terms.filter((t) => t.levels.includes(level)) : terms;

  return {
    schema: SCHEMA,
    datasetId: level ? `gd-kentei-glossary-${level}` : "gd-kentei-glossary",
    title: level
      ? `グラフィックデザイン検定 用語集（${level}級）`
      : "グラフィックデザイン検定 用語集",
    description:
      "グラフィックデザイン検定の対策用の用語集です。説明文を読んで用語名を答えます。",
    tags: ["グラフィックデザイン検定", "用語"],
    cards: target.map((term) => ({
      id: term.id,
      topic: getField(term.field).label,
      question: term.short,
      // 読みも正解にする。用語をカタカナで打てない生徒が詰まるため
      answers: dedupe([term.term, term.reading]),
      explanation: `くわしくは ${baseUrl}/glossary/#${term.id}`,
      tags: [getField(term.field).label, ...term.levels.map((l) => `${l}級`)],
    })),
  };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter((v) => v.trim() !== ""))];
}
