import { CATEGORIES_BY_LEVEL } from '../data/templates';
import type { DrillCategory, DrillLevel, DrillLevelFilter } from '../types';

/**
 * 練習のしかた・級の選択肢・URL の読み書きをまとめた純粋関数。
 * 画面（CalcDrill.tsx）から切り離しておくと、テストで直接確かめられる。
 */

export type DrillMode = 'guide' | 'solo' | 'sheet' | 'tips';

export const DRILL_MODE_KEYS: readonly DrillMode[] = ['solo', 'guide', 'sheet', 'tips'];

/**
 * 最初に開くモード。検定を受ける生徒は本番で自分の電卓を使うので、
 * 「問題を見て自分で解く」を入口にする（ガイド練習は授業用に URL で選べる）。
 */
export const DEFAULT_MODE: DrillMode = 'solo';

/** `?mode=guide|solo|sheet|tips`。無い・不正なら既定の「自分で解く」。 */
export function parseModeParam(search: string): DrillMode {
  const value = new URLSearchParams(search).get('mode');
  return (DRILL_MODE_KEYS as readonly string[]).includes(value ?? '')
    ? (value as DrillMode)
    : DEFAULT_MODE;
}

/**
 * ふだん選べる級。この検定を調べて来る生徒は簡単な問題を求めていないので、
 * 3級を中心にする。4級はアーカイブとして別に開く（問題データは残してある）。
 */
export const MAIN_LEVELS: readonly DrillLevel[] = ['3級', '2級'];
export const ARCHIVE_LEVEL: DrillLevel = '4級';
export const DEFAULT_LEVEL: DrillLevel = '3級';

/** `?level=4` で4級のアーカイブを開く。 */
export function parseArchiveParam(search: string): boolean {
  return new URLSearchParams(search).get('level') === '4';
}

/** 「自分で解く」「解答用紙」「打ち方のコツ」の級の選択肢（1つに決める） */
export function levelOptions(archive: boolean): DrillLevel[] {
  return archive ? [ARCHIVE_LEVEL] : [...MAIN_LEVELS];
}

/** ガイド練習の級の選択肢（「すべて」を含む。すべて＝ふだん選べる級のすべて） */
export function levelFilterOptions(archive: boolean): DrillLevelFilter[] {
  return archive ? [ARCHIVE_LEVEL] : [...MAIN_LEVELS, 'すべて'];
}

/** 絞り込み「すべて」の表示名。4級が入っていないことを文字で示す。 */
export function levelFilterLabel(filter: DrillLevelFilter): string {
  return filter === 'すべて' ? `すべて（${MAIN_LEVELS.join('・')}）` : filter;
}

/** その級の問題を、いまの絞り込みで出してよいか */
export function levelMatches(level: DrillLevel, filter: DrillLevelFilter): boolean {
  if (filter === 'すべて') return MAIN_LEVELS.includes(level);
  return level === filter;
}

/** 「すべて」のときの分野の選択肢。ふだん選べる級に実在する分野だけ。 */
export function categoriesForFilter(filter: DrillLevelFilter): DrillCategory[] {
  const levels = filter === 'すべて' ? MAIN_LEVELS : [filter];
  const seen = new Set<DrillCategory>();
  for (const level of levels) for (const c of CATEGORIES_BY_LEVEL[level]) seen.add(c);
  return [...seen];
}

/**
 * 今の URL に、モードとアーカイブの状態を書き込んだ URL を返す。
 * ほかのクエリやハッシュは残す。既定値（solo・アーカイブ無し）でも mode は書く
 * （共有した URL が、開いた人の画面と食い違わないように）。
 */
export function urlWithDrillState(href: string, mode: DrillMode, archive: boolean): string {
  const url = new URL(href);
  url.searchParams.set('mode', mode);
  if (archive) url.searchParams.set('level', '4');
  else url.searchParams.delete('level');
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * 入力欄に打った答えを、採点に渡せる形にそろえる。
 * 全角の数字・記号、カンマ、空白、全角のマイナス（−）を半角に直すだけで、
 * 丸めや判定の基準は変えない（判定は grading.ts の isAnswerCorrect のまま）。
 */
export function normalizeTypedAnswer(input: string): string {
  return input
    .replace(/[０-９．－＋ｅＥ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[−ー‐―]/g, '-')
    .replace(/[,，\s]/g, '');
}
