import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  appendHistory,
  clearHistory,
  formatRecord,
  loadHistory,
  pendingWrongIds,
  type AttemptRecord,
} from "./history";

const STORAGE_KEY = "equation-transformation:history:v1";

const record = (over: Partial<AttemptRecord> = {}): AttemptRecord => ({
  at: 1_770_000_000_000,
  mode: "choice",
  total: 10,
  correct: 8,
  wrongIds: [3, 7],
  ...over,
});

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("記録の読み書き", () => {
  it("最初は空", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("足した記録が新しい順に並ぶ", () => {
    appendHistory(record({ at: 1 }));
    appendHistory(record({ at: 2 }));
    expect(loadHistory().map((r) => r.at)).toEqual([2, 1]);
  });

  it("5回を超えたら古いものから捨てる", () => {
    for (let i = 1; i <= 8; i += 1) appendHistory(record({ at: i }));
    expect(loadHistory().map((r) => r.at)).toEqual([8, 7, 6, 5, 4]);
  });

  it("消せる", () => {
    appendHistory(record());
    clearHistory();
    expect(loadHistory()).toEqual([]);
  });
});

describe("壊れた保存内容から守る", () => {
  it.each([["not json"], ["{}"], ['{"a":1}'], ["[1,2,3]"]])(
    "%s が入っていても空として扱う",
    (raw) => {
      window.localStorage.setItem(STORAGE_KEY, raw);
      expect(loadHistory()).toEqual([]);
    }
  );

  it("形の違う記録だけを捨てて、正しいものは残す", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([record({ at: 5 }), { at: "きのう" }, record({ at: 4 })])
    );
    expect(loadHistory().map((r) => r.at)).toEqual([5, 4]);
  });

  it("localStorage が読めない環境でも落ちない", () => {
    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("読めません");
    });
    expect(loadHistory()).toEqual([]);
  });

  it("localStorage に書けない環境でも落ちない", () => {
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("書けません");
    });
    expect(() => appendHistory(record())).not.toThrow();
  });
});

describe("間違えた問題の集め方", () => {
  it("新しい回のものが先に来て、重複しない", () => {
    const history = [
      record({ at: 3, wrongIds: [5, 1] }),
      record({ at: 2, wrongIds: [1, 9] }),
      record({ at: 1, wrongIds: [9] }),
    ];
    expect(pendingWrongIds(history)).toEqual([5, 1, 9]);
  });

  it("全問正解の回しかなければ空", () => {
    expect(pendingWrongIds([record({ wrongIds: [] })])).toEqual([]);
  });
});

describe("表示", () => {
  it("得点・方式・日時が1行になる", () => {
    const line = formatRecord(record({ at: new Date(2026, 7, 5, 14, 20).getTime(), correct: 9 }));
    expect(line).toContain("9/10");
    expect(line).toContain("択一式");
    expect(line).toContain("8月5日 14:20");
  });

  it("記述式も区別できる", () => {
    expect(formatRecord(record({ mode: "input" }))).toContain("記述式");
  });
});
