// フッタリンク(F-14)。フリート共通規約に合わせて 5 項目・この並び。
// 歩き方 / 設計図 は解説アーティファクト(2026-08-27 発行)。
// それまでは README.md / SPEC.md を指していた。

export interface FooterLink {
  label: string;
  href: string;
}

export const FOOTER_LINKS: readonly FooterLink[] = [
  {
    label: "MIT License",
    href: "https://github.com/twill3c/senoto-mori/blob/main/LICENSE",
  },
  { label: "GitHub", href: "https://github.com/twill3c/senoto-mori" },
  {
    label: "瀬音の杜の歩き方",
    href: "https://claude.ai/code/artifact/4b4eb3c6-c674-4cb4-90f6-04ec46c8647a",
  },
  {
    label: "瀬音の杜 設計図",
    href: "https://claude.ai/code/artifact/91407f24-ef40-4bad-897b-f79d3ae52dbf",
  },
  { label: "App Menu", href: "https://app-menu-amber.vercel.app" },
] as const;
