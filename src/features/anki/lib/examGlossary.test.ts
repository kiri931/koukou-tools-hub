import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../types';
import {
  EXAMS,
  FIELD_OPTIONS,
  TAXONOMY,
  buildExamDataset,
  countSelection,
  countTotal,
  priorityOfCard,
  selectionDatasetId,
} from './examGlossary';

function load(key: string): Dataset {
  return JSON.parse(readFileSync(join(process.cwd(), 'public/tools/exam-glossary', `${key}.json`), 'utf8'));
}

describe('試験の用語集を分野・優先度で切り出す', () => {
  for (const exam of EXAMS) {
    const source = load(exam.key);

    it(`${exam.label}: 全カードの topic が表のどこかに入っている`, () => {
      const known = new Set(TAXONOMY.flatMap((k) => k.dai.flatMap((d) => d.chu.map((c) => c.name))));
      const unknown = source.cards.filter((c) => !c.topic || !known.has(c.topic));
      expect(unknown.map((c) => c.topic)).toEqual([]);
    });

    it(`${exam.label}: 全カードに優先度が1つ付いている`, () => {
      expect(source.cards.filter((c) => priorityOfCard(c) === null)).toEqual([]);
    });

    it(`${exam.label}: 全分野・A〜C で全カードがそろう`, () => {
      const all = buildExamDataset(source, { exam: exam.key, field: 'all', priorities: ['A', 'B', 'C'], excludeUnsure: false });
      expect(all.cards).toHaveLength(source.cards.length);
    });

    it(`${exam.label}: 画面に出す枚数と、実際に切り出した枚数が一致する`, () => {
      const bad: string[] = [];
      for (const field of FIELD_OPTIONS) {
        for (const excludeUnsure of [false, true]) {
          for (const p of ['A', 'B', 'C'] as const) {
            const sel = { exam: exam.key, field: field.slug, priorities: [p], excludeUnsure };
            const built = buildExamDataset(source, sel).cards.length;
            const shown = countSelection(sel, p);
            if (built !== shown) bad.push(`${field.label}/${p}/${excludeUnsure}: 表示${shown} 実際${built}`);
          }
        }
      }
      expect(bad).toEqual([]);
    });

    it(`${exam.label}: 系3つに分けると重ならず、足すと全分野になる`, () => {
      const kei = FIELD_OPTIONS.filter((f) => f.level === 'kei');
      const sum = kei.reduce(
        (n, f) => n + countTotal({ exam: exam.key, field: f.slug, priorities: ['A', 'B', 'C'], excludeUnsure: false }),
        0,
      );
      expect(sum).toBe(source.cards.length);
    });
  }

  it('要確認を除くと、要確認タグのカードが残らない', () => {
    const ds = buildExamDataset(load('fe'), { exam: 'fe', field: 'all', priorities: ['A', 'B', 'C'], excludeUnsure: true });
    expect(ds.cards.some((c) => c.tags?.includes('要確認'))).toBe(false);
    expect(ds.cards.length).toBeGreaterThan(0);
  });

  it('優先度の選び順が違っても同じデータセットIDになる（進み具合が分かれない）', () => {
    const a = selectionDatasetId({ exam: 'fe', field: 'security', priorities: ['B', 'A'], excludeUnsure: false });
    const b = selectionDatasetId({ exam: 'fe', field: 'security', priorities: ['A', 'B'], excludeUnsure: false });
    expect(a).toBe(b);
    expect(a).toBe('exam-fe-security-AB');
  });

  it('分野のslugが重複していない', () => {
    const slugs = FIELD_OPTIONS.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('優先度を選ばないと作らない', () => {
    expect(() => buildExamDataset(load('fe'), { exam: 'fe', field: 'all', priorities: [], excludeUnsure: false })).toThrow();
  });
});
