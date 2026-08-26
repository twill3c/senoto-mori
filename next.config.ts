import type { NextConfig } from "next";

// 静的エクスポートは採らない(N-04)。ページ本体は静的生成しつつ、
// 空き状況の ISR(60s)と予約フォームの Server Actions を使うため。
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
