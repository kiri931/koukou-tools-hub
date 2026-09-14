import { useCallback, useMemo, useState } from 'react';
import { generateProblems } from '@/features/calc-drill/data/problems';
import { isAnswerCorrect } from '@/features/calc-drill/lib/grading';
import type { DrillProblem } from '@/features/calc-drill/types';
import type { ExamChoice } from '../types';

export type Judgement = { kind: 'none' } | { kind: 'correct' } | { kind: 'wrong'; answer: string };

/**
 * 選んだ級・分野の問題を出し、電卓に出ている値で答え合わせをする。
 *
 * ドリル（/tools/calc-drill/）は「押すキーを1つずつ教える」練習で、
 * こちらは「問題を見て自分で打つ」練習。検定の本番に近いのはこちら。
 * 問題そのものは同じ生成器を使うので、増やす場所は1か所で済む。
 */
export function useProblemSession(choice: ExamChoice, enabled: boolean) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000) + 1);
  const [index, setIndex] = useState(0);
  const [judgement, setJudgement] = useState<Judgement>({ kind: 'none' });
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);

  const problems = useMemo(() => {
    if (!enabled) return [];
    // 種を変えれば毎回ちがう問題になる。1テンプレートにつき1問ずつ作って混ぜる。
    const all = generateProblems(seed, 1).filter(
      (p) => p.level === choice.level && p.category === choice.category
    );
    // 並びをばらす（テンプレート順に出ると形が読めてしまう）
    let a = seed >>> 0;
    const shuffled = [...all];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      a = (a * 1664525 + 1013904223) >>> 0;
      const j = a % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [seed, choice.level, choice.category, enabled]);

  const problem: DrillProblem | null = problems[index] ?? null;

  const check = useCallback(
    (displayed: string) => {
      if (!problem || judgement.kind !== 'none') return;
      const ok = isAnswerCorrect(displayed, problem);
      setJudgement(ok ? { kind: 'correct' } : { kind: 'wrong', answer: problem.expectedAnswer });
      setAnswered((n) => n + 1);
      if (ok) setCorrect((n) => n + 1);
    },
    [problem, judgement.kind]
  );

  const next = useCallback(() => {
    setJudgement({ kind: 'none' });
    setIndex((i) => {
      if (i + 1 < problems.length) return i + 1;
      // 使い切ったら種を変えて作り直す
      setSeed(Math.floor(Math.random() * 1_000_000) + 1);
      return 0;
    });
  }, [problems.length]);

  const restart = useCallback(() => {
    setSeed(Math.floor(Math.random() * 1_000_000) + 1);
    setIndex(0);
    setJudgement({ kind: 'none' });
    setAnswered(0);
    setCorrect(0);
  }, []);

  return { problem, judgement, check, next, restart, answered, correct, total: problems.length };
}
