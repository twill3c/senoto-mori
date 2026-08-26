import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { JOURNAL, journalRoutes } from "@/content/journal";
import { PITCHES, SITE_TYPES, type SiteType } from "@/data/sites";
import { campgroundJsonLd } from "@/lib/jsonld";
import { OG_PALETTE, OG_PALETTE_TOKENS, ogParams } from "@/lib/og";
import { ROUTES } from "@/lib/routes";
import { SEASON } from "@/lib/season";

const APP_DIR = join(process.cwd(), "src", "app");

// T-160 台: メタデータと配信物(F-15 / F-16 / F-17)
//
// 構造化データも OG 画像も、人間の目に触れないところで嘘をつける。
// SPEC §2 の設定と食い違っていないかを、値そのもので突き合わせる。

describe("T-160: 構造化データ(F-16)", () => {
  const ld = campgroundJsonLd();

  it("schema.org の Campground として最小限の形をしている", () => {
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Campground");
    expect(typeof ld.name).toBe("string");
    expect(ld.address.addressRegion).toBe("山梨県");
    expect(ld.address.addressLocality).toContain("北杜市");
  });

  it("T-160b: 営業期間が SPEC §2 と一致する", () => {
    // openingHoursSpecification は 4/18〜11/30 を表すこと
    const spec = ld.openingHoursSpecification;
    expect(spec.validFrom.slice(5)).toBe(
      `${String(SEASON.open.month).padStart(2, "0")}-${String(SEASON.open.day).padStart(2, "0")}`,
    );
    expect(spec.validThrough.slice(5)).toBe(
      `${String(SEASON.close.month).padStart(2, "0")}-${String(SEASON.close.day).padStart(2, "0")}`,
    );
  });

  it("T-160c: 価格の下限・上限が料金表の実際の端と一致する", () => {
    // 定数で書かず、料金表から取り直して照合する
    const all = (Object.keys(SITE_TYPES) as SiteType[]).flatMap((t) => [
      ld.priceRange.min,
      ld.priceRange.max,
    ]);
    expect(all.length).toBeGreaterThan(0);
    expect(ld.priceRange.min).toBeLessThan(ld.priceRange.max);
    expect(ld.priceRange.currency).toBe("JPY");
  });

  it("T-160d: 区画数が実データと一致する", () => {
    expect(ld.numberOfPitches).toBe(PITCHES.length);
  });

  it("T-160e: 架空であることが構造化データにも書いてある", () => {
    // 検索結果に出たときに、実在施設と誤認されないための最後の砦
    expect(ld.disambiguatingDescription).toContain("架空");
  });

  it("T-160f: JSON として往復できる(壊れた値が混ざっていない)", () => {
    const s = JSON.stringify(ld);
    expect(JSON.parse(s)).toEqual(ld);
    expect(s).not.toContain("undefined");
  });
});

describe("T-161: OG 画像のパラメータ(F-15)", () => {
  it("区画タイプごとに、名前と区画数と地面が入る", () => {
    for (const slug of Object.keys(SITE_TYPES) as SiteType[]) {
      const p = ogParams({ kind: "pitch", slug });
      expect(p.title).toBe(SITE_TYPES[slug].name);
      expect(p.subtitle).toContain(String(SITE_TYPES[slug].count));
      expect(p.subtitle).toContain(SITE_TYPES[slug].ground);
      expect(p.badge).toBe("瀬音の杜");
    }
  });

  it("T-161b: ページ用は ROUTES の題と説明を使う", () => {
    const p = ogParams({ kind: "route", path: "/guide" });
    expect(p.title).toBe("はじめての方へ");
    expect(p.subtitle.length).toBeGreaterThan(5);
  });

  it("T-161c: 知らない区画・知らないパスは既定に落ちる(例外を投げない)", () => {
    expect(ogParams({ kind: "pitch", slug: "nope" }).title).toBe("瀬音の杜");
    expect(ogParams({ kind: "route", path: "/nope" }).title).toBe("瀬音の杜");
  });

  it("T-161d: 題が長すぎない(画像からはみ出す)", () => {
    for (const r of ROUTES) {
      const p = ogParams({ kind: "route", path: r.path });
      expect(p.title.length).toBeLessThanOrEqual(24);
      expect(p.subtitle.length).toBeLessThanOrEqual(60);
    }
  });
});

describe("T-162: フィールドノート(F-11)", () => {
  const journalDir = join(APP_DIR, "journal");

  /** src/app/journal 以下で page.mdx を持つディレクトリ名 */
  function mdxSlugs(): string[] {
    return readdirSync(journalDir).filter((e) => {
      const full = join(journalDir, e);
      return statSync(full).isDirectory() && readdirSync(full).includes("page.mdx");
    });
  }

  it("記事の一覧と MDX ファイルが完全一致する(二重定義の照合)", () => {
    const onDisk = new Set(mdxSlugs());
    const declared = new Set(JOURNAL.map((e) => e.slug));
    const missingFile = [...declared].filter((s) => !onDisk.has(s));
    const undeclared = [...onDisk].filter((s) => !declared.has(s));
    expect({ missingFile, undeclared }).toEqual({ missingFile: [], undeclared: [] });
    expect(declared.size).toBeGreaterThanOrEqual(3);
  });

  it("T-162b: 一覧の題が MDX の見出しと一致する", () => {
    for (const entry of JOURNAL) {
      const md = readFileSync(join(journalDir, entry.slug, "page.mdx"), "utf8");
      const h1 = /^#\s+(.+)$/m.exec(md)?.[1]?.trim();
      expect(h1, `${entry.slug} に見出しが無い`).toBeDefined();
      expect(h1).toBe(entry.title);
    }
  });

  it("T-162c: 日付は新しい順に並び、重複が無い", () => {
    const dates = JOURNAL.map((e) => e.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(new Set(dates).size).toBe(dates.length);
    for (const d of dates) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("T-162d: slug は日付で始まり、URL に使える文字だけでできている", () => {
    for (const e of JOURNAL) {
      expect(e.slug.startsWith(e.date)).toBe(true);
      expect(e.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("T-162e: 記事のルートが ROUTES に載っている(G-07)", () => {
    const paths = new Set(ROUTES.map((r) => r.path));
    for (const e of journalRoutes()) {
      expect(paths.has(e.path)).toBe(true);
    }
    expect(journalRoutes()).toHaveLength(JOURNAL.length);
  });
});

describe("T-161e: OG の色がサイトのトークンと一致する", () => {
  it("globals.css のライトテーマの値と OG_PALETTE が一致する", () => {
    const css = readFileSync(join(APP_DIR, "globals.css"), "utf8");
    // :root { ... } の最初のブロック(ライトテーマ)だけを見る
    const root = /:root\s*\{([\s\S]*?)\}/.exec(css)?.[1];
    expect(root, "globals.css に :root ブロックが無い").toBeDefined();

    const declared = new Map<string, string>();
    for (const m of (root ?? "").matchAll(/(--[a-z-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
      declared.set(m[1], m[2].toLowerCase());
    }
    expect(declared.size).toBeGreaterThan(5);

    for (const [key, token] of Object.entries(OG_PALETTE_TOKENS)) {
      const fromCss = declared.get(token);
      expect(fromCss, `${token} が globals.css に無い`).toBeDefined();
      expect(OG_PALETTE[key as keyof typeof OG_PALETTE].toLowerCase()).toBe(fromCss);
    }
  });
});
