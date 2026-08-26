import type { Metadata } from "next";
import "./globals.css";
import "@/components/shell.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { campgroundJsonLd, SITE_URL } from "@/lib/jsonld";
import { ogUrl } from "@/lib/og";
import { routeOf } from "@/lib/routes";

const top = routeOf("/");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "瀬音の杜 — 八ヶ岳南麓 渓流キャンプフィールド",
    template: "%s — 瀬音の杜",
  },
  description: top?.lede,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "瀬音の杜",
    images: [ogUrl({ kind: "route", path: "/" })],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {/* F-16。検索結果に出たときに架空だと分かるよう、
            disambiguatingDescription にもその旨が入っている */}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD は script の中身として出すしかない
          dangerouslySetInnerHTML={{ __html: JSON.stringify(campgroundJsonLd()) }}
        />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
