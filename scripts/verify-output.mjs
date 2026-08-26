// 生成物に対するゲート(G-07 / G-08 / F-13)。
// ソースではなく `next build` が吐いた HTML を読む。React は補間値の前後にコメントを
// 挟むなど独自の癖があるので、出荷される形そのものを見ないと確認したことにならない。
//   npm run build && node scripts/verify-output.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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

if (failures.length) {
  console.error(`不合格 ${failures.length} 件:\n${failures.map((l) => `  - ${l}`).join("\n")}`);
  process.exit(1);
}
console.log(`出荷 HTML ${files.length} 件 — フッタ・並び・架空注記すべて合格`);
