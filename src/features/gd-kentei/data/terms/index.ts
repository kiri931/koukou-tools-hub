import type { GdTerm } from "../../types";
import binding from "./binding.json";
import layout from "./layout.json";
import photo from "./photo.json";
import planning from "./planning.json";
import prepress from "./prepress.json";
import printing from "./printing.json";

/**
 * 用語辞典。分野ごとに1ファイルにしてある
 * （1ファイルが大きくなりすぎるのを避け、分野単位で差分を読めるようにするため）。
 */
export const terms: GdTerm[] = [
  ...planning,
  ...photo,
  ...layout,
  ...prepress,
  ...printing,
  ...binding,
] as GdTerm[];
