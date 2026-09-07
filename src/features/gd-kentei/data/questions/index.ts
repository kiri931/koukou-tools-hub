import type { GdQuestion } from "../../types";
import binding from "./binding.json";
import layout from "./layout.json";
import photo from "./photo.json";
import planning from "./planning.json";
import prepress from "./prepress.json";
import printing from "./printing.json";

/**
 * 書き下ろした4択問題。分野ごとに1ファイル。
 *
 * **過去問の問題文・選択肢は1文字も入れない。**
 * 過去問は「どの分野から、どういう聞き方で、どの用語が出るか」の
 * 分析にだけ使っている（docs/design/graphic-design-kentei-spec.md §4）。
 */
export const questions: GdQuestion[] = [
  ...planning,
  ...photo,
  ...layout,
  ...prepress,
  ...printing,
  ...binding,
] as GdQuestion[];
