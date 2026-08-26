// data/syukujitsu.csv(内閣府「国民の祝日」原本・Shift_JIS)から
// src/data/holidays.ts を生成する。要約や記憶を経由させないための経路。
//   node scripts/gen-holidays.mjs
import { readFileSync, writeFileSync } from "node:fs";

const RAW = "data/syukujitsu.csv";
const OUT = "src/data/holidays.ts";
const SOURCE = "https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv";
const FETCHED = "2026-08-27";

const text = new TextDecoder("shift_jis").decode(readFileSync(RAW));
const rows = [];
for (const line of text.split(/\r?\n/).slice(1)) {
  if (!line.trim()) continue;
  const [date, name] = line.split(",");
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(date.trim());
  if (!m) throw new Error(`日付の形が想定外: ${line}`);
  const iso = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  rows.push([iso, name.trim()]);
}
if (rows.length < 1000) throw new Error(`行数が少なすぎる(${rows.length})。原本の取得を確認せよ`);

const body = rows.map(([iso, name]) => `  ["${iso}", "${name}"],`).join("\n");
writeFileSync(
  OUT,
  `// 自動生成 — 手で編集しない。生成元: ${RAW}(${SOURCE} を ${FETCHED} に取得)
// 再生成: node scripts/gen-holidays.mjs
//
// 繁忙期の「祝前日」判定に使う(SPEC §2.2)。要約や記憶からではなく、
// 内閣府の配布 CSV そのものから機械で起こしている。

export const HOLIDAYS: ReadonlyMap<string, string> = new Map([
${body}
]);

export function isHoliday(dateISO: string): boolean {
  return HOLIDAYS.has(dateISO);
}
`,
  "utf8",
);
console.log(`${OUT} ← ${rows.length} 件`);
