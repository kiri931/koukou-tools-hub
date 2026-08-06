import { describe, expect, it } from "vitest";

import { compareAnswers, parseEquation } from "./equivalence";
import { questions } from "../data/questions";

const isEquivalent = (given: string, answer: string) =>
  compareAnswers(given, answer).kind === "equivalent";

describe("数学的に同じ答えは、書き方が違っても正解にする", () => {
  const cases: [string, string, string][] = [
    ["書き方をそのまま", "x=\\dfrac{5y-7}{3}", "x=\\dfrac{5y-7}{3}"],
    ["dfrac と frac", "x=\\dfrac{5y-7}{3}", "x=\\frac{5y-7}{3}"],
    ["スラッシュで書く", "x=\\dfrac{5y-7}{3}", "x=(5y-7)/3"],
    ["空白が入る", "x=\\dfrac{5y-7}{3}", "x = \\dfrac{5y-7}{3}"],
    ["分子の項を入れ替える", "x=\\dfrac{5y-7}{3}", "x=\\dfrac{-7+5y}{3}"],
    ["分配した形", "x=\\dfrac{5y-7}{3}", "x=\\dfrac{5}{3}y-\\dfrac{7}{3}"],
    ["分母を負にした形", "x=\\dfrac{5y-7}{3}", "x=\\dfrac{7-5y}{-3}"],
    ["約分していない形", "x=\\dfrac{5y-7}{3}", "x=\\dfrac{10y-14}{6}"],
    ["項の順序", "a=2+3b", "a=3b+2"],
    ["cdot で掛ける", "a=2+3b", "a=2+b\\cdot3"],
    ["times で掛ける", "a=2+3b", "a=2+3\\times b"],
    ["係数を分けた形", "x=\\dfrac{P}{4y}", "x=\\dfrac{1}{4}\\cdot\\dfrac{P}{y}"],
    ["かっこ付きの割り算", "x=\\dfrac{P}{4y}", "x=P/(4y)"],
    ["指数の波かっこ有無", "y=\\dfrac{30}{x^{2}}", "y=\\dfrac{30}{x^2}"],
    ["指数をスラッシュで", "y=\\dfrac{30}{x^{2}}", "y=30/x^2"],
    ["展開した形", "x=p(r-q)", "x=pr-pq"],
    ["因子の順序", "x=p(r-q)", "x=(r-q)p"],
    ["項の順序（分数を含む）", "x=\\dfrac{k}{m}+n", "x=n+\\dfrac{k}{m}"],
    ["通分した形", "x=\\dfrac{k}{m}+n", "x=\\dfrac{k+mn}{m}"],
    ["小数で書く", "x=t+\\dfrac{y}{2}", "x=t+0.5y"],
    ["定数項を先に書く", "x=6y+1", "x=1+6y"],
    ["分子分母の符号を同時に反転", "x=\\dfrac{ay}{y-a}", "x=\\dfrac{-ay}{a-y}"],
    ["left right が付く", "x=p(r-q)", "x=p\\left(r-q\\right)"],
  ];

  it.each(cases)("%s", (_name, answer, given) => {
    expect(isEquivalent(given, answer)).toBe(true);
  });
});

describe("数学的に違う答えは不正解にする", () => {
  const cases: [string, string, string][] = [
    ["分子の符号違い", "x=\\dfrac{5y-7}{3}", "x=\\dfrac{7-5y}{3}"],
    ["移項の符号違い", "x=\\dfrac{5y-7}{3}", "x=\\dfrac{5y+7}{3}"],
    ["符号違い", "a=2+3b", "a=2-3b"],
    ["分子分母の入れ替え", "x=\\dfrac{P}{4y}", "x=\\dfrac{4y}{P}"],
    ["定数項の符号違い", "x=6y+1", "x=6y-1"],
    ["割る順序の誤り", "x=\\dfrac{k}{m}+n", "x=\\dfrac{k+n}{m}"],
    ["係数を落とした", "h=\\dfrac{3V}{S}", "h=\\dfrac{V}{S}"],
    ["解けていない（右辺に x が残る）", "x=6y+1", "x=2x-6y-1"],
  ];

  it.each(cases)("%s", (_name, answer, given) => {
    expect(isEquivalent(given, answer)).toBe(false);
  });
});

