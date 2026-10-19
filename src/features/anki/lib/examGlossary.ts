import type { Card, Dataset } from '../types';
import counts from './examGlossaryCounts.json';

// ITパスポート・基本情報の用語集（public/tools/exam-glossary/*.json）を、
// 分野と優先度で切り出して1つのデータセットにする。
// 覚える君は「データセット1つずつ」学習するので、切り出したものを別のデータセットとして入れる。
//
// 分野はカードの topic（シラバスの中分類）だけを手がかりにし、大分類・3つの系は下の表から引く。
// 元データの大分類タグは数件 topic と食い違っていたので使わない。

export type ExamKey = 'it-passport' | 'fe';
export type Priority = 'A' | 'B' | 'C';

export const EXAMS: Array<{ key: ExamKey; label: string; short: string; path: string }> = [
  { key: 'it-passport', label: 'ITパスポート', short: 'ITパスポート', path: '/tools/exam-glossary/it-passport.json' },
  { key: 'fe', label: '基本情報技術者', short: '基本情報', path: '/tools/exam-glossary/fe.json' },
];

export const PRIORITIES: Array<{ key: Priority; label: string; detail: string }> = [
  { key: 'A', label: '優先度A', detail: '現行シラバスの用語例' },
  { key: 'B', label: '優先度B', detail: 'シラバス本文・過去問にだけ出る語' },
  { key: 'C', label: '優先度C', detail: '旧シラバスにだけある語' },
];

// IPA の出題範囲（共通キャリア・スキルフレームワーク）の 系 > 大分類 > 中分類
export const TAXONOMY: Array<{
  slug: string;
  name: string;
  dai: Array<{ slug: string; name: string; chu: Array<{ slug: string; name: string }> }>;
}> = [
  {
    slug: 'strategy',
    name: 'ストラテジ系',
    dai: [
      { slug: 'corp', name: '企業と法務', chu: [{ slug: 'corp-activity', name: '企業活動' }, { slug: 'law', name: '法務' }] },
      {
        slug: 'mgmt-strategy',
        name: '経営戦略',
        chu: [
          { slug: 'business-strategy', name: '経営戦略マネジメント' },
          { slug: 'tech-strategy', name: '技術戦略マネジメント' },
          { slug: 'business-industry', name: 'ビジネスインダストリ' },
        ],
      },
      {
        slug: 'sys-strategy',
        name: 'システム戦略',
        chu: [{ slug: 'sys-strategy-chu', name: 'システム戦略' }, { slug: 'sys-planning', name: 'システム企画' }],
      },
    ],
  },
  {
    slug: 'management',
    name: 'マネジメント系',
    dai: [
      { slug: 'dev-mgmt', name: 'プロジェクトマネジメント', chu: [{ slug: 'project', name: 'プロジェクトマネジメント' }] },
      {
        slug: 'service-mgmt',
        name: 'サービスマネジメント',
        chu: [{ slug: 'service', name: 'サービスマネジメント' }, { slug: 'audit', name: 'システム監査' }],
      },
    ],
  },
  {
    slug: 'technology',
    name: 'テクノロジ系',
    dai: [
      {
        slug: 'basic',
        name: '基礎理論',
        chu: [{ slug: 'theory', name: '基礎理論' }, { slug: 'algorithm', name: 'アルゴリズムとプログラミング' }],
      },
      {
        slug: 'computer',
        name: 'コンピュータシステム',
        chu: [
          { slug: 'components', name: 'コンピュータ構成要素' },
          { slug: 'sys-components', name: 'システム構成要素' },
          { slug: 'software', name: 'ソフトウェア' },
          { slug: 'hardware', name: 'ハードウェア' },
        ],
      },
      {
        slug: 'tech-elements',
        name: '技術要素',
        chu: [
          { slug: 'info-design', name: '情報デザイン' },
          { slug: 'ui', name: 'ユーザーインタフェース' },
          { slug: 'media', name: '情報メディア' },
          { slug: 'database', name: 'データベース' },
          { slug: 'network', name: 'ネットワーク' },
          { slug: 'security', name: 'セキュリティ' },
        ],
      },
      {
        slug: 'dev',
        name: '開発技術',
        chu: [{ slug: 'sys-dev', name: 'システム開発技術' }, { slug: 'sw-dev-mgmt', name: 'ソフトウェア開発管理技術' }],
      },
    ],
  },
];

export type FieldOption = {
  /** データセットIDに入る。変えると生徒の進み具合が別のデータセット扱いになるので変えない */
  slug: string;
  label: string;
  level: 'all' | 'kei' | 'dai' | 'chu';
  topics: string[];
};

