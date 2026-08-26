import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { JOURNAL } from "@/content/journal";
import { routeOf } from "@/lib/routes";

const route = routeOf("/journal");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

export default function JournalPage() {
  return (
    <Page title="フィールドノート" lede={route?.lede}>
      <div className="prose">
        <p>
          水位、花、道具の手入れ、道の様子。場から見えたことを書いています。
          お知らせというより、来る前に知っておくと少し違うことの記録です。
        </p>
      </div>

      <div className="cards">
        {JOURNAL.map((e) => (
          <Link key={e.slug} href={`/journal/${e.slug}`} className="card">
            <p className="card__meta">
              <time dateTime={e.date}>{e.date.replace(/-/g, " / ")}</time>
            </p>
            <p className="card__label">{e.title}</p>
            <p className="card__body">{e.lede}</p>
          </Link>
        ))}
      </div>
    </Page>
  );
}
