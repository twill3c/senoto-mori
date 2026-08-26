// フッタリンク(F-14)。フリート共通規約に合わせて 5 項目・この並び。
// 歩き方 / 設計図 はアーティファクト。L4 で発行するまでは App Menu と同じ扱いにせず、
// 発行後に ID を差し替える(現在は仮の配置ではなく、実在するフリート入口を指している)。

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
    href: "https://github.com/twill3c/senoto-mori/blob/main/README.md",
  },
  {
    label: "瀬音の杜 設計図",
    href: "https://github.com/twill3c/senoto-mori/blob/main/SPEC.md",
  },
  { label: "App Menu", href: "https://app-menu-amber.vercel.app" },
] as const;
