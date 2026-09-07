import { describe, expect, it } from "vitest";
import { examRules, fieldOfQuestion, fields, getField } from "./fields";

describe("分野の割り当て", () => {
  it("問1〜問15をすべて過不足なく覆う", () => {
    const covered = fields.flatMap((f) => f.questionNumbers).sort((a, b) => a - b);
    expect(covered).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  it("本番と同じ配分になっている（3:3:3:2:2:2）", () => {
    expect(fields.map((f) => f.questionNumbers.length)).toEqual([3, 3, 3, 2, 2, 2]);
  });

  it("問番号から分野を引ける", () => {
    expect(fieldOfQuestion(1)).toBe("planning");
    expect(fieldOfQuestion(6)).toBe("photo");
    expect(fieldOfQuestion(9)).toBe("layout");
    expect(fieldOfQuestion(10)).toBe("prepress");
    expect(fieldOfQuestion(13)).toBe("printing");
    expect(fieldOfQuestion(15)).toBe("binding");
  });

  it("本番に無い問番号は黙って通さない", () => {
    expect(() => fieldOfQuestion(0)).toThrow();
    expect(() => fieldOfQuestion(16)).toThrow();
  });

  it("getField は未知の分野を黙って通さない", () => {
    // @ts-expect-error 存在しない分野を渡したときの振る舞いを見る
    expect(() => getField("typography")).toThrow();
  });
});

describe("受検の決まり", () => {
  it("15題中10題、1問5設問なので解答は50設問になる", () => {
    expect(examRules.totalQuestions).toBe(15);
    expect(examRules.answerQuestions).toBe(10);
    expect(examRules.answerQuestions * examRules.subQuestions).toBe(50);
  });
});
