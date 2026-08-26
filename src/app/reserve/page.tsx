import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { SITE_TYPES, type SiteType } from "@/data/sites";
import { PITCH_FEE } from "@/data/pricing";
import { formatYen } from "@/lib/pricing";
import { routeOf } from "@/lib/routes";
import { seasonRange, SEASON } from "@/lib/season";

const route = routeOf("/reserve");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

const TYPE_ORDER: SiteType[] = ["seoto", "komore", "hidamari", "solo", "takibi"];

export default function ReservePage() {
  const season = seasonRange(2026);

  return (
    <Page title="予約" lede="空き状況の確認とお申し込み。">
      {/* F-13 の 3 箇所のうちの一つ。フォームに触れる前に必ず目に入る位置に置く */}
      <div className="notice">
        <strong>これは架空のキャンプ場です。</strong>
        <br />
        瀬音の杜は Web サイト制作の作例としてつくられた架空の施設で、実在しません。
        この画面から予約は成立せず、送信された内容はどこにも保存されず、
        どなたにも届きません。お金を請求することもありません。
      </div>

      <h2>受付の流れ</h2>
      <div className="prose">
        <p>
          営業は {season.from.replace(/^\d{4}-/, "").replace("-", " 月 ")} 日から{" "}
          {season.to.replace(/^\d{4}-/, "").replace("-", " 月 ")} 日まで。
          その年のご予約は {SEASON.bookingOpen.month} 月 {SEASON.bookingOpen.day} 日から
          お受けします。焚火学舎の 4 区画だけは、ブッシュクラフト講習の受講が条件です。
        </p>
        <p>
          日付を選ぶと、その日が繁忙期に当たるかどうかと、区画ごとの空きが出ます。
          繁忙期の判定条件は <Link href="/price">料金</Link> にすべて書いています。
        </p>
      </div>

      <h2>区画と区画料</h2>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>区画</th>
              <th className="num">通常期</th>
              <th className="num">繁忙期</th>
              <th>条件</th>
            </tr>
          </thead>
          <tbody>
            {TYPE_ORDER.map((slug) => (
              <tr key={slug}>
                <td>
                  <Link href={`/stay/${slug}`}>{SITE_TYPES[slug].name}</Link>
                </td>
                <td className="num">{formatYen(PITCH_FEE[slug].normal)}</td>
                <td className="num">{formatYen(PITCH_FEE[slug].peak)}</td>
                <td>
                  {slug === "takibi"
                    ? "ブッシュクラフト講習の受講が必要"
                    : slug === "solo"
                      ? "車は共同駐車場へ"
                      : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="notice">
        <strong>空き状況カレンダーと申込フォームは次の更新で入ります。</strong>
        <br />
        日付ごとの空き、入力内容の検証、確認画面までをこの画面の中で完結させる予定です。
        送信しても実際には何も起こらない点は、そのときも変わりません。
      </div>
    </Page>
  );
}
