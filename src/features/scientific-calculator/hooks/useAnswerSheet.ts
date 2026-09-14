import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateProblems } from '@/features/calc-drill/data/problems';
import { isAnswerCorrect } from '@/features/calc-drill/lib/grading';
import type { DrillProblem } from '@/features/calc-drill/types';
import type { ExamChoice } from '../types';

/** 検定の1区分は10問・10分。過去問の表紙に書かれているとおり。 */
export const SHEET_QUESTION_COUNT = 10;
export const SHEET_SECONDS = 10 * 60;

export interface SheetRow {
  problem: DrillProblem;
  answer: string;
  /** 採点後だけ入る */
  correct?: boolean;
}

/**
 * 解答用紙モード。
 * 10問を一枚に並べ、答えを書き込んでから最後にまとめて採点する。
 * 1問ずつ答え合わせする problems モードとは、そこが違う。
 */
export function useAnswerSheet(choice: ExamChoice, enabled: boolean) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000) + 1);
  const [answers, setAnswers] = useState<string[]>(() => Array(SHEET_QUESTION_COUNT).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [graded, setGraded] = useState(false);
  const [remaining, setRemaining] = useState(SHEET_SECONDS);

  const problems = useMemo(() => {
    if (!enabled) return [];
    const pool = generateProblems(seed, 1).filter(
      (p) => p.level === choice.level && p.category === choice.category
    );
    let a = seed >>> 0;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      a = (a * 1664525 + 1013904223) >>> 0;
      const j = a % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, SHEET_QUESTION_COUNT);
  }, [seed, choice.level, choice.category, enabled]);

  // 残り時間。0 になったらそこで採点する（本番と同じ）
  useEffect(() => {
    if (!enabled || graded) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setGraded(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [enabled, graded]);

  const rows: SheetRow[] = problems.map((problem, i) => ({
    problem,
    answer: answers[i] ?? '',
    correct: graded ? isAnswerCorrect(answers[i] ?? '', problem) : undefined,
  }));

  const write = useCallback(
    (index: number, value: string) => {
      if (graded) return;
      setAnswers((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    },
    [graded]
  );

  /** 電卓に出ている値を、いま選んでいる問題の答えとして書き込む */
  const writeCurrent = useCallback(
    (displayed: string) => {
      if (graded) return;
      write(activeIndex, displayed);
      setActiveIndex((i) => Math.min(i + 1, Math.max(problems.length - 1, 0)));
    },
    [activeIndex, graded, problems.length, write]
  );

  const grade = useCallback(() => setGraded(true), []);

  const restart = useCallback(() => {
    setSeed(Math.floor(Math.random() * 1_000_000) + 1);
    setAnswers(Array(SHEET_QUESTION_COUNT).fill(''));
    setActiveIndex(0);
    setGraded(false);
    setRemaining(SHEET_SECONDS);
  }, []);

  const correctCount = rows.filter((r) => r.correct).length;

  return {
    rows,
    activeIndex,
    setActiveIndex,
    write,
    writeCurrent,
    grade,
    restart,
    graded,
    remaining,
    correctCount,
    total: rows.length,
    /** 10問なら1問10点。検定と同じ換算。 */
    score: rows.length > 0 ? Math.round((correctCount / rows.length) * 100) : 0,
  };
}
