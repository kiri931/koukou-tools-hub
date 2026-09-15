/**
 * 類題テンプレートから問題を書き出して、iPadアプリ(Keisangijutsukentei)に渡すJSONを作る。
 *
 * 問題の作り方を Swift 側にもう一度書くと、必ずどちらかが古くなる。
 * 生成はここ(TypeScript)だけに置き、結果のJSONをアプリに同梱する。
 *
 *   npx vite-node scripts/export-problems.ts -- <出力先.json>
 */
import { writeFileSync } from 'node:fs';
import { CATEGORIES_BY_LEVEL, TEMPLATES } from '../src/features/calc-drill/data/templates';
import { makeRng } from '../src/features/calc-drill/data/random';
import { INPUT_TIPS } from '../src/features/calc-drill/data/inputTips';
import { parseGuideToKeySequence } from '../src/features/calc-drill/data/parseGuide';
import type { DrillLevel } from '../src/features/calc-drill/types';

/**
 * ウェブの action 名 → iPadアプリの CalculatorKey.guideToken。
 *
 * 押す順はそのまま使える。ウェブで関数キーが開くかっこは、
 * アプリの関数キーも同じように開くので、閉じかっこの位置も同じ。
 * x³ だけアプリに専用キーが無いので「^ 3」の2打に開く。
 */
const TO_IOS: Record<string, string[]> = {
  '*': ['×'], '/': ['÷'], '+': ['+'], '-': ['-'],
  '(': ['('], ')': [')'], '=': ['='], ',': [','],
  '^(': ['^', '('],
  '^2': ['x2'],
  '^3': ['^', '3'],
  'sqrt(': ['sqrt'], 'cbrt(': ['cbrt'], 'xroot(': ['xroot'],
  'pow10(': ['10^'], 'log(': ['log'], 'ln(': ['ln'], 'exp(': ['e^'],
  'sin(': ['sin'], 'cos(': ['cos'], 'tan(': ['tan'],
  'asin(': ['sin-1'], 'acos(': ['cos-1'], 'atan(': ['tan-1'],
  'abs(': ['abs'], 'inv(': ['x-1'], 'mod(': ['Mod'],
  'pol(': ['Pol'], 'rec(': ['Rec'],
  'fact(': ['n!'], 'nPr(': ['nPr'], 'nCr(': ['nCr'],
  'pi': ['π'], 'ans': ['Ans'], 'dms': ['°'], 'exp10': ['Exp'], 'neg': ['(-)'],
};

/**
 * ウェブでは「かっこを開く関数」だが、アプリでは中置キーになるもの。
 * ウェブの手順にはこの関数を閉じる `)` が入っているが、
 * アプリには閉じる相手が無いので、その `)` は落とす。
 *   ウェブ: 5 xroot( 3.57 )      アプリ: 5 ˣ√ 3.57
 */
const INFIX_IN_IOS = new Set(['xroot(', 'nPr(', 'nCr(']);

/** ウェブでもアプリでも、押すと自分のかっこを開くキー */
const OPENS_PAREN = new Set([
  '(', '^(',
  'sqrt(', 'cbrt(', 'pow10(', 'log(', 'ln(', 'exp(',
  'sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(',
  'abs(', 'pol(', 'rec(',
]);

function toIosKeys(actions: string[]): string[] {
  const out: string[] = [];
  // true = アプリ側にかっこが無い（閉じる `)` を捨てる）
  const stack: boolean[] = [];

  actions.forEach((action, i) => {
    // 指数の符号。ウェブの電卓は Exp のあとの「−」を指数の符号として受けるが、
    // 実機（とiPad版）は「−」が引き算のままなので、(−) キーに置き換える。
    if (action === '-' && actions[i - 1] === 'exp10') {
      out.push('(-)');
      return;
    }

    if (action === ')') {
      const dropped = stack.pop();
      if (dropped !== true) out.push(')');
      return;
    }

    if (action === 'mod(') {
      throw new Error('Mod はアプリでは中置キー。手順の作り直しが要る');
    }

    if (INFIX_IN_IOS.has(action)) stack.push(true);
    else if (OPENS_PAREN.has(action)) stack.push(false);

    if (TO_IOS[action]) {
      out.push(...TO_IOS[action]);
      return;
    }
    // 数値はそのまま。アプリ側のガイドは "30" のような数値トークンを
    // 1文字ずつの入力で消化できるので、桁を分けなくてよい。
    if (/^[0-9]+(\.[0-9]+)?$|^\.$/.test(action)) {
      out.push(action);
      return;
    }
    throw new Error(`iPadアプリのキーに対応が無い action: ${action}`);
  });
  return out;
}

/** 1テンプレートあたり何問作るか */
const PER_TEMPLATE = 4;
const SEED = 20260915;

const out = process.argv[2] ?? 'problems.json';
const rng = makeRng(SEED);

const problems = [];
for (const level of ['4級', '3級', '2級'] as DrillLevel[]) {
  for (const category of CATEGORIES_BY_LEVEL[level]) {
    const templates = TEMPLATES[level][category] ?? [];
    templates.forEach((template, templateIndex) => {
      for (let i = 0; i < PER_TEMPLATE; i += 1) {
        const raw = template(rng);
        problems.push({
          id: `${level}-${category}-${templateIndex}-${i}`,
          level,
          category: raw.category,
          question: raw.question,
          // 答えは丸める前の値も渡す。アプリ側で Fix/Sci の表示に使う。
          value: raw.value,
          rounding: raw.rounding,
          angleMode: (raw.angleMode ?? 'DEG').toLowerCase(),
          // 押す順。アプリの CalculatorKey.guideToken に翻訳済み
          keys: toIosKeys(parseGuideToKeySequence(raw.guide)),
        });
      }
    });
  }
}

const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: 'koukou-tools-hub/src/features/calc-drill/data/templates.ts',
  perTemplate: PER_TEMPLATE,
  seed: SEED,
  problems,
  tips: INPUT_TIPS.map((t) => ({
    id: t.id,
    title: t.title,
    levels: t.levels,
    categories: t.categories,
    written: t.written,
    naive: t.naive,
    why: t.why,
    keys: toIosKeys(t.keys),
    angleMode: (t.angleMode ?? 'DEG').toLowerCase(),
    expected: t.expected,
  })),
};

writeFileSync(out, JSON.stringify(payload, null, 1) + '\n');
console.log(`${problems.length} 問 / ${payload.tips.length} 件のコツ を ${out} に書き出した`);
