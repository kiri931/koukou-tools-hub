// 1級実技の類題「日本の伝統色」の支給データを作る。
//
// 本番の実技は、支給された text / illust / image を指示書のとおりに A4 へ配置する課題。
// ここで作るのはその練習用の一式で、**中身はすべて書き下ろし・自作**。
// 過去問の題材（本番は別のテーマ）も文言も使っていない。
//
// 画像は Python を使わずに済ませるため、SVG を書いて macOS の qlmanage で
// PNG に焼き、sips で JPEG に変換する。ImageMagick は使わない。
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const OUT = process.argv[2] ?? "public/study/graphic-design/dento-iro";
const TMP = "/tmp/gd-jitsugi-build";

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
for (const d of ["text", "illust", "image"]) mkdirSync(join(OUT, d), { recursive: true });

// ---- text: 配置する文章。すべて書き下ろし ----
const texts = {
  "1": "日本の伝統色",
  "2": `　日本には、草木や鉱物、生き物の名を借りた色の名前が数多くある。藍（あい）、茜（あかね）、萌黄（もえぎ）、鳶色（とびいろ）。どれも、その色を作るもとになった材料や、身のまわりで見かけた色あいから名づけられたものである。
　色の名は、ただの記号ではない。「浅葱（あさぎ）」と聞けば、うすい葱の葉の色が浮かぶ。名前が、色の記憶を運んでいる。
　いま私たちが画面の上で扱う色は、数値で表される。それでも、名前を知っていると、選ぶ色の理由を言葉にできる。伝統色を覚えることは、色を語る言葉を増やすことでもある。`,
  "3": "染めと重ねの技",
  "4": `　同じ植物からでも、染める回数や媒染剤の違いで色は変わる。藍は染め重ねるほど濃くなり、薄い順に「甕覗（かめのぞき）」「浅葱」「縹（はなだ）」「紺」と呼び分けられた。
　重ねの色目は、着物の表と裏、あるいは重ねた衣の配色を指す言葉である。季節ごとに決まった組み合わせがあり、名前が付いていた。`,
  data1: `色名\t読み\t特徴
藍\tあい\t染め重ねるほど濃くなる
茜\tあかね\t根から取る、やや黄みの赤
萌黄\tもえぎ\t芽が出たばかりの若草の色
縹\tはなだ\t藍のなかほどの濃さ`,
  data2: `監修\t架空の教材制作チーム
発行\t練習用課題
制作年\t2026`,
};
for (const [name, body] of Object.entries(texts)) {
  writeFileSync(join(OUT, "text", `${name}.txt`), body + "\n", "utf8");
}

// ---- SVG を書いて PNG / JPEG に焼く ----
function svgToPng(name, svg, size) {
  const svgPath = join(TMP, `${name}.svg`);
  writeFileSync(svgPath, svg, "utf8");
  execFileSync("qlmanage", ["-t", "-s", String(size), "-o", TMP, svgPath], { stdio: "ignore" });
  return join(TMP, `${name}.svg.png`);
}

function pngToJpeg(pngPath, outPath) {
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "90", pngPath, "--out", outPath], {
    stdio: "ignore",
  });
}

