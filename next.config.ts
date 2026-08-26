import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// 静的エクスポートは採らない(N-04)。ページ本体は静的生成しつつ、
// 空き状況の ISR と予約フォームの Server Actions を使うため。
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // フィールドノートの記事は MDX のルートセグメント(F-11)
  pageExtensions: ["ts", "tsx", "mdx"],
};

export default createMDX({})(nextConfig);
