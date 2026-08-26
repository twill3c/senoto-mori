import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { routeOf } from "@/lib/routes";

const route = routeOf("/faq");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

const QA: [string, string][] = [
  ["何時から入れますか", "チェックインは 13 時、チェックアウトは翌 11 時です。繁忙期以外は、空きがあれば 500 円で 10 時まで延長できます。"],
  ["雨でも開いていますか", "開いています。中止をこちらから判断するのは、大雨警報が出た場合と、川が危険な水位に達した場合です。その場合は全額をお返しします。"],
  ["直火はできますか", "焚火学舎の 4 区画だけです。そのほかの区画では焚火台をお使いください。焚火台のレンタルがあります。"],
  ["薪は売っていますか", "受付で 1 束 700 円。針葉樹と広葉樹の両方があります。ブッシュクラフト講習を受けた方は、東端に集めた倒木を使えます。"],
  ["ペットと一緒に泊まれますか", "陽だまりサイト(草原)のみ可です。リードを必ずお付けください。林間の区画と焚火学舎は不可です。"],
  ["電源はありますか", "木洩れサイトの 8 区画にだけあります。1 泊 1,000 円。ほかの区画にはありません。"],
  ["お風呂はありますか", "場内にはありません。車で 15 分ほどのところに日帰り温泉があります。受付で割引券をお渡ししています。"],
  ["虫はどれくらいいますか", "林間の区画は 7 月から 8 月にかけて蚊とブヨが出ます。草原は風があるぶん少なめです。虫除けはお持ちください。"],
];

export default function FaqPage() {
  return (
    <Page title="よくある質問" lede={route?.lede}>
      <div className="prose">
        {QA.map(([q, a]) => (
          <section key={q}>
            <h3>{q}</h3>
            <p>{a}</p>
          </section>
        ))}
        <p>
          ここに無いことは <Link href="/guide">はじめての方へ</Link> か{" "}
          <Link href="/price">料金</Link> をご覧ください。
        </p>
      </div>
    </Page>
  );
}
