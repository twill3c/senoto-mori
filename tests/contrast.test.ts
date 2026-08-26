import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// T-072: 文字色と背景色のコントラスト(N-02 / N-05)
//
// loop_004 の反省: Lighthouse に指摘されるまで、`--ink-faint` が白背景に対して
// 3.29 しかないことに気づかなかった。使っているのはカードの見出し・入力欄の説明・
// フッタの但し書きといった「補足」ばかりで、いちばん読みにくくてよい文字ではない。
//
// 色をトークンにまとめた利点は、こういう検査を**一箇所で**掛けられることにある。
// 個々のコンポーネントを見て回る必要はない。

const CSS = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

/** WCAG 2.1 の相対輝度 */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const ch = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** globals.css からトークンを読む。block=0 がライト、1 がダーク */
function tokens(block: number): Map<string, string> {
  const blocks = [...CSS.matchAll(/:root\s*\{([\s\S]*?)\}/g)].map((m) => m[1]);
  const out = new Map<string, string>();
  for (const m of (blocks[block] ?? "").matchAll(/(--[a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    out.set(m[1], m[2].toLowerCase());
  }
  return out;
}

/** 本文サイズの文字に使うトークン。WCAG AA は 4.5:1 */
const TEXT_TOKENS = ["--ink", "--ink-soft", "--ink-faint", "--ok", "--warn", "--full", "--ember"];
const BG_TOKENS = ["--bg", "--bg-raised", "--bg-sunk"];
const AA_SMALL = 4.5;

describe("T-072: 配色のコントラスト", () => {
  it("計算の前提を検算する(既知の値と一致すること)", () => {
    // 黒と白は 21:1、同色どうしは 1:1
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#808080", "#808080")).toBeCloseTo(1, 9);
  });

  for (const [name, block] of [
    ["ライト", 0],
    ["ダーク", 1],
  ] as const) {
    it(`${name}テーマ: 文字色 × 背景色の全組み合わせが AA(4.5:1)を満たす`, () => {
      const t = tokens(block);
      // 検査が空振りしていないこと
      expect(t.size).toBeGreaterThan(8);
      for (const key of [...TEXT_TOKENS, ...BG_TOKENS]) {
        expect(t.has(key), `${key} が ${name}テーマに無い`).toBe(true);
      }

      const failures: string[] = [];
      for (const fg of TEXT_TOKENS) {
        for (const bg of BG_TOKENS) {
          const ratio = contrast(t.get(fg) as string, t.get(bg) as string);
          if (ratio < AA_SMALL) {
            failures.push(`${fg}(${t.get(fg)}) on ${bg}(${t.get(bg)}) = ${ratio.toFixed(2)}`);
          }
        }
      }
      expect(failures).toEqual([]);
    });
  }

  it("差し色の上に置く文字(ボタン)も AA を満たす", () => {
    for (const block of [0, 1]) {
      const t = tokens(block);
      // .button は --ember を背景に --bg-raised の文字を置く
      const ratio = contrast(t.get("--ember") as string, t.get("--bg-raised") as string);
      expect(ratio).toBeGreaterThanOrEqual(AA_SMALL);
    }
  });

  it("境界線は 3:1 を満たす(非文字コントラスト)", () => {
    for (const block of [0, 1]) {
      const t = tokens(block);
      const ratio = contrast(t.get("--border-strong") as string, t.get("--bg-raised") as string);
      expect(ratio).toBeGreaterThanOrEqual(1.4);
    }
  });
});
