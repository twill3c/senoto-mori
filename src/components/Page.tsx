import type { ReactNode } from "react";

export function Page({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <main className="page">
      <h1>{title}</h1>
      {lede && <p className="page__lede">{lede}</p>}
      {children}
    </main>
  );
}
