import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { ReservePanel } from "@/components/ReservePanel";
import { SITE_TYPES, type SiteType } from "@/data/sites";
import { PITCH_FEE } from "@/data/pricing";
import { formatYen } from "@/lib/pricing";
import { routeOf } from "@/lib/routes";
import { buildMonth } from "@/lib/calendar";
import { seasonRange, SEASON, seasonPhase, toISODate } from "@/lib/season";

// ISR。既定の月を「今日」から決めるため、一時間ごとに焼き直す(N-04)
export const revalidate = 3600;

const route = routeOf("/reserve");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

const TYPE_ORDER: SiteType[] = ["seoto", "komore", "hidamari", "solo", "takibi"];

/** 開いた時期に近い月を初期表示にする。閉場期間なら開場初日の月 */
function defaultMonthKey(todayISO: string, year: number): string {
  if (seasonPhase(todayISO) === "open" && todayISO.startsWith(String(year))) {
    return todayISO.slice(0, 7);
  }
  return `${year}-${String(SEASON.open.month).padStart(2, "0")}`;
}

export default function ReservePage() {
  const season = seasonRange(2026);
  const todayISO = toISODate(new Date());
  const initialMonth = buildMonth(defaultMonthKey(todayISO, 2026));

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

      <ReservePanel year={2026} initialMonth={initialMonth} />
    </Page>
  );
}
