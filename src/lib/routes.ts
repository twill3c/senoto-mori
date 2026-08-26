import { journalRoutes } from "@/content/journal";

// サイトのページ一覧(G-07)。ここが唯一の正本で、ナビも sitemap もここを読む。
// テスト T-060 が、この宣言と src/app 以下に実在する page.tsx を突き合わせる。

export interface Route {
  path: string;
  title: string;
  /** ページ冒頭とメタ description に使う一文 */
  lede: string;
  /** 大分類。ナビのまとまり */
  group: "top" | "stay" | "play" | "plan" | "about";
}

const STATIC_ROUTES: readonly Route[] = [
  {
    path: "/",
    title: "瀬音の杜",
    lede: "八ヶ岳南麓・標高 1,050 m。渓流沿いの森と草原に 40 区画のキャンプフィールド。",
    group: "top",
  },
  {
    path: "/stay",
    title: "泊まる",
    lede: "40 区画を場内図の上で選べます。川沿いか、木陰か、草原か。",
    group: "stay",
  },
  {
    path: "/stay/:slug",
    title: "区画の詳細",
    lede: "区画タイプごとの地面・広さ・向き・弱点。",
    group: "stay",
  },
  {
    path: "/play",
    title: "遊ぶ",
    lede: "渓流釣り・マウンテンバイク・石窯ピザ・ブッシュクラフトの四つ。",
    group: "play",
  },
  {
    path: "/play/keiryu",
    title: "渓流釣り",
    lede: "瀬音川の渓相と、解禁から禁漁までの付き合い方。",
    group: "play",
  },
  {
    path: "/play/mtb",
    title: "マウンテンバイク",
    lede: "場内と隣接林道に三本のトレイル。距離と獲得標高を出しています。",
    group: "play",
  },
  {
    path: "/play/pizza",
    title: "石窯ピザ",
    lede: "薪の石窯をひと組ずつ。火入れから焼き上がりまでの段取り。",
    group: "play",
  },
  {
    path: "/play/bushcraft",
    title: "ブッシュクラフト",
    lede: "焚火学舎での講習。直火を許している区画の使い方。",
    group: "play",
  },
  {
    path: "/price",
    title: "料金",
    lede: "区画料と人数料は別建て。繁忙期の判定基準まで開示しています。",
    group: "plan",
  },
  {
    path: "/guide",
    title: "はじめての方へ",
    lede: "甲府との気温差、持ち物、場内のきまり、キャンセル規定。",
    group: "plan",
  },
  {
    path: "/access",
    title: "アクセス",
    lede: "中央道と小海線から。冬季は閉場します。",
    group: "plan",
  },
  {
    path: "/reserve",
    title: "予約",
    lede: "空き状況と申し込み。※ 本サイトは架空のため予約は成立しません。",
    group: "plan",
  },
  {
    path: "/journal",
    title: "フィールドノート",
    lede: "水位、紅葉、星、閉鎖のお知らせ。場から見えたことを書いています。",
    group: "about",
  },
  {
    path: "/faq",
    title: "よくある質問",
    lede: "予約・設営・火・ペット・雨天について。",
    group: "about",
  },
  {
    path: "/preview/offseason",
    title: "閉場期間の表示",
    lede: "12 月から 4 月中旬までのトップページ。その時期を待たずに確かめられるようにしています。",
    group: "about",
  },
  {
    path: "/about",
    title: "この場について",
    lede: "架空のキャンプ場です。制作の意図と、参考にした土地のこと。",
    group: "about",
  },
] as const;

/** 静的なページに、フィールドノートの記事を足したものが正本(G-07) */
export const ROUTES: readonly Route[] = [...STATIC_ROUTES, ...journalRoutes()];

export interface NavItem {
  href: string;
  label: string;
}

/** ヘッダのナビ。動的セグメントを含むルートは出さない */
export const NAV: readonly NavItem[] = [
  { href: "/stay", label: "泊まる" },
  { href: "/play", label: "遊ぶ" },
  { href: "/price", label: "料金" },
  { href: "/guide", label: "はじめての方へ" },
  { href: "/access", label: "アクセス" },
  { href: "/journal", label: "フィールドノート" },
  { href: "/reserve", label: "予約" },
] as const;

export function routeOf(path: string): Route | undefined {
  return ROUTES.find((r) => r.path === path);
}
