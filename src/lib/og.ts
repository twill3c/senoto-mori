// OG 画像の中身(F-15)。画像そのものは src/app/og/route.tsx が next/og で描く。
//
// 何を書くかだけをここに切り出してある。画像生成は実行環境が要るので単体テストしにくいが、
// 「何が書かれるか」は純関数として確かめられる。題が長すぎて画像からはみ出す、といった
// 実際に起きる壊れ方は、ここで縛れる。

import { SITE_TYPES, type SiteType } from "@/data/sites";
import { routeOf } from "@/lib/routes";

export interface OgParams {
  title: string;
  subtitle: string;
  badge: string;
}

export const OG_SIZE = { width: 1200, height: 630 } as const;

const FALLBACK: OgParams = {
  title: "瀬音の杜",
  subtitle: "八ヶ岳南麓 渓流キャンプフィールド",
  badge: "瀬音の杜",
};

/** 画像に載せられる長さに詰める。切るより、そもそも収まる文言を選ぶほうがよい */
function clip(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export type OgRequest =
  | { kind: "pitch"; slug: string }
  | { kind: "route"; path: string };

export function ogParams(req: OgRequest): OgParams {
  if (req.kind === "pitch") {
    const meta = SITE_TYPES[req.slug as SiteType];
    if (!meta) return FALLBACK;
    return {
      title: clip(meta.name, 24),
      subtitle: clip(`${meta.count} 区画 ／ ${meta.ground}`, 60),
      badge: "瀬音の杜",
    };
  }

  const route = routeOf(req.path);
  if (!route || req.path === "/") return FALLBACK;
  return {
    title: clip(route.title, 24),
    subtitle: clip(route.lede, 60),
    badge: "瀬音の杜",
  };
}

/** ページから og:image の URL を組み立てる */
export function ogUrl(req: OgRequest): string {
  const q =
    req.kind === "pitch"
      ? `kind=pitch&slug=${encodeURIComponent(req.slug)}`
      : `kind=route&path=${encodeURIComponent(req.path)}`;
  return `/og?${q}`;
}

/**
 * OG 画像で使う色。
 *
 * next/og の ImageResponse にはスタイルシートが無く、`var(--ink)` が効かない。
 * そのためここだけ値を直に持つ。**これを G-09 の例外にしない** —— 代わりに
 * T-161e が globals.css のライトテーマのトークンと一致することを検査する。
 * 配色を変えたらここも一緒に動かないとテストが落ちる。
 */
export const OG_PALETTE = {
  ink: "#23281f",
  inkSoft: "#5c6357",
  paper: "#faf7f2",
  river: "#4a6572",
  ember: "#a94a17",
} as const;

/** globals.css の :root にある対応するトークン名 */
export const OG_PALETTE_TOKENS: Record<keyof typeof OG_PALETTE, string> = {
  ink: "--ink",
  inkSoft: "--ink-soft",
  paper: "--bg",
  river: "--river",
  ember: "--ember",
};
