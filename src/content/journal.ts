// フィールドノートの一覧(F-11)。
//
// 記事そのものは src/app/journal/<slug>/page.mdx にある。この一覧はそれとは
// **独立した第二の記述**で、両者が食い違わないことを T-162 が検査している
// (集合の一致と、題が MDX の見出しと一致すること)。
// 一覧を MDX から自動生成すると、その照合は何も検証しなくなる。

import type { Route } from "@/lib/routes";

export interface JournalEntry {
  /** 日付で始まる。URL にそのまま出る */
  slug: string;
  date: string;
  title: string;
  /** 一覧に出す一文 */
  lede: string;
}

/** 新しい順 */
export const JOURNAL: readonly JournalEntry[] = [
  {
    slug: "2026-08-24-kawa-ga-nigotte-imasu",
    date: "2026-08-24",
    title: "川が濁っています",
    lede: "22 日の雨で増水し、まだ濁りが残っています。岸の階段の下二段が水に浸かっています。",
  },
  {
    slug: "2026-08-18-matsumushiso",
    date: "2026-08-18",
    title: "草原のマツムシソウが咲きました",
    lede: "陽だまりサイトの北側で咲き始めています。例年より一週間ほど早い開花です。",
  },
  {
    slug: "2026-08-11-ishigama-no-hidoko",
    date: "2026-08-11",
    title: "石窯の火床を積み直しました",
    lede: "耐火煉瓦が浮いてきたため組み直しました。焼き上がりが少し早くなっています。",
  },
  {
    slug: "2026-07-29-onegoe-no-touboku",
    date: "2026-07-29",
    title: "尾根越えの倒木を片づけました",
    lede: "上級コースの中間で道をふさいでいたミズナラを処理しました。通れます。",
  },
  {
    slug: "2026-06-15-sawa-no-hotaru",
    date: "2026-06-15",
    title: "沢のホタルが出はじめました",
    lede: "瀬音サイトの下流、支流の合流点あたりです。灯りを消して待ってください。",
  },
] as const;

export function findEntry(slug: string): JournalEntry | undefined {
  return JOURNAL.find((e) => e.slug === slug);
}

/** ROUTES に混ぜるための形。G-07 の照合対象に記事も入る */
export function journalRoutes(): Route[] {
  return JOURNAL.map((e) => ({
    path: `/journal/${e.slug}`,
    title: e.title,
    lede: e.lede,
    group: "about" as const,
  }));
}
