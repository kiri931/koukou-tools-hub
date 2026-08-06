/**
 * 採点の記録を、その端末のブラウザの中だけに残す。
 *
 * サーバーへは何も送らない。名前も学年も持たない。残すのは
 * 「いつ・どちらの方式で・何問中何問できたか」と「間違えた問題の番号」だけ。
 * localStorage が使えない環境（プライベートモード等）では、
 * 記録を諦めて通常どおり動く。
 */

const STORAGE_KEY = "equation-transformation:history:v1";
/** 残す回数。古いものから捨てる */
const MAX_ENTRIES = 5;

export interface AttemptRecord {
  /** 採点した時刻（ミリ秒） */
  at: number;
  mode: "choice" | "input";
  total: number;
  correct: number;
  /** 間違えた問題の id */
  wrongIds: number[];
}

function isRecord(value: unknown): value is AttemptRecord {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<AttemptRecord>;
  return (
    typeof candidate.at === "number" &&
    (candidate.mode === "choice" || candidate.mode === "input") &&
    typeof candidate.total === "number" &&
    typeof candidate.correct === "number" &&
    Array.isArray(candidate.wrongIds) &&
    candidate.wrongIds.every((id) => typeof id === "number")
  );
}

/** 保存されている記録を新しい順に返す。読めなければ空 */
export function loadHistory(): AttemptRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/** 1回ぶん足して保存し、保存後の記録を返す。書けなければ元の並びだけ返す */
export function appendHistory(record: AttemptRecord): AttemptRecord[] {
  const next = [record, ...loadHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 保存できなくても画面は動かす
  }
  return next;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 消せなくても何もしない
  }
}

/**
 * 記録に残っている「間違えた問題」の id を、新しい順に重複なく返す。
 * いちばん新しい回で間違えたものが先に来る。
 */
export function pendingWrongIds(history: readonly AttemptRecord[]): number[] {
  const seen = new Set<number>();
  const wrong: number[] = [];

  for (const record of history) {
    for (const id of record.wrongIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      wrong.push(id);
    }
  }

  return wrong;
}

/** 「8/10（8月5日 14:20）」のような1行にする */
export function formatRecord(record: AttemptRecord): string {
  const date = new Date(record.at);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const mode = record.mode === "choice" ? "択一式" : "記述式";
  return `${record.correct}/${record.total}　${mode}　${month}月${day}日 ${hour}:${minute}`;
}
