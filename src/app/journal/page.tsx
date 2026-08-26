import type { Metadata } from "next";
import { Page } from "@/components/Page";
import { routeOf } from "@/lib/routes";

const route = routeOf("/journal");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

// L4 で MDX(content/journal/*.mdx)へ移します。
// いまは骨格の確認のため、記事の形だけをここに置いています。
const ENTRIES = [
  {
    date: "2026-08-24",
    title: "川が濁っています",
    body: "22 日の雨で増水し、まだ濁りが残っています。水位は平常より 20 cm 高い状態です。岸へ降りる階段の下二段が水に浸かっているので、瀬音サイトの方はご注意ください。回復には数日かかる見込みです。",
  },
  {
    date: "2026-08-18",
    title: "草原のマツムシソウが咲きました",
    body: "陽だまりサイトの北側、HI-06 から HI-10 のあたりで咲き始めています。例年より一週間ほど早い開花です。抜かずに見るだけにしてください。",
  },
  {
    date: "2026-08-11",
    title: "石窯の火床を積み直しました",
    body: "耐火煉瓦の一部が浮いてきたため、火床を組み直しました。焼き上がりが少し早くなっています。これまで 2 分ほどかけていた方は、90 秒で一度覗いてみてください。",
  },
];

export default function JournalPage() {
  return (
    <Page title="フィールドノート" lede={route?.lede}>
      <div className="prose">
        {ENTRIES.map((e) => (
          <article key={e.date}>
            <h2>{e.title}</h2>
            <p className="card__meta">
              <time dateTime={e.date}>{e.date.replace(/-/g, " / ")}</time>
            </p>
            <p>{e.body}</p>
          </article>
        ))}
      </div>
    </Page>
  );
}
