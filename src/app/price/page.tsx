import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { AC_FEE, MAX_HEADS_PER_PITCH, PEAK_RANGES, PERSON_FEE, PITCH_FEE } from "@/data/pricing";
import { SITE_TYPES, type SiteType } from "@/data/sites";
import { formatYen } from "@/lib/pricing";
import { routeOf } from "@/lib/routes";

const route = routeOf("/price");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

const TYPE_ORDER: SiteType[] = ["seoto", "komore", "hidamari", "solo", "takibi"];

export default function PricePage() {
  return (
    <Page title="料金" lede={route?.lede}>
      <h2>区画料(1 泊・1 区画)</h2>
      <div className="scroll-x">
        <table>
          <caption className="card__meta">通常期と繁忙期の二段階です</caption>
          <thead>
            <tr>
              <th>区画</th>
              <th className="num">通常期</th>
              <th className="num">繁忙期</th>
              <th className="num">差</th>
            </tr>
          </thead>
          <tbody>
            {TYPE_ORDER.map((slug) => {
              const fee = PITCH_FEE[slug];
              return (
                <tr key={slug}>
                  <td>
                    <Link href={`/stay/${slug}`}>{SITE_TYPES[slug].name}</Link>
                  </td>
                  <td className="num">{formatYen(fee.normal)}</td>
                  <td className="num">{formatYen(fee.peak)}</td>
                  <td className="num">+{formatYen(fee.peak - fee.normal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>人数料(1 泊・1 名)</h2>
      <div className="scroll-x">
        <table>
          <tbody>
            <tr>
              <th>大人</th>
              <td className="num">{formatYen(PERSON_FEE.adult)}</td>
            </tr>
            <tr>
              <th>小学生</th>
              <td className="num">{formatYen(PERSON_FEE.child)}</td>
            </tr>
            <tr>
              <th>未就学児</th>
              <td className="num">無料</td>
            </tr>
            <tr>
              <th>AC 電源</th>
              <td className="num">
                {formatYen(AC_FEE)}
                <span className="card__meta">木洩れサイトの 8 区画のみ</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="prose">
        1 区画にお泊まりいただけるのは、未就学児を除いて {MAX_HEADS_PER_PITCH} 名までです。
      </p>

      <h2>繁忙期の判定</h2>
      <div className="prose">
        <p>
          どの日が繁忙期になるかを、こちらの都合で決めているように見せたくないので、
          判定の条件をそのまま出します。次の<strong>いずれかに当たれば繁忙期</strong>です。
        </p>
      </div>
      <div className="scroll-x">
        <table>
          <tbody>
            {PEAK_RANGES.map((r) => (
              <tr key={r.label}>
                <th>{r.label}</th>
                <td>
                  {r.from.replace("-", " 月 ")} 日 〜 {r.to.replace("-", " 月 ")} 日
                </td>
              </tr>
            ))}
            <tr>
              <th>土曜</th>
              <td>通年</td>
            </tr>
            <tr>
              <th>祝前日</th>
              <td>国民の祝日の前日(内閣府の公表する祝日にもとづきます)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>キャンセル</h2>
      <div className="prose">
        <p>
          7 日前まで無料、6〜3 日前は 30 %、前々日・前日は 50 %、当日および無連絡は 100 % を
          申し受けます。荒天による中止をこちらから判断した場合は、全額をお返しします。
        </p>
        <p>
          実際の見積もりは <Link href="/reserve">予約</Link> の画面で、日付と人数を入れると
          その場で出ます。
        </p>
      </div>
    </Page>
  );
}
