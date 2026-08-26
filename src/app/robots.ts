import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/jsonld";

// F-17。/preview/ は表示確認用なので拾わせない。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/preview/", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
