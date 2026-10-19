import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Dataset } from '../types';
import { buildChoices } from './questionMode';
import textDecks from './textDecks.json';

const decks = textDecks as Record<string, { url: string; label: string; count: number }>;

function load(url: string): Dataset {
  return JSON.parse(readFileSync(join(process.cwd(), 'public', url), 'utf8'));
}

describe('読み物テキストの章ごとの問題集', () => {
  const keys = Object.keys(decks);

  it('合言葉は it-text-<単元>-<章>-ip/fe の形で、ip と fe が対になっている', () => {
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      expect(k).toMatch(/^it-text-[a-z0-9-]+-(ip|fe)$/);
      const pair = k.replace(/-(ip|fe)$/, (m) => (m === '-ip' ? '-fe' : '-ip'));
      expect(keys).toContain(pair);
    }
  });

  for (const [key, deck] of Object.entries(decks)) {
    it(`${key}: ファイルがあり、枚数が対応表と合う`, () => {
      const ds = load(deck.url);
      expect(ds.datasetId).toBe(key);
      expect(ds.cards).toHaveLength(deck.count);
      expect(new Set(ds.cards.map((c) => c.id)).size).toBe(ds.cards.length);
    });
  }

  it('ITパスポートの範囲の問題集は、基本情報まで全部の問題集に含まれ、基本情報だけの語を含まない', () => {
    for (const key of keys.filter((k) => k.endsWith('-ip'))) {
      const ip = load(decks[key].url);
      const fe = load(decks[key.replace(/-ip$/, '-fe')].url);
      const feIds = new Set(fe.cards.map((c) => c.id));
      expect(ip.cards.every((c) => feIds.has(c.id))).toBe(true);
      expect(ip.cards.some((c) => c.tags?.includes('基本情報'))).toBe(false);
      expect(ip.cards.length).toBeLessThan(fe.cards.length);
    }
  });

  // 章の語が4枚未満の問題集（2026-10-19 時点では system-development-maintenance-ip の3枚だけ）は
  // 4択にできないので、章の語を全部使った択数（3枚なら3択）になればよい
  it('どのカードでも4択が作れる（カテゴリ＝節が小さくても、同じ章の別の節から補える）', () => {
    const bad: string[] = [];
    for (const deck of Object.values(decks)) {
      const ds = load(deck.url);
      const pool = ds.cards.map((card) => ({ card, cardState: null }));
      const want = Math.min(4, ds.cards.length);
      for (const c of ds.cards) if (buildChoices(c, pool).choices.length < want) bad.push(`${ds.datasetId}/${c.answers[0]}`);
    }
    expect(bad).toEqual([]);
  });

  it('どの問題集も、選択肢が作れるだけの枚数（3枚以上）がある', () => {
    const small = Object.entries(decks).filter(([, d]) => d.count < 3).map(([k]) => k);
    expect(small).toEqual([]);
  });
});
