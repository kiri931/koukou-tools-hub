import { parseGuideToKeySequence } from './parseGuide';
import { makeRng, type Rng } from './random';
import { CATEGORIES_BY_LEVEL, TEMPLATES, type RawProblem } from './templates';
import type { DrillLevel, DrillProblem, Rounding } from '../types';

/** rounding の指示どおりに丸める。答え合わせの基準を人間と揃えるため。 */
export function roundTo(value: number, rounding?: Rounding): number {
  if (!rounding) return value;
  const f = 10 ** rounding.value;
  switch (rounding.kind) {
    case 'decimals':
      return Math.round(value * f) / f;
    case 'ceil':
      // 不等式で「範囲に収まるように切り上げる」ための丸め
      return Math.ceil(value * f) / f;
    case 'floor':
      return Math.floor(value * f) / f;
    case 'sigfigs': {
      if (value === 0) return 0;
      const digits = rounding.value - 1 - Math.floor(Math.log10(Math.abs(value)));
      const g = 10 ** digits;
      return Math.round(value * g) / g;
    }
  }
}

function formatAnswer(value: number, rounding: Rounding): string {
  const rounded = roundTo(value, rounding);
  if (rounding.kind === 'sigfigs') return String(rounded);
  return rounded.toFixed(rounding.value);
}

function toDrillProblem(raw: RawProblem, level: DrillLevel, id: string): DrillProblem {
  return {
    id,
    level,
    category: raw.category,
    question: raw.question,
    expectedAnswer: formatAnswer(raw.value, raw.rounding),
    keySequence: parseGuideToKeySequence(raw.guide),
    angleMode: raw.angleMode ?? 'DEG',
    rounding: raw.rounding,
  };
}

/**
 * 類題を作る。過去問そのものは持たず、同じ形の問題をその場で作る。
 *
 * 同じ種を渡せば必ず同じ問題が出るので、テストで再現できる。
 * 画面では毎回ちがう種を使うため、生徒は毎回ちがう問題を解く。
 */
export function generateProblems(seed: number, perTemplate = 2): DrillProblem[] {
  const rng: Rng = makeRng(seed);
  const problems: DrillProblem[] = [];

  for (const level of ['4級', '3級', '2級'] as const) {
    for (const category of CATEGORIES_BY_LEVEL[level]) {
      const templates = TEMPLATES[level][category] ?? [];
      templates.forEach((template, templateIndex) => {
        for (let i = 0; i < perTemplate; i += 1) {
          const raw = template(rng);
          problems.push(
            toDrillProblem(raw, level, `${level}-${category}-${templateIndex}-${i}`)
          );
        }
      });
    }
  }

  return problems;
}