/** 伝統色の色面。写真の代わりに置く画像で、トリミングの練習になるよう大きめに作る。 */
function colorField(hex, accent, label) {
  // qlmanage は指定サイズの正方形に収めて余白を足すため、**元の SVG も正方形にする**。
  // そうしないと出力に透明の帯が入り、等倍配置の練習にならない。
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" fill="${hex}"/>
  <g fill="${accent}" opacity="0.5">
    ${Array.from({ length: 18 }, (_, i) => `<circle cx="${60 + (i % 9) * 140}" cy="${140 + Math.floor(i / 9) * 420}" r="${40 + (i % 4) * 22}"/>`).join("\n    ")}
  </g>
  <g stroke="${accent}" stroke-width="6" fill="none" opacity="0.7">
    <path d="M0 900 C 300 820, 900 980, 1200 890"/>
    <path d="M0 980 C 300 900, 900 1060, 1200 970"/>
  </g>
  <text x="40" y="1140" font-family="sans-serif" font-size="46" fill="${accent}">${label}</text>
</svg>`;
}

const images = [
  ["A", "#1b3b6f", "#e8eef7", "藍 あい"],
  ["B", "#9e3d3d", "#f7e9e6", "茜 あかね"],
  ["C", "#6f8f3a", "#f2f7e6", "萌黄 もえぎ"],
  ["D", "#3f6f9e", "#e6f0f7", "縹 はなだ"],
  ["E", "#6b4a2f", "#f5ede4", "鳶 とび"],
  ["F", "#c8a45c", "#3a2d18", "山吹 やまぶき"],
];
for (const [name, hex, accent, label] of images) {
  const png = svgToPng(`image-${name}`, colorField(hex, accent, label), 1600);
  pngToJpeg(png, join(OUT, "image", `${name}.jpg`));
}

/** イラスト素材。ロゴの下敷きや作表のダミーに使う。 */
const illusts = {
  aizome: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f7f5ef"/><g fill="none" stroke="#1b3b6f" stroke-width="10"><circle cx="200" cy="200" r="120"/><circle cx="200" cy="200" r="80"/><circle cx="200" cy="200" r="40"/></g><g fill="#1b3b6f"><circle cx="200" cy="60" r="14"/><circle cx="340" cy="200" r="14"/><circle cx="200" cy="340" r="14"/><circle cx="60" cy="200" r="14"/></g></svg>`,
  asanoha: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f7f5ef"/><g stroke="#6f8f3a" stroke-width="6" fill="none">${Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => { const x = 40 + c * 80, y = 40 + r * 80; return `<path d="M${x} ${y} l40 0 l-20 34 z M${x} ${y} l0 40 l34 -20 z"/>`; }).join("")).join("")}</g></svg>`,
  seigaiha: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f7f5ef"/><g stroke="#3f6f9e" stroke-width="5" fill="none">${Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => { const x = c * 70 + (r % 2 ? 35 : 0), y = r * 60; return `<path d="M${x} ${y + 50} a40 40 0 0 1 70 0"/><path d="M${x + 12} ${y + 50} a28 28 0 0 1 46 0"/>`; }).join("")).join("")}</g></svg>`,
  kikkou: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f7f5ef"/><g stroke="#9e3d3d" stroke-width="5" fill="none">${Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => { const x = 40 + c * 78 + (r % 2 ? 39 : 0), y = 40 + r * 68; return `<path d="M${x} ${y} l34 20 l0 40 l-34 20 l-34 -20 l0 -40 z"/>`; }).join("")).join("")}</g></svg>`,
  hyou: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><rect width="640" height="640" fill="#ffffff" stroke="#1f2937" stroke-width="4"/><g stroke="#1f2937" stroke-width="3">${[160, 280, 400, 520].map((y) => `<path d="M0 ${y} H640"/>`).join("")}<path d="M220 0 V640"/></g><text x="20" y="90" font-family="sans-serif" font-size="44" fill="#1f2937">ダミーの表</text></svg>`,
  logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="200" cy="200" r="190" fill="#1b3b6f"/><circle cx="200" cy="200" r="150" fill="none" stroke="#f7f5ef" stroke-width="8"/><text x="200" y="190" text-anchor="middle" font-family="sans-serif" font-size="72" fill="#f7f5ef">伝統</text><text x="200" y="262" text-anchor="middle" font-family="sans-serif" font-size="40" fill="#f7f5ef">DENTO</text></svg>`,
};
for (const [name, svg] of Object.entries(illusts)) {
  writeFileSync(join(OUT, "illust", `${name}.svg`), svg, "utf8");
  const png = svgToPng(`illust-${name}`, svg, 1200);
  execFileSync("cp", [png, join(OUT, "illust", `${name}.png`)]);
}

console.log(JSON.stringify({ text: Object.keys(texts).length, image: images.length, illust: Object.keys(illusts).length }));
