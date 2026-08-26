import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { KOFU_MIN_NORMALS, ELEVATION_OFFSET_C, siteMinNormals, guideTable } from "@/data/climate";
import { FOOTER_LINKS } from "@/lib/links";
import { NAV, ROUTES } from "@/lib/routes";

const APP_DIR = join(process.cwd(), "src", "app");

describe("F-07: 気温早見表", () => {
  it("甲府の平年値が 12 か月分そろっている", () => {
    // 出所: 気象庁 1991–2020 平年値(2026-08-27 取得)。src/data/climate.ts の冒頭に出典を記載
    expect(KOFU_MIN_NORMALS).toHaveLength(12);
    expect(KOFU_MIN_NORMALS[3]).toBe(8.4); // 4 月
    expect(KOFU_MIN_NORMALS[7]).toBe(23.3); // 8 月
    expect(KOFU_MIN_NORMALS[10]).toBe(5.9); // 11 月
  });

  it("T-040: 当地の値は「甲府平年値 − 設定差分」で導出される", () => {
    const derived = siteMinNormals();
    expect(derived).toHaveLength(12);
    for (let i = 0; i < 12; i++) {
      // 小数第 1 位に丸める。丸め方まで含めて導出式が正本である
      const expected = Math.round((KOFU_MIN_NORMALS[i] - ELEVATION_OFFSET_C) * 10) / 10;
      expect(derived[i]).toBe(expected);
    }
  });

  it("T-040b: 設定差分は正の値で、全月が甲府より低くなる", () => {
    expect(ELEVATION_OFFSET_C).toBeGreaterThan(0);
    const derived = siteMinNormals();
    for (let i = 0; i < 12; i++) {
      expect(derived[i]).toBeLessThan(KOFU_MIN_NORMALS[i]);
    }
  });

  it("T-041: 早見表は開場期間の 8 か月(4–11 月)だけを返す", () => {
    const rows = guideTable();
    expect(rows.map((r) => r.month)).toEqual([4, 5, 6, 7, 8, 9, 10, 11]);
    for (const r of rows) {
      expect(r.kofu).toBe(KOFU_MIN_NORMALS[r.month - 1]);
      expect(r.site).toBe(siteMinNormals()[r.month - 1]);
      expect(r.site).toBeLessThan(r.kofu);
    }
  });

  it("開場初日の 4 月の朝は氷点下近くまで下がる(設定の主張が数字と合う)", () => {
    // /guide の「4 月中旬の朝は冷える」という主張が、データ側と矛盾しないことを縛る
    const april = guideTable()[0];
    expect(april.month).toBe(4);
    expect(april.site).toBeLessThan(5);
  });
});

describe("F-14 / G-08: フリート共通フッタ", () => {
  it("T-050: 5 件・並び・全 https・ラベル非空", () => {
    expect(FOOTER_LINKS.map((l) => l.label)).toEqual([
      "MIT License",
      "GitHub",
      "瀬音の杜の歩き方",
      "瀬音の杜 設計図",
      "App Menu",
    ]);
    for (const l of FOOTER_LINKS) {
      expect(l.href).toMatch(/^https:\/\//);
      expect(l.label.length).toBeGreaterThan(0);
    }
    expect(FOOTER_LINKS[2].href).not.toBe(FOOTER_LINKS[3].href);
  });
});

describe("G-07: 内部リンクの健全性", () => {
  /** src/app 以下から、page.tsx を持つルートのパスを実際に集める */
  function discoverRoutes(dir: string, prefix = ""): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (!statSync(full).isDirectory()) continue;
      if (entry.startsWith("_") || entry.startsWith("(")) continue;
      const segment = entry.startsWith("[") ? `:${entry.slice(1, -1)}` : entry;
      const path = `${prefix}/${segment}`;
      if (readdirSync(full).includes("page.tsx")) found.push(path);
      found.push(...discoverRoutes(full, path));
    }
    return found;
  }

  it("T-060: ROUTES の宣言と実在する page.tsx が完全一致する", () => {
    const onDisk = new Set(discoverRoutes(APP_DIR));
    if (readdirSync(APP_DIR).includes("page.tsx")) onDisk.add("/");
    const declared = new Set(ROUTES.map((r) => r.path));

    const missingFile = [...declared].filter((p) => !onDisk.has(p));
    const undeclared = [...onDisk].filter((p) => !declared.has(p));
    expect({ missingFile, undeclared }).toEqual({ missingFile: [], undeclared: [] });
  });

  it("T-060b: NAV の href は全て ROUTES に存在する", () => {
    const declared = new Set(ROUTES.map((r) => r.path));
    for (const item of NAV) {
      expect(declared.has(item.href)).toBe(true);
    }
  });

  it("ROUTES のパスと title は一意", () => {
    expect(new Set(ROUTES.map((r) => r.path)).size).toBe(ROUTES.length);
    expect(new Set(ROUTES.map((r) => r.title)).size).toBe(ROUTES.length);
  });
});

describe("G-09: 色はトークン経由のみ", () => {
  function walk(dir: string, ext: string[]): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...walk(full, ext));
      else if (ext.some((e) => entry.endsWith(e))) out.push(full);
    }
    return out;
  }

  it("T-070: tsx / module.css に生の色リテラルが無い", () => {
    const files = [
      ...walk(join(process.cwd(), "src", "app"), [".tsx"]),
      ...walk(join(process.cwd(), "src", "components"), [".tsx", ".css"]),
    ];
    // globals.css だけがトークンの定義場所。それ以外に色値があってはならない
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const [i, line] of src.split(/\r?\n/).entries()) {
        if (/#[0-9a-fA-F]{3,8}\b/.test(line) || /\b(rgb|rgba|hsl|hsla)\(/.test(line)) {
          offenders.push(`${f}:${i + 1}: ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("globals.css がライトとダークの両方でトークンを定義している", () => {
    const css = readFileSync(join(APP_DIR, "globals.css"), "utf8");
    expect(css).toMatch(/:root\s*\{/);
    expect(css).toMatch(/prefers-color-scheme:\s*dark/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/); // N-03
  });
});

describe("F-13: 架空である旨の明示", () => {
  it("フッタ・/about・/reserve の 3 箇所に注記がある", () => {
    const notice = "架空";
    const targets = [
      join(process.cwd(), "src", "components", "SiteFooter.tsx"),
      join(APP_DIR, "about", "page.tsx"),
      join(APP_DIR, "reserve", "page.tsx"),
    ];
    for (const t of targets) {
      expect(readFileSync(t, "utf8")).toContain(notice);
    }
  });
});
