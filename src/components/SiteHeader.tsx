import Link from "next/link";
import { NAV } from "@/lib/routes";

export function SiteHeader() {
  return (
    <header className="masthead">
      <div className="masthead__inner">
        <Link href="/" className="masthead__brand">
          瀬音の杜
          <small>八ヶ岳南麓 渓流キャンプフィールド</small>
        </Link>
        <nav className="masthead__nav" aria-label="サイト内">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
