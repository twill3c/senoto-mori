// 生成物に対するゲート(G-01 / G-07 / G-08 / G-10 / F-13 / N-02 / N-06)。
// ソースではなく `next build` が吐いた HTML を読む。React は補間値の前後にコメントを
// 挟むなど独自の癖があるので、出荷される形そのものを見ないと確認したことにならない。
//   npm run build && node scripts/verify-output.mjs
//
// 注意: このファイルを sed / heredoc / 非 raw な Python 文字列から書き起こさないこと。
// 正規表現のバックスラッシュが一段落ち、`\b`(単語境界)がバックスペース文字になって
// 「何にも一致しない検査」が静かに出来上がる(loop_003 で踏んだ)。
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

/** `.next/server/app` の中から、あるルートの HTML を拾う */
function pageOf(files, route) {
  return files.find(
    (f) => f.endsWith(`${route}${sep}index.html`) || f.endsWith(`${sep}${route}.html`),
  );
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

// ── 全ページ共通(G-08 / F-13)
for (const f of files) {
  const html = readFileSync(f, "utf8");

  const footers = (html.match(/class="footer"/g) ?? []).length;
  if (footers !== 1) failures.push(`${f}: フッタが ${footers} 個(1 個であるべき)`);

  const pos = LABELS.map((l) => html.indexOf(l));
  if (pos.some((p) => p < 0)) {
    failures.push(`${f}: フッタの項目が欠けている(${LABELS.filter((_, i) => pos[i] < 0).join("/")})`);
  } else if (pos.join() !== [...pos].sort((a, b) => a - b).join()) {
    failures.push(`${f}: フッタの並びが規約と違う`);
  }

  if (!html.includes("架空")) failures.push(`${f}: 架空である旨の注記が無い`);
}

// ── G-01: 出荷された /stay の場内図に、区画データの ID が過不足なく載っているか。
// 区画 ID は TS を通さず src/data/sites.ts の実テキストから拾う。
// 描画経路とは別の道から取ることで、両者が独立した二つの記述になる。
const sitesSrc = readFileSync("src/data/sites.ts", "utf8");
const dataIds = new Set(
  [...sitesSrc.matchAll(/^\s*\{ id: "([A-Z]{2}-\d{2})"/gm)].map((m) => m[1]),
);
const stay = pageOf(files, "stay");
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

  for (const id of ["ground-boundary", "ground-forest", "ground-meadow", "ground-river"]) {
    if (!html.includes(`id="${id}"`)) failures.push(`/stay に地形 ${id} が無い`);
  }
  if (!html.includes("<table")) failures.push("/stay に JS 無しでも読める区画表が無い(N-06)");
}

// ── N-02: 予約フォームがキーボードと読み上げで通せる形で出荷されているか。
// 実ブラウザ無しに確かめられるのはここまでだが、「label が無い」「tabindex で順序を
// いじっている」「aria-describedby の参照先が無い」は静的に分かる。
const reserve = pageOf(files, "reserve");
if (!reserve) {
  failures.push("/reserve の出荷 HTML が見つからない");
} else {
  const html = readFileSync(reserve, "utf8");

  const labelFor = new Set([...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map((m) => m[1]));
  const controls = [...html.matchAll(/<(input|select|textarea)([^>]*)>/g)]
    .map((m) => ({ tag: m[1], attrs: m[2] }))
    .filter((c) => !/type="hidden"/.test(c.attrs));

  if (controls.length < 8) {
    failures.push(`/reserve の入力欄が ${controls.length} 個しか無い(検査が空振りしている)`);
  }
  if (labelFor.size < 8) {
    failures.push(`/reserve の label が ${labelFor.size} 個しか無い(検査が空振りしている)`);
  }
  for (const c of controls) {
    const id = /id="([^"]+)"/.exec(c.attrs)?.[1];
    if (!id) {
      failures.push(`/reserve に id の無い ${c.tag} がある(label と結び付けられない)`);
    } else if (!labelFor.has(id)) {
      failures.push(`/reserve の ${c.tag}#${id} に対応する label が無い`);
    }
    const tab = /tabindex="(-?\d+)"/.exec(c.attrs)?.[1];
    if (tab !== undefined && Number(tab) !== 0) {
      failures.push(`/reserve の ${c.tag}#${id} が tabindex="${tab}" でタブ順を乱している`);
    }
  }

  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/aria-describedby="([^"]+)"/g)) {
    for (const ref of m[1].split(/\s+/)) {
      if (!ids.has(ref)) failures.push(`/reserve の aria-describedby="${ref}" の参照先が無い`);
    }
  }

  if (!/<button[^>]*type="submit"/.test(html)) {
    failures.push("/reserve に submit ボタンが無い");
  }
  if (!html.includes("予約は成立しません")) {
    failures.push("/reserve のフォーム脇に「予約は成立しません」の注記が無い");
  }
}

if (failures.length) {
  console.error(`不合格 ${failures.length} 件:\n${failures.map((l) => `  - ${l}`).join("\n")}`);
  process.exit(1);
}
console.log(`出荷 HTML ${files.length} 件 — フッタ・並び・架空注記すべて合格`);
console.log(`/stay の場内図 — 区画 ${dataIds.size} 件が過不足なく出荷されている(G-01)`);
console.log("/reserve の申込フォーム — label / タブ順 / aria-describedby すべて合格(N-02)");
