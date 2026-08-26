import type { MetadataRoute } from "next";
import { SITE_TYPES, type SiteType } from "@/data/sites";
import { SITE_URL } from "@/lib/jsonld";
import { ROUTES } from "@/lib/routes";

// F-17。ROUTES が正本なので、ページを足せば自動で載る。
// 動的セグメントの宣言(/stay/:slug)は実体に展開し、確認用ページは載せない。
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ROUTES.filter(
    (r) => !r.path.includes(":") && !r.path.startsWith("/preview/"),
  ).map((r) => ({
    url: `${SITE_URL}${r.path === "/" ? "" : r.path}`,
    changeFrequency: r.path.startsWith("/journal") ? ("monthly" as const) : ("weekly" as const),
    priority: r.path === "/" ? 1 : 0.7,
  }));

  const pitches = (Object.keys(SITE_TYPES) as SiteType[]).map((slug) => ({
    url: `${SITE_URL}/stay/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...pages, ...pitches];
}
