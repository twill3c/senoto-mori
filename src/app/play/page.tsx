import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { ROUTES, routeOf } from "@/lib/routes";

const route = routeOf("/play");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

const SEASONS: Record<string, string> = {
  "/play/keiryu": "3 月解禁 — 9 月末禁漁",
  "/play/mtb": "開場期間を通じて",
  "/play/pizza": "開場期間を通じて",
  "/play/bushcraft": "毎週土曜と繁忙期の毎日",
};

export default function PlayPage() {
  const children = ROUTES.filter((r) => r.group === "play" && r.path !== "/play");
  return (
    <Page title="遊ぶ" lede={route?.lede}>
      <div className="prose">
        <p>
          四つとも、道具を持っていなくても始められるようにしています。
          レンタルと、はじめての方向けの案内は各ページに書いています。
        </p>
      </div>
      <div className="cards">
        {children.map((r) => (
          <Link key={r.path} href={r.path} className="card">
            <p className="card__meta">{SEASONS[r.path]}</p>
            <p className="card__label">{r.title}</p>
            <p className="card__body">{r.lede}</p>
          </Link>
        ))}
      </div>
    </Page>
  );
}