function buildFieldOptions(): FieldOption[] {
  const options: FieldOption[] = [];
  const allTopics = TAXONOMY.flatMap((k) => k.dai.flatMap((d) => d.chu.map((c) => c.name)));
  options.push({ slug: 'all', label: '全分野', level: 'all', topics: allTopics });
  for (const kei of TAXONOMY) {
    options.push({
      slug: kei.slug,
      label: kei.name,
      level: 'kei',
      topics: kei.dai.flatMap((d) => d.chu.map((c) => c.name)),
    });
    for (const dai of kei.dai) {
      options.push({ slug: dai.slug, label: dai.name, level: 'dai', topics: dai.chu.map((c) => c.name) });
      // 大分類と中分類が同じ1つだけのもの（プロジェクトマネジメント）は中分類を出さない
      if (dai.chu.length === 1) continue;
      for (const chu of dai.chu) {
        options.push({ slug: chu.slug, label: chu.name, level: 'chu', topics: [chu.name] });
      }
    }
  }
  return options;
}

export const FIELD_OPTIONS = buildFieldOptions();

export type ExamSelection = {
  exam: ExamKey;
  field: string;
  priorities: Priority[];
  excludeUnsure: boolean;
};

type CountsFile = Record<ExamKey, { total: number; topics: Record<string, Record<Priority, [number, number]>> }>;

function fieldOf(slug: string): FieldOption {
  const field = FIELD_OPTIONS.find((f) => f.slug === slug);
  if (!field) throw new Error(`知らない分野です: ${slug}`);
  return field;
}

function sortedPriorities(priorities: Priority[]): Priority[] {
  return PRIORITIES.map((p) => p.key).filter((key) => priorities.includes(key));
}

/** 取り込む前に枚数を出すための集計（examGlossaryCounts.json から数える。本体は読まない） */
export function countSelection(selection: Omit<ExamSelection, 'priorities'>, priority: Priority): number {
  const topics = (counts as unknown as CountsFile)[selection.exam].topics;
  let total = 0;
  for (const topic of fieldOf(selection.field).topics) {
    const row = topics[topic]?.[priority];
    if (!row) continue;
    total += selection.excludeUnsure ? row[0] - row[1] : row[0];
  }
  return total;
}

export function countTotal(selection: ExamSelection): number {
  return selection.priorities.reduce((sum, p) => sum + countSelection(selection, p), 0);
}

export function priorityOfCard(card: Card): Priority | null {
  const tag = card.tags?.find((t) => /^優先度[ABC]$/.test(t));
  return tag ? (tag.slice(-1) as Priority) : null;
}

/**
 * 同じ選び方なら同じIDになる。取り込み直しても進み具合が続く（syncDataset で入れるため）。
 * 例: exam-fe-security-AB / exam-it-passport-all-A-checked
 */
export function selectionDatasetId(selection: ExamSelection): string {
  const prio = sortedPriorities(selection.priorities).join('');
  return `exam-${selection.exam}-${selection.field}-${prio}${selection.excludeUnsure ? '-checked' : ''}`;
}

export function selectionTitle(selection: ExamSelection): string {
  const exam = EXAMS.find((e) => e.key === selection.exam)!;
  const prio = sortedPriorities(selection.priorities).join('・');
  return `${exam.short} ${fieldOf(selection.field).label}（優先度${prio}${selection.excludeUnsure ? '・要確認を除く' : ''}）`;
}

export function buildExamDataset(source: Dataset, selection: ExamSelection): Dataset {
  if (selection.priorities.length === 0) throw new Error('優先度を1つ以上選んでください');
  const topics = new Set(fieldOf(selection.field).topics);
  const wanted = new Set(selection.priorities);
  const cards = source.cards.filter((card) => {
    if (!card.topic || !topics.has(card.topic)) return false;
    const priority = priorityOfCard(card);
    if (!priority || !wanted.has(priority)) return false;
    if (selection.excludeUnsure && card.tags?.includes('要確認')) return false;
    return true;
  });
  const prioDetail = sortedPriorities(selection.priorities)
    .map((key) => `${key}=${PRIORITIES.find((p) => p.key === key)!.detail}`)
    .join('、');
  return {
    schema: source.schema,
    datasetId: selectionDatasetId(selection),
    title: selectionTitle(selection),
    description: `IPA公開のシラバスと公開問題から集めた用語。${prioDetail}。説明文は自動生成で、「要確認」タグのカードは定義に自信がないもの。`,
    tags: [...(source.tags ?? []), fieldOf(selection.field).label],
    cards,
  };
}
