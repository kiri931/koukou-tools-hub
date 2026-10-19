// ITパスポート・基本情報の用語集（kiriserver の ~/anki-glossary/ で作ったもの）を、
// 覚える君の「試験の用語集」で使う形に整える。
//
//   node scripts/build-exam-glossary.mjs <it-passport-full.json> <fe-full.json> <ITパスポートシラバス.txt> <基本情報シラバス.txt>
//   （シラバスは IPA の PDF を pdftotext で文字にしたもの。現行版: IP Ver.6.5・FE Ver.9.2）
//
// 出力:
//   public/tools/exam-glossary/it-passport.json, fe.json   … 全カード（優先度タグ付き）
//   src/features/anki/lib/examGlossaryCounts.json          … 中分類×優先度の枚数（画面に枚数を先に出すため）
//
// 優先度は「どの資料に載っていた語か」で決める。過去問の出題回数は使っていない
// （公開問題はほぼ画像PDFで、全カードの出題回数を数える材料がないため）。
//   A … 現行シラバスの用語例
//   B … シラバス本文・公開問題にだけ出てくる語（タグ「本文・過去問から追加」）
//   C … 現行シラバスから消えた語（タグ「旧シラバス」で、いまのシラバスの本文にも出てこない語）
//       タグ「旧シラバス」でも、いまのシラバスの本文に語が出てくるものは B にする
//       （2026-10-19 実測: IP 84枚中55枚・FE 391枚中120枚が、いまのシラバスにも載っていた。DDoS攻撃・DLP・AES など）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [ipPath, fePath, ipSyllabusPath, feSyllabusPath] = process.argv.slice(2);
if (!ipPath || !fePath || !ipSyllabusPath || !feSyllabusPath) {
  console.error('使い方: node scripts/build-exam-glossary.mjs <it-passport-full.json> <fe-full.json> <IPシラバス.txt> <FEシラバス.txt>');
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

// 空白を除き、全角半角と大文字小文字をそろえる（PDF の文字起こしは改行や空白が途中に入る）
const flat = (s) => s.normalize('NFKC').replace(/\s/g, '').toLowerCase();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 語がシラバスの文に出てくるか。英数字だけの語は前後が英数字でない所に限る（AI が MAIL に当たらないように）。
// 日本語を含む語は3文字以上に限る（2文字だと「処理」「情報」のような一般語が、別の文脈で当たってしまう）
function inSyllabus(text, answers) {
  return answers.some((a) => {
    const w = flat(a);
    if (/^[a-z0-9]+$/.test(w)) return w.length >= 2 && new RegExp(`(?<![a-z0-9])${escapeRe(w)}(?![a-z0-9])`).test(text);
    return w.length >= 3 && text.includes(w);
  });
}

// シラバスの「用語例」の欄だけを抜き出す。「用語例」で始まる行から、空行・次の項目（(1)・・・【・活用例）の手前まで
function termExamples(raw) {
  const out = [];
  let on = false;
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (/^用語例\s/.test(t)) { on = true; out.push(t.replace(/^用語例\s*/, '')); continue; }
    if (!on) continue;
    if (t === '' || /^(\(\d+\)|・|【|活用例|用語例|\d+\.)/.test(t)) { on = false; continue; }
    out.push(t);
  }
  return flat(out.join(''));
}

function priorityOf(tags, answers, syllabus) {
  if (tags.includes(FLAG_EXTRA)) return 'B';
  if (tags.includes(FLAG_OLD)) return inSyllabus(syllabus, answers) ? 'B' : 'C';
  return 'A';
}

// 元の用語集では、ITパスポートのシラバスに載っている語（機密性・ISMS・ランサムウェアなど）の一部が
// 基本情報のファイルにしか入っていなかった（2026-10-19 実測: 408枚）。基本情報のカードのうち、
// ITパスポートのシラバスに語が出てくるものを、ITパスポートの用語集にも入れる。
// 優先度は、用語例の欄にあれば A、本文にだけあれば B
const FLAG_FROM_IP_SYLLABUS = 'ITパスポートのシラバスから追加';
const ipRaw = readFileSync(ipSyllabusPath, 'utf8');
const ipFlat = flat(ipRaw);
const ipExamples = termExamples(ipRaw);
const ipData = JSON.parse(readFileSync(ipPath, 'utf8'));
const feData = JSON.parse(readFileSync(fePath, 'utf8'));
const ipIds = new Set(ipData.cards.map((c) => c.id));
const addedToIp = feData.cards
  .filter((c) => !ipIds.has(c.id) && inSyllabus(ipFlat, c.answers))
  .map((c) => ({
    ...c,
    tags: [FLAG_FROM_IP_SYLLABUS, ...(c.tags ?? []).filter((t) => t === FLAG_UNSURE)],
    priority: inSyllabus(ipExamples, c.answers) ? 'A' : 'B',
  }));
ipData.cards = [...ipData.cards, ...addedToIp];
console.log(`ITパスポートに基本情報のカードを足す: ${addedToIp.length}枚（用語例 A ${addedToIp.filter((c) => c.priority === 'A').length}・本文 B ${addedToIp.filter((c) => c.priority === 'B').length}）`);

const exams = [
  { key: 'it-passport', data: ipData, syllabus: ipSyllabusPath, title: 'ITパスポート 用語集' },
  { key: 'fe', data: feData, syllabus: feSyllabusPath, title: '基本情報技術者 用語集' },
];

const counts = {};
const errors = [];

for (const exam of exams) {
  const data = exam.data;
  const syllabus = flat(readFileSync(exam.syllabus, 'utf8'));
  let oldButCurrent = 0;
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
    const priority = card.priority ?? priorityOf(srcTags, card.answers, syllabus);
    if (srcTags.includes(FLAG_OLD) && priority === 'B') oldButCurrent += 1;
    const unsure = srcTags.includes(FLAG_UNSURE);
    // 大分類のタグは捨てる（数件が topic と食い違っていた）。大分類は topic から引く
    const flags = [FLAG_EXTRA, FLAG_OLD, FLAG_FROM_IP_SYLLABUS, FLAG_UNSURE].filter((t) => srcTags.includes(t));

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
  console.log(`${exam.key}: ${cards.length}枚 → ${outPath}（旧シラバスのタグだが現行シラバスにある語 ${oldButCurrent}枚を B に）`);
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