describe("円周率", () => {
  it("π は変数ではなく定数として扱う", () => {
    expect(isEquivalent("r=\\frac{L}{2\\pi}", "r=\\dfrac{L}{2\\pi}")).toBe(true);
    expect(isEquivalent("r=0.5\\cdot\\frac{L}{\\pi}", "r=\\dfrac{L}{2\\pi}")).toBe(true);
    expect(isEquivalent("r=\\frac{L}{2p}", "r=\\dfrac{L}{2\\pi}")).toBe(false);
    expect(isEquivalent("r=\\frac{L}{\\pi}", "r=\\dfrac{L}{2\\pi}")).toBe(false);
  });

  it("π を含む式でも指数を読める", () => {
    expect(isEquivalent("h=\\frac{V}{\\pi r^2}", "h=\\dfrac{V}{\\pi r^{2}}")).toBe(true);
    expect(isEquivalent("h=\\frac{V}{\\pi r}", "h=\\dfrac{V}{\\pi r^{2}}")).toBe(false);
  });
});

describe("左辺の扱い", () => {
  it("x= を書かなければ不正解にする", () => {
    expect(compareAnswers("\\dfrac{5y-7}{3}", "x=\\dfrac{5y-7}{3}").kind).not.toBe("equivalent");
  });

  it("違う文字について解いていれば wrong-subject を返す", () => {
    const result = compareAnswers("y=\\dfrac{5y-7}{3}", "x=\\dfrac{5y-7}{3}");
    expect(result).toEqual({ kind: "wrong-subject", expected: "x" });
  });

  it("大文字と小文字は別の変数として扱う", () => {
    expect(compareAnswers("X=\\dfrac{5y-7}{3}", "x=\\dfrac{5y-7}{3}").kind).toBe("wrong-subject");
  });
});

describe("読めない入力", () => {
  it("空文字は unparsable を返す", () => {
    expect(compareAnswers("", "x=\\dfrac{5y-7}{3}").kind).toBe("unparsable");
  });

  it("等号が無い入力は unparsable を返す", () => {
    expect(compareAnswers("5y-7", "x=\\dfrac{5y-7}{3}").kind).toBe("unparsable");
  });

  it("知らない命令が入っていれば unparsable を返す", () => {
    expect(compareAnswers("x=\\sqrt{5y-7}", "x=\\dfrac{5y-7}{3}").kind).toBe("unparsable");
  });

  it("書きかけの数式は unparsable を返す", () => {
    expect(compareAnswers("x=\\dfrac{5y-7}{", "x=\\dfrac{5y-7}{3}").kind).toBe("unparsable");
  });
});

describe("同じ解答は何度採点しても同じ結果になる", () => {
  it("10回続けて判定しても揺れない", () => {
    const results = Array.from({ length: 10 }, () =>
      compareAnswers("x=n+\\dfrac{k}{m}", "x=\\dfrac{k}{m}+n").kind
    );
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe("equivalent");
  });
});

describe("問題バンク20問の点検", () => {
  it("すべての問題の正解が式として読め、左辺が変数1文字である", () => {
    const broken = questions
      .map((question) => ({ id: question.id, parsed: parseEquation(question.answer) }))
      .filter(({ parsed }) => !parsed || parsed.lhsVariable === null)
      .map(({ id }) => id);
    expect(broken).toEqual([]);
  });

  it("正解そのものを入力すれば必ず正解になる", () => {
    const failed = questions
      .filter((question) => !isEquivalent(question.answer, question.answer))
      .map((question) => question.id);
    expect(failed).toEqual([]);
  });

  it("選択肢は4つで、正解をちょうど1つ含む", () => {
    for (const question of questions) {
      expect(question.choices).toHaveLength(4);
      expect(question.choices.filter((c) => c === question.answer)).toHaveLength(1);
    }
  });

  it("4つの選択肢は値としてすべて異なる（当てずっぽうで2つ当たらない）", () => {
    const duplicated = questions
      .map((question) => {
        const pairs: string[] = [];
        for (let i = 0; i < question.choices.length; i += 1) {
          for (let j = i + 1; j < question.choices.length; j += 1) {
            if (isEquivalent(question.choices[i], question.choices[j])) {
              pairs.push(`Q${question.id}: ${question.choices[i]} = ${question.choices[j]}`);
            }
          }
        }
        return pairs;
      })
      .flat();
    expect(duplicated).toEqual([]);
  });

  it("誤答の選択肢を入力すれば必ず不正解になる", () => {
    const leaked = questions
      .flatMap((question) =>
        question.choices
          .filter((choice) => choice !== question.answer)
          .map((choice) => ({ id: question.id, choice, answer: question.answer }))
      )
      .filter(({ choice, answer }) => isEquivalent(choice, answer));
    expect(leaked).toEqual([]);
  });
});
