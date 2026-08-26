import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

// T-071: 日本語の本文に他言語の文字が紛れ込んでいないか。
//
// 起票の経緯(loop_001): 「AC 電源オプション」が「AC 電源оп」に、
// 「トリポッド」が「трипод」になっていた。キリル文字は字形が似ていて目視で気づけず、
// 構文としては通るため型検査もテストもすり抜ける。機械にだけ見える種類の誤りなので、
// 機械に見張らせる。
const CYRILLIC = /[Ѐ-ӿ]/;
const HANGUL = /[가-힯ᄀ-ᇿ]/;

const ROOTS = ["src", "tests", "docs"];
const FILES = ["SPEC.md", "TEST_SPEC.md", "README.md"];
const EXT = new Set([".ts", ".tsx", ".css", ".md", ".mjs"]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXT.has(extname(entry))) out.push(full);
  }
  return out;
}

describe("T-071: 文字種の衛生", () => {
  const targets = [
    ...ROOTS.flatMap((r) => walk(join(process.cwd(), r))),
    ...FILES.map((f) => join(process.cwd(), f)),
  ];

  it("走査対象が空でない(検査が空振りしていないこと)", () => {
    expect(targets.length).toBeGreaterThan(20);
  });

  it("キリル文字・ハングルが混入していない", () => {
    const offenders: string[] = [];
    for (const f of targets) {
      for (const [i, line] of readFileSync(f, "utf8").split(/\r?\n/).entries()) {
        // このテスト自身は判定用の文字クラスを持つので除外する
        if (f.endsWith("text-hygiene.test.ts")) continue;
        if (CYRILLIC.test(line) || HANGUL.test(line)) {
          offenders.push(`${f}:${i + 1}: ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
