// 生成物に対するゲート(G-07 / G-08 / F-13)。
// ソースではなく `next build` が吐いた HTML を読む。React は補間値の前後にコメントを
// 挟むなど独自の癖があるので、出荷される形そのものを見ないと確認したことにならない。
//   npm run build && node scripts/verify-output.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const DIR = ".next/server/app";
const LABELS = ["MIT License", "GitHub", "瀬音の杜の歩き方", "瀬音の杜 設計図", "App Menu"];

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (e.endsWith(".html")) out.push(full);
  }
  return out;
}

let files;
try {
  files = walk(DIR);
} catch {
  console.error(`${DIR} がありません。先に npm run build を実行してください`);
  process.exit(1);
}
if (files.length === 0) {
  console.error("HTML が 1 件も見つかりません。検査が空振りしています");
  process.exit(1);
}

const failures = [];
for (const f of files) {
  const html = readFileSync(f, "utf8");

  // G-08: フッタはちょうど 1 つ
  const footers = (html.match(/class="footer"/g) ?? []).length;
  if (footers !== 1) failures.push(`${f}: フッタが ${footers} 個(1 個であるべき)`);

  // G-08: 5 項目が規定の並びで揃う
  const pos = LABELS.map((l) => html.indexOf(l));
  if (pos.some((p) => p < 0)) {
    failures.push(`${f}: フッタの項目が欠けている(${LABELS.filter((_, i) => pos[i] < 0).join("/")})`);
  } else if (pos.join() !== [...pos].sort((a, b) => a - b).join()) {
    failures.push(`${f}: フッタの並びが規約と違う`);
  }

  // F-13: 架空である旨がすべてのページに出ている
  if (!html.includes("架空")) failures.push(`${f}: 架空である旨の注記が無い`);
}

// G-01: 出荷された /stay の場内図に、区画データの ID が過不足なく載っているか。
// 区画 ID は TS を通さず src/data/sites.ts の実テキストから拾う。
// 描画経路とは別の道から取ることで、両者が独立した二つの記述になる。
const sitesSrc = readFileSync("src/data/sites.ts", "utf8");
const dataIds = new Set([...sitesSrc.matchAll(/^\s*\{ id: "([A-Z]{2}-\d{2})"/gm)].map((m) => m[1]));
const stay = files.find((f) => f.endsWith(`stay${sep}index.html`) || f.endsWith(`${sep}stay.html`));
if (!stay) {
  failures.push("/stay の出荷 HTML が見つからない");
} else if (dataIds.size === 0) {
  failures.push("src/data/sites.ts から区画 ID を 1 件も拾えなかった(検査が空振りしている)");
} else {
  const html = readFileSync(stay, "utf8");
  const inHtml = new Set([...html.matchAll(/data-site-id="([^"]+)"/g)].map((m) => m[1]));
  const missing = [...dataIds].filter((id) => !inHtml.has(id));
  const extra = [...inHtml].filter((id) => !dataIds.has(id));
  if (missing.length) failures.push(`/stay の図に無い区画: ${missing.join(",")}`);
  if (extra.length) failures.push(`区画データに無い ID が図にある: ${extra.join(",")}`);

  // 地形と、JS 無しでも読める全区画表が出荷に含まれていること(N-06)
  for (const id of ["ground-boundary", "ground-forest", "ground-meadow", "ground-river"]) {
    if (!html.includes(`id="${id}"`)) failures.push(`/stay に地形 ${id} が無い`);
  }
  if (!html.includes("<table")) failures.push("/stay に JS 無しでも読める区画表が無い(N-06)");
}

if (failures.length) {
  console.error(`不合格 ${failures.length} 件:\n${failures.map((l) => `  - ${l}`).join("\n")}`);
  process.exit(1);
}
console.log(`出荷 HTML ${files.length} 件 — フッタ・並び・架空注記すべて合格`);
console.log(`/stay の場内図 — 区画 ${dataIds.size} 件が過不足なく出荷されている(G-01)`);
