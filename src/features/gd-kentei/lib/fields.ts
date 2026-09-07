import type { Field, FieldId, Level } from "../types";

/**
 * 出題分野。**この割り当ては本番で固定されている。**
 * 第26〜30回（令和3〜7年度）の3級・2級・1級筆記すべてで、
 * 問1〜問15への分野の割り当ては同じだった（実測: 2026-09-07）。
 * だから解説も模擬試験もこの6分野で切る。
 */
export const fields: Field[] = [
  {
    id: "planning",
    label: "企画・マーケティング・デザイン",
    desc: "商品をどう売るかを考える枠組みと、色・かたち・文字の基本。",
    questionNumbers: [1, 2, 3],
  },
  {
    id: "photo",
    label: "写真",
    desc: "レンズ・露出・光の当て方と、デジタルカメラの記録のしかた。",
    questionNumbers: [4, 5, 6],
  },
  {
    id: "layout",
    label: "編集レイアウト",
    desc: "文字組みと誌面づくりの決まりごと。用語がいちばん多い分野。",
    questionNumbers: [7, 8, 9],
  },
  {
    id: "prepress",
    label: "写真製版",
    desc: "原稿を印刷できる版に変えるまで。解像度と線数の関係が要。",
    questionNumbers: [10, 11],
  },
  {
    id: "printing",
    label: "印刷",
    desc: "版の種類と印刷機のしくみ、インキと用紙。",
    questionNumbers: [12, 13],
  },
  {
    id: "binding",
    label: "製本",
    desc: "折り・綴じ・断裁と、本のかたち。",
    questionNumbers: [14, 15],
  },
];

const byId = new Map<FieldId, Field>(fields.map((f) => [f.id, f]));

export function getField(id: FieldId): Field {
  const field = byId.get(id);
  if (!field) {
    throw new Error(`分野 '${id}' は存在しない`);
  }
  return field;
}

const fieldByQuestionNumber = new Map<number, FieldId>(
  fields.flatMap((f) => f.questionNumbers.map((n) => [n, f.id] as const)),
);

/** 本番の問番号（1〜15）から分野を引く。 */
export function fieldOfQuestion(questionNumber: number): FieldId {
  const id = fieldByQuestionNumber.get(questionNumber);
  if (!id) {
    throw new Error(`問${questionNumber} は本番に存在しない（問1〜問15）`);
  }
  return id;
}

/**
 * 本番の受検の決まり（第26〜30回で共通。実測: 2026-09-07）。
 * 模擬試験モードはこの値をそのまま使う。
 */
export const examRules = {
  /** 出題される問の数 */
  totalQuestions: 15,
  /** そのうち解答する問の数。**これを超えると本番では失格になる。** */
  answerQuestions: 10,
  /** 1問あたりの設問数（①〜⑤） */
  subQuestions: 5,
  /** 筆記の制限時間（分） */
  minutes: 60,
  /** 合格点（100点満点） */
  passingScore: 60,
} as const;

export const levels: Level[] = ["3", "2", "1"];

export const levelLabels: Record<Level, string> = {
  "3": "3級",
  "2": "2級",
  "1": "1級",
};
