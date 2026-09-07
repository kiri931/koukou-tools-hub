/**
 * グラフィックデザイン検定（公益社団法人 全国工業高等学校長協会）の対策教材の型。
 *
 * **ここに過去問の問題文・選択肢の文章を持たせないこと。**
 * 過去問は協会の著作物で、転載しない。このリポジトリが持つのは
 * 書き下ろした解説・書き下ろした類題・自作の図だけ。
 * 詳しくは docs/design/graphic-design-kentei-spec.md の §4。
 */

/** 出題分野。問番号から機械的に決まる（fields.ts の fieldOfQuestion）。 */
export type FieldId =
  | "planning" // 企画・マーケティング・デザイン（問1〜3）
  | "photo" // 写真（問4〜6）
  | "layout" // 編集レイアウト（問7〜9）
  | "prepress" // 写真製版（問10〜11）
  | "printing" // 印刷（問12〜13）
  | "binding"; // 製本（問14〜15）

/** 級。準1級は受検枠ではなく1級の合格ラインが2段階あるだけなので、ここには入れない。 */
export type Level = "3" | "2" | "1";

export interface Field {
  id: FieldId;
  /** 画面に出す分野名 */
  label: string;
  /** 分野の一行説明。解説の入口カードに出す */
  desc: string;
  /** 本番でこの分野が割り当てられている問番号 */
  questionNumbers: number[];
}

/** 用語辞典の1語。 */
export interface GdTerm {
  id: string;
  term: string;
  /** 読み。検索と五十音の並べ替えに使う */
  reading: string;
  field: FieldId;
  /** 1行の定義。カードと本文中のツールチップに出す */
  short: string;
  /** 数行の解説。Markdown を許す */
  body: string;
  /** 関連語の GdTerm['id'] */
  related: string[];
  /** 図解SVGのパス（public 基準）。図が要る語だけ */
  figure?: string;
  /** この語が出た級 */
  levels: Level[];
  /**
   * 出題箇所の識別子だけを持つ（'30-3-7-2' = 第30回・3級・問7・設問②）。
   * **問題文は持たない。**
   */
  seenIn: string[];
}

/** 設問の型。過去問4年分を読んだ結果、この2つに分かれる（仕様書 §3.3）。 */
export type QuestionType =
  /** 説明文があり、当てはまる用語を4択から選ぶ */
  | "term"
  /** 4つの記述から、正しい／間違っているものを1つ選ぶ */
  | "statement";

/** statement 型で、どちらを選ばせるか。本番の失点源なので画面で強調する。 */
export type Polarity = "correct" | "incorrect";

/** 書き下ろした問題。 */
export interface GdQuestion {
  id: string;
  field: FieldId;
  level: Level;
  type: QuestionType;
  /** type が 'statement' のときだけ入る */
  polarity?: Polarity;
  stem: string;
  choices: [string, string, string, string];
  /** choices の添字 */
  answer: 0 | 1 | 2 | 3;
  /**
   * なぜその答えかの解説。
   * **正解以外の3つの選択肢すべてに触れる**（診断テストで見張る）。
   */
  explanation: string;
  /** 解説へ戻るための GdTerm['id'] */
  termIds: string[];
  figure?: string;
}
