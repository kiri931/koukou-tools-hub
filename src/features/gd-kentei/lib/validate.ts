import type { FieldId, GdQuestion, GdTerm } from "../types";
import { fields } from "./fields";

/**
 * 用語と問題のデータを点検する。
 *
 * 機能の合否ではなく、**データが増えたときに崩れていないか**を見るためのもの
 * （`AGENTS.md` の「実データを使う診断テスト」）。
 * 問題を書き足す人が増えても、解説の抜けやリンク切れがそのまま公開されないようにする。
 */

export interface Problem {
  /** 対象の id（用語または問題） */
  id: string;
  message: string;
}

/** 分野ごとに最低これだけは用意する（仕様書 §5.4）。 */
export const MINIMUM_PER_FIELD = 20;

export function validateTerms(terms: GdTerm[]): Problem[] {
  const problems: Problem[] = [];
  const ids = new Set(terms.map((t) => t.id));

  const seen = new Set<string>();
  for (const term of terms) {
    if (seen.has(term.id)) {
      problems.push({ id: term.id, message: "id が重複している" });
    }
    seen.add(term.id);

    if (term.short.trim() === "") {
      problems.push({ id: term.id, message: "1行の定義（short）が空" });
    }
    if (term.reading.trim() === "") {
      problems.push({ id: term.id, message: "読み（reading）が空。検索と並べ替えができない" });
    }
    if (term.levels.length === 0) {
      problems.push({ id: term.id, message: "出た級（levels）が空" });
    }
    for (const related of term.related) {
      if (!ids.has(related)) {
        problems.push({ id: term.id, message: `関連語 '${related}' が存在しない` });
      }
      if (related === term.id) {
        problems.push({ id: term.id, message: "自分自身を関連語にしている" });
      }
    }
  }

  return problems;
}

export function validateQuestions(questions: GdQuestion[], terms: GdTerm[]): Problem[] {
  const problems: Problem[] = [];
  const termIds = new Set(terms.map((t) => t.id));

  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) {
      problems.push({ id: q.id, message: "id が重複している" });
    }
    seen.add(q.id);

    if (q.choices.length !== 4) {
      problems.push({ id: q.id, message: `選択肢が${q.choices.length}個。本番は4択` });
    }
    if (new Set(q.choices).size !== q.choices.length) {
      problems.push({ id: q.id, message: "選択肢に重複がある" });
    }
    if (q.answer < 0 || q.answer > 3) {
      problems.push({ id: q.id, message: `answer が範囲外（${q.answer}）` });
    }
    if (q.type === "statement" && !q.polarity) {
      problems.push({
        id: q.id,
        message: "記述判定型なのに polarity が無い。正しいものを選ぶのか間違っているものを選ぶのか決まらない",
      });
    }
    if (q.type === "term" && q.polarity) {
      problems.push({ id: q.id, message: "用語型に polarity は要らない" });
    }
    if (q.explanation.trim() === "") {
      problems.push({ id: q.id, message: "解説が空" });
    } else {
      // 正解以外の3つに触れているか。触れていないと「なぜ他が違うか」が分からない。
      // 記述判定型の選択肢は文なので、末尾の句点まで丸ごと一致させるのは無理がある。
      // **頭から12文字**が解説の中に出てくることを求める（言い換えではなく引用させる）。
      const missed = q.choices.filter(
        (choice, i) => i !== q.answer && !q.explanation.includes(quotedHead(choice)),
      );
      if (missed.length > 0) {
        problems.push({
          id: q.id,
          message: `解説が誤答の選択肢に触れていない: ${missed.join("・")}`,
        });
      }
    }
    for (const termId of q.termIds) {
      if (!termIds.has(termId)) {
        problems.push({ id: q.id, message: `用語 '${termId}' が存在しない` });
      }
    }
  }

  return problems;
}

/** 解説の中に引用されているかを見るための、選択肢の頭の部分。 */
function quotedHead(choice: string): string {
  const trimmed = choice.replace(/[。．.]+$/, "");
  return trimmed.slice(0, 12);
}

export interface Coverage {
  field: FieldId;
  label: string;
  terms: number;
  questions: number;
}

/** 分野ごとの手当ての薄さを見る。仕上げの残りがどこかを1表で出す。 */
export function coverage(terms: GdTerm[], questions: GdQuestion[]): Coverage[] {
  return fields.map((field) => ({
    field: field.id,
    label: field.label,
    terms: terms.filter((t) => t.field === field.id).length,
    questions: questions.filter((q) => q.field === field.id).length,
  }));
}
