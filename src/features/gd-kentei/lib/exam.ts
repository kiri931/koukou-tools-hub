import type { Level } from "../types";
import { examRules } from "./fields";

/**
 * 模擬試験の状態と採点。**本番の受検規則をそのまま再現する**（仕様書 §6.3）。
 *
 * 本番は問1〜問15のうち **10題を選んで** 解答し、11題以上に手を付けると失格になる。
 * ここが本番でいちばん事故が起きるところなので、画面ではなくこの層で止める。
 *
 * React には出さない素の関数にしてある（`AGENTS.md`: 判定や生成のロジックは
 * React の外に出してからテストを書く）。
 */

/** 1問（設問①〜⑤）ぶんの解答。未解答は null。 */
export type QuestionAnswers = (0 | 1 | 2 | 3 | null)[];

export interface ExamSession {
  level: Level;
  /** 問番号（1〜15）→ 設問5つの解答 */
  answers: Map<number, QuestionAnswers>;
  /** 受検者が「解く」と決めた問番号。順序は選んだ順 */
  selected: number[];
}

export function createSession(level: Level): ExamSession {
  return { level, answers: new Map(), selected: [] };
}

export type OpenResult =
  | { ok: true; session: ExamSession }
  /** 11題目を開こうとした。本番なら失格になる */
  | { ok: false; reason: "limit"; message: string };

/**
 * 問を開く（＝解く対象に加える）。
 * すでに選んでいる問を開き直すのは自由。**11題目だけを断る。**
 */
export function openQuestion(session: ExamSession, questionNumber: number): OpenResult {
  if (questionNumber < 1 || questionNumber > examRules.totalQuestions) {
    throw new Error(`問${questionNumber} は本番に存在しない（問1〜問15）`);
  }
  if (session.selected.includes(questionNumber)) {
    return { ok: true, session };
  }
  if (session.selected.length >= examRules.answerQuestions) {
    return {
      ok: false,
      reason: "limit",
      message: `解答できるのは${examRules.answerQuestions}題までです。本番では${examRules.answerQuestions + 1}題目に手を付けると失格になります。`,
    };
  }
  return {
    ok: true,
    session: {
      ...session,
      selected: [...session.selected, questionNumber],
      answers: new Map(session.answers).set(
        questionNumber,
        new Array(examRules.subQuestions).fill(null),
      ),
    },
  };
}

/** 選んだ問を取り下げる。解答も消える（本番で答案を消すのと同じ）。 */
export function closeQuestion(session: ExamSession, questionNumber: number): ExamSession {
  const answers = new Map(session.answers);
  answers.delete(questionNumber);
  return {
    ...session,
    selected: session.selected.filter((n) => n !== questionNumber),
    answers,
  };
}

export function answer(
  session: ExamSession,
  questionNumber: number,
  subIndex: number,
  choice: 0 | 1 | 2 | 3,
): ExamSession {
  const current = session.answers.get(questionNumber);
  if (!current) {
    throw new Error(`問${questionNumber} はまだ開いていない`);
  }
  if (subIndex < 0 || subIndex >= examRules.subQuestions) {
    throw new Error(`設問${subIndex + 1} は存在しない（①〜⑤）`);
  }
  const next = [...current];
  next[subIndex] = choice;
  return { ...session, answers: new Map(session.answers).set(questionNumber, next) };
}

/** 1級の合格は2段階ある。準1級は受検枠ではなく、1級の下側のラインを指す。 */
export type Judgement = "pass" | "junior-pass" | "fail";

export interface ExamResult {
  /** 正解した設問の数（0〜50） */
  correct: number;
  /** 採点対象の設問の数。10題そろっていなければ50未満になる */
  scored: number;
  /** 100点満点。50設問＝100点なので1設問2点 */
  score: number;
  judgement: Judgement;
  /** 選んだ問が10題に満たない場合の不足数 */
  shortBy: number;
}

/**
 * 採点する。
 *
 * @param correctAnswers 問番号 → 設問5つの正解。開いていない問は見ない。
 * @param level 1級のときだけ準1級の判定を出す。
 * @param juniorPassingScore 準1級のライン。本番の筆記は「60点以上で合格」しか
 *   公表されていないため、**ここは本番の数値ではなく練習用の目安**。既定は50点。
 */
export function grade(
  session: ExamSession,
  correctAnswers: Map<number, (0 | 1 | 2 | 3)[]>,
  { juniorPassingScore = 50 }: { juniorPassingScore?: number } = {},
): ExamResult {
  let correct = 0;
  const scoredQuestions = session.selected.slice(0, examRules.answerQuestions);

  for (const questionNumber of scoredQuestions) {
    const given = session.answers.get(questionNumber) ?? [];
    const truth = correctAnswers.get(questionNumber);
    if (!truth) {
      throw new Error(`問${questionNumber} の正解が渡されていない`);
    }
    for (let i = 0; i < examRules.subQuestions; i += 1) {
      if (given[i] !== null && given[i] === truth[i]) {
        correct += 1;
      }
    }
  }

  const fullMarks = examRules.answerQuestions * examRules.subQuestions; // 50設問
  const score = Math.round((correct / fullMarks) * 100);

  let judgement: Judgement = "fail";
  if (score >= examRules.passingScore) {
    judgement = "pass";
  } else if (session.level === "1" && score >= juniorPassingScore) {
    judgement = "junior-pass";
  }

  return {
    correct,
    scored: scoredQuestions.length * examRules.subQuestions,
    score,
    judgement,
    shortBy: Math.max(0, examRules.answerQuestions - session.selected.length),
  };
}

export const judgementLabels: Record<Judgement, string> = {
  pass: "合格",
  "junior-pass": "準1級のライン",
  fail: "不合格",
};
