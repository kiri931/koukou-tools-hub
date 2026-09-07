import type { FieldId } from "../../types";

/**
 * 分野ごとの解説（読み物）。
 *
 * 本文の中で `[[term-id]]` と書くと、用語辞典のその語に置き換わる。
 * 押すとその場で定義が開き、**ページは移動しない**
 * （読んでいる途中で飛ばすと戻ってこないため。仕様書 §6.1）。
 */
export interface Lesson {
  field: FieldId;
  /** 本番でこの分野が割り当てられている問番号を、読者に伝える一文 */
  scope: string;
  /** 冒頭の1〜2段落。何を押さえる分野なのかを書く */
  intro: string[];
  sections: LessonSection[];
  /** 「ここを取り違えると落とす」という注意。箇条書きで出す */
  pitfalls: string[];
}

export interface LessonSection {
  heading: string;
  paragraphs: string[];
  /** この節に添える図解。無い節もある */
  figure?: LessonFigure;
}

export interface LessonFigure {
  /**
   * `src/features/gd-kentei/figures/` の中のファイル名。
   * **SVGはページに直接埋め込む。** `<img>` で読むと currentColor が
   * ページの文字色を継承せず、テーマを手で切り替えたときに線が見えなくなる。
   */
  src: string;
  /** 図が何を示しているかの説明。図を見られない人にも伝わるように書く */
  alt: string;
  /** 図の下に出す短い説明 */
  caption: string;
}
