import { describe, expect, it } from "vitest";
import { answer, closeQuestion, createSession, grade, openQuestion } from "./exam";
import type { ExamSession } from "./exam";

/** 問1〜15の正解をすべて A（添字0）にした表。 */
const allA = new Map<number, (0 | 1 | 2 | 3)[]>(
  Array.from({ length: 15 }, (_, i) => [i + 1, [0, 0, 0, 0, 0]] as const),
);

function open(session: ExamSession, ...numbers: number[]): ExamSession {
  let next = session;
  for (const n of numbers) {
    const result = openQuestion(next, n);
    if (!result.ok) {
      throw new Error(`問${n} を開けなかった: ${result.message}`);
    }
    next = result.session;
  }
  return next;
}

/** 開いている問すべてに、指定した選択肢を5設問ぶん入れる。 */
function fill(session: ExamSession, choice: 0 | 1 | 2 | 3): ExamSession {
  let next = session;
  for (const n of next.selected) {
    for (let i = 0; i < 5; i += 1) {
      next = answer(next, n, i, choice);
    }
  }
  return next;
}

describe("10題の選択", () => {
  it("10題までは開ける", () => {
    const session = open(createSession("3"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    expect(session.selected).toHaveLength(10);
  });

  it("11題目は開けない", () => {
    const session = open(createSession("3"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    const result = openQuestion(session, 11);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("limit");
      expect(result.message).toContain("失格");
    }
  });

  it("すでに開いた問を開き直すのは11題目にならない", () => {
    const session = open(createSession("3"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    const result = openQuestion(session, 3);
    expect(result.ok).toBe(true);
  });

  it("取り下げれば別の問を開ける", () => {
    let session = open(createSession("3"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    session = closeQuestion(session, 10);
    const result = openQuestion(session, 11);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.selected).toContain(11);
      expect(result.session.selected).not.toContain(10);
    }
  });

  it("取り下げるとその問の解答も消える", () => {
    let session = open(createSession("3"), 1);
    session = answer(session, 1, 0, 2);
    session = closeQuestion(session, 1);
    expect(session.answers.has(1)).toBe(false);
  });

  it("開いていない問には答えられない", () => {
    expect(() => answer(createSession("3"), 1, 0, 0)).toThrow();
  });

  it("本番に無い問番号は開けない", () => {
    expect(() => openQuestion(createSession("3"), 16)).toThrow();
  });
});

describe("採点", () => {
  it("全問正解は100点で合格", () => {
    const session = fill(open(createSession("3"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10), 0);
    const result = grade(session, allA);
    expect(result.correct).toBe(50);
    expect(result.score).toBe(100);
    expect(result.judgement).toBe("pass");
    expect(result.shortBy).toBe(0);
  });

  it("全問不正解は0点で不合格", () => {
    const session = fill(open(createSession("3"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10), 1);
    expect(grade(session, allA).judgement).toBe("fail");
  });

  it("60点ちょうどで合格する（30設問正解）", () => {
    let session = open(createSession("3"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    session = fill(session, 1); // まず全部はずす
    for (const n of [1, 2, 3, 4, 5, 6]) {
      for (let i = 0; i < 5; i += 1) {
        session = answer(session, n, i, 0);
      }
    }
    const result = grade(session, allA);
    expect(result.correct).toBe(30);
    expect(result.score).toBe(60);
    expect(result.judgement).toBe("pass");
  });

  it("未解答は正解にならない", () => {
    const session = open(createSession("3"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    const result = grade(session, allA);
    expect(result.correct).toBe(0);
  });

  it("10題に満たなければ不足数を返す（満点は50設問のまま）", () => {
    const session = fill(open(createSession("3"), 1, 2, 3), 0);
    const result = grade(session, allA);
    expect(result.correct).toBe(15);
    expect(result.scored).toBe(15);
    expect(result.score).toBe(30);
    expect(result.shortBy).toBe(7);
  });

  it("1級だけ準1級のラインを出す", () => {
    let session = open(createSession("1"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    session = fill(session, 1);
    for (const n of [1, 2, 3, 4, 5]) {
      for (let i = 0; i < 5; i += 1) {
        session = answer(session, n, i, 0);
      }
    }
    expect(grade(session, allA).score).toBe(50);
    expect(grade(session, allA).judgement).toBe("junior-pass");
  });

  it("3級では同じ点でも準1級の判定は出ない", () => {
    let session = open(createSession("3"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    session = fill(session, 1);
    for (const n of [1, 2, 3, 4, 5]) {
      for (let i = 0; i < 5; i += 1) {
        session = answer(session, n, i, 0);
      }
    }
    expect(grade(session, allA).judgement).toBe("fail");
  });

  it("正解表に無い問を選んでいたら黙って0点にしない", () => {
    const session = open(createSession("3"), 1);
    expect(() => grade(session, new Map())).toThrow();
  });
});
