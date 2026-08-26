import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { ELEVATION_OFFSET_C, SITE_ELEVATION_M, guideTable } from "@/data/climate";
import { routeOf } from "@/lib/routes";

const route = routeOf("/guide");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

const MONTH_LABEL = (m: number) => `${m} 月`;

const BRING = [
  ["寝袋", "快適使用温度が 0 ℃ を下回るもの。4 月・11 月は特に。夏用しか無い場合は毛布を足してください"],
  ["上着", "薄手のダウンかフリース。朝と夜の二回、必ず出番があります"],
  ["ペグ", "木洩れサイトとソロの間は根が張っています。鍛造ペグを推奨します"],
  ["長靴か濡れてよい靴", "渓流に降りる方は必須。岸の石は乾いて見えても滑ります"],
  ["ランタン", "場内灯は炊事場とトイレの周りだけです。区画には灯りがありません"],
  ["ゴミ袋", "生ゴミ以外はお持ち帰りいただいています"],
];

const RULES = [
  ["直火", "焚火学舎の 4 区画のみ。ほかの区画では焚火台を必ず使ってください"],
  ["消灯", "22 時から 6 時まで。発電機と音楽はこの時間帯を通じて不可です"],
  ["車の移動", "22 時以降は場内での移動をご遠慮ください。ヘッドライトが草原まで届きます"],
  ["ペット", "リード必須。草原サイトのみ可、林間と焚火学舎は不可です"],
  ["釣り", "遊漁券が必要です。受付でも取り扱っています"],
  ["川", "増水時は立ち入りを止めます。判断はこちらから場内放送でお伝えします"],
];

export default function GuidePage() {
  const rows = guideTable();

  return (
    <Page title="はじめての方へ" lede={route?.lede}>
      <h2>朝、どれくらい冷えるか</h2>
      <div className="prose">
        <p>
          標高 {SITE_ELEVATION_M.toLocaleString("ja-JP")} m です。当地の値は、甲府の日最低気温の
          平年値から一律 {ELEVATION_OFFSET_C} ℃ を引いたものを目安として出しています。
          あくまで平年値なので、実際の朝はこれより数度低いことがあります。
        </p>
      </div>
      <div className="scroll-x">
        <table>
          <caption className="card__meta">
            甲府の値は気象庁の平年値(統計期間 1991–2020、日最低気温)
          </caption>
          <thead>
            <tr>
              <th>月</th>
              <th className="num">甲府</th>
              <th className="num">瀬音の杜</th>
              <th>その月の朝</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month}>
                <th>{MONTH_LABEL(r.month)}</th>
                <td className="num">{r.kofu.toFixed(1)} ℃</td>
                <td className="num">{r.site.toFixed(1)} ℃</td>
                <td>{r.advice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>持ち物</h2>
      <div className="scroll-x">
        <table>
          <tbody>
            {BRING.map(([k, v]) => (
              <tr key={k}>
                <th>{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="prose">
        テント・タープ・寝袋・焚火台・調理器具はレンタルがあります。数に限りがあるため、
        <Link href="/reserve">予約</Link>のときに一緒にお申し込みください。
      </p>

      <h2>場内のきまり</h2>
      <div className="scroll-x">
        <table>
          <tbody>
            {RULES.map(([k, v]) => (
              <tr key={k}>
                <th>{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>キャンセル規定</h2>
      <div className="prose">
        <p>
          7 日前まで無料、6〜3 日前は 30 %、前々日・前日は 50 %、当日および無連絡は 100 %。
          荒天中止をこちらから判断した場合は全額返金します。詳しくは
          <Link href="/price">料金</Link>のページに書いています。
        </p>
      </div>
    </Page>
  );
}
