import type { Metadata } from "next";
import "./globals.css";
import "@/components/shell.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { routeOf } from "@/lib/routes";

const top = routeOf("/");

export const metadata: Metadata = {
  title: {
    default: "瀬音の杜 — 八ヶ岳南麓 渓流キャンプフィールド",
    template: "%s — 瀬音の杜",
  },
  description: top?.lede,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
