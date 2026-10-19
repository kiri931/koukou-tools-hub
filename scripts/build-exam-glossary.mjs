// ITパスポート・基本情報の用語集（kiriserver の ~/anki-glossary/ で作ったもの）を、
// 覚える君の「試験の用語集」で使う形に整える。
//
//   node scripts/build-exam-glossary.mjs <it-passport-full.json> <fe-full.json>
//
// 出力:
//   public/tools/exam-glossary/it-passport.json, fe.json   … 全カード（優先度タグ付き）
//   src/features/anki/lib/examGlossaryCounts.json          … 中分類×優先度の枚数（画面に枚数を先に出すため）
//
// 優先度は「どの資料に載っていた語か」で決める。過去問の出題回数は使っていない
// （公開問題はほぼ画像PDFで、全カードの出題回数を数える材料がないため）。
//   A … 現行シラバスの用語例
//   B … シラバス本文・公開問題にだけ出てくる語（タグ「本文・過去問から追加」）
//   C … 現行シラバスから消えた語（タグ「旧シラバス」。過去問にも出ていれば B を優先）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [ipPath, fePath] = process.argv.slice(2);
if (!ipPath || !fePath) {
  console.error('使い方: node scripts/build-exam-glossary.mjs <it-passport-full.json> <fe-full.json>');
  process.exit(2);
}

const FLAG_EXTRA = '本文・過去問から追加';
const FLAG_OLD = '旧シラバス';
const FLAG_UNSURE = '要確認';

// lib/examGlossary.ts の TAXONOMY と同じ24の中分類。ここに無い topic が来たら止める
const KNOWN_TOPICS = new Set([
  '基礎理論', 'アルゴリズムとプログラミング',
  'コンピュータ構成要素', 'システム構成要素', 'ソフトウェア', 'ハードウェア',
  '情報デザイン', 'ユーザーインタフェース', '情報メディア', 'データベース', 'ネットワーク', 'セキュリティ',
  'システム開発技術', 'ソフトウェア開発管理技術',
  'プロジェクトマネジメント',
  'サービスマネジメント', 'システム監査',
  'システム戦略', 'システム企画',
  '経営戦略マネジメント', '技術戦略マネジメント', 'ビジネスインダストリ',
  '企業活動', '法務',
]);

function priorityOf(tags) {
  if (tags.includes(FLAG_EXTRA)) return 'B';
  if (tags.includes(FLAG_OLD)) return 'C';
  return 'A';
}

const exams = [
  { key: 'it-passport', src: ipPath, title: 'ITパスポート 用語集' },
  { key: 'fe', src: fePath, title: '基本情報技術者 用語集' },
];

const counts = {};
const errors = [];

for (const exam of exams) {
  const data = JSON.parse(readFileSync(exam.src, 'utf8'));
  const seen = new Set();
  const examCounts = {};
  const cards = data.cards.map((card) => {
    const where = `${exam.key}/${card.id}`;
    if (seen.has(card.id)) errors.push(`${where}: id が重複`);
    seen.add(card.id);
    if (!KNOWN_TOPICS.has(card.topic)) errors.push(`${where}: 知らない中分類「${card.topic}」`);
    if (!card.question?.trim()) errors.push(`${where}: question が空`);
    if (!Array.isArray(card.answers) || card.answers.filter((a) => a.trim()).length === 0) {
      errors.push(`${where}: answers が空`);
    }

    const srcTags = card.tags ?? [];
    const priority = priorityOf(srcTags);
    const unsure = srcTags.includes(FLAG_UNSURE);
    // 大分類のタグは捨てる（数件が topic と食い違っていた）。大分類は topic から引く
    const flags = [FLAG_EXTRA, FLAG_OLD, FLAG_UNSURE].filter((t) => srcTags.includes(t));

    const c = (examCounts[card.topic] ??= { A: [0, 0], B: [0, 0], C: [0, 0] });
    c[priority][0] += 1;
    if (unsure) c[priority][1] += 1;

    return {
      id: card.id,
      topic: card.topic,
      question: card.question,
      answers: card.answers,
      explanation: card.explanation,
      tags: [`優先度${priority}`, ...flags],
    };
  });

  counts[exam.key] = { total: cards.length, topics: examCounts };
  const out = {
    schema: data.schema,
    datasetId: exam.key === 'fe' ? 'fe-full' : 'it-passport-full',
    title: exam.title,
    description: data.description,
    tags: data.tags,
    cards,
  };
  const outPath = join(root, 'public/tools/exam-glossary', `${exam.key}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out));
  console.log(`${exam.key}: ${cards.length}枚 → ${outPath}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

// 各優先度は [枚数, うち要確認の枚数]
writeFileSync(
  join(root, 'src/features/anki/lib/examGlossaryCounts.json'),
  `${JSON.stringify(counts, null, 1)}\n`,
);
