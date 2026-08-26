import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

// T-071: 日本語の本文に他言語の文字が紛れ込んでいないか。
//
// 起票の経緯(loop_001): 「AC 電源オプション」が「AC 電源оп」に、
// 「トリポッド」が「трипод」になっていた。キリル文字は字形が似ていて目視で気づけず、
// 構文としては通るため型検査もテストもすり抜ける。機械にだけ見える種類の誤りなので、
// 機械に見張らせる。
//
// loop_004 の反省: 当初この検査は拡張子の**許可リスト**で対象を選んでいた。
// L4 で `.mdx` が増えたとき、リストに入っていない `.mdx` の中の実在する混入を
// 素通りさせた。ゲートは動いていたが、見る範囲がコードベースの成長に追随していなかった。
// いまは**拒否リスト**にしてあり、新しい拡張子は既定で対象に入る。
const CYRILLIC = /[Ѐ-ӿ]/;
const HANGUL = /[가-힯ᄀ-ᇿ]/;

const ROOTS = ["src", "tests", "docs", "scripts"];
const FILES = ["SPEC.md", "TEST_SPEC.md", "README.md", "AGENTS.md"];

/** テキストとして読まないもの。ここに無い拡張子はすべて走査する */
const SKIP_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".otf", ".pdf", ".zip", ".csv",
]);
const SKIP_DIR = new Set(["node_modules", ".next", "out", "coverage", ".git"]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (!SKIP_EXT.has(extname(entry).toLowerCase())) out.push(full);
  }
  return out;
}

describe("T-071: 文字種の衛生", () => {
  const targets = [
    ...ROOTS.flatMap((r) => walk(join(process.cwd(), r))),
    ...FILES.map((f) => join(process.cwd(), f)),
  ];

  it("走査対象が空でない(検査が空振りしていないこと)", () => {
    expect(targets.length).toBeGreaterThan(30);
  });

  it("T-071b: src 以下に現れる拡張子をすべて走査している", () => {
    // 許可リストで取りこぼした loop_004 の再発防止。
    // src に存在する拡張子が走査対象に一つも無ければ、その種類は見ていないということ。
    const inSrc = new Set(
      walk(join(process.cwd(), "src")).map((f) => extname(f).toLowerCase()),
    );
    const scanned = new Set(targets.map((f) => extname(f).toLowerCase()));
    const unscanned = [...inSrc].filter((e) => !scanned.has(e));
    expect(unscanned).toEqual([]);
    // 想定している主要な種類が実際に含まれていること
    for (const ext of [".ts", ".tsx", ".css", ".mdx"]) {
      expect(scanned.has(ext), `${ext} が走査対象に無い`).toBe(true);
    }
  });

  it("キリル文字・ハングルが混入していない", () => {
    const offenders: string[] = [];
    for (const f of targets) {
      // このテスト自身は判定用の文字クラスを持つので除外する
      if (f.endsWith("text-hygiene.test.ts")) continue;
      for (const [i, line] of readFileSync(f, "utf8").split(/\r?\n/).entries()) {
        if (CYRILLIC.test(line) || HANGUL.test(line)) {
          offenders.push(`${f}:${i + 1}: ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("T-071c: 制御文字が紛れ込んでいない(HC-028)", () => {
    // バックスラッシュを含むコードをシェル経由で書くと、`\b` が
    // バックスペース文字そのものになって「何にも一致しない正規表現」ができる。
    // grep では見えないので、ここで見る。
    const offenders: string[] = [];
    for (const f of targets) {
      const src = readFileSync(f, "utf8");
      for (const [i, line] of src.split(/\r?\n/).entries()) {
        for (const ch of line) {
          const code = ch.charCodeAt(0);
          if (code < 32 && ch !== "\t") {
            offenders.push(`${f}:${i + 1}: U+${code.toString(16).padStart(4, "0")}`);
            break;
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
