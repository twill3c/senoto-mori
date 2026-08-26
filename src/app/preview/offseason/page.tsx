import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { SeasonBanner } from "@/components/SeasonBanner";
import { routeOf } from "@/lib/routes";
import { SEASON, nextOpening } from "@/lib/season";

const route = routeOf("/preview/offseason");
export const metadata: Metadata = {
  title: route?.title,
  description: route?.lede,
  robots: { index: false },
};

// 閉場期間の代表日。12 月から 3 月まで待たずにこの表示を確かめられるようにする
const WINTER_DAY = "2026-12-25";

export default function OffseasonPreviewPage() {
  return (
    <Page title="閉場期間の表示" lede={route?.lede}>
      <div className="notice">
        <strong>これは確認用のページです。</strong>
        <br />
        トップページは 12 月から 4 月中旬にかけて下のような表示になります。
        その時期を待たずに見られるよう、{WINTER_DAY} を「今日」とみなして描いています。
      </div>

      <SeasonBanner todayISO={WINTER_DAY} />

      <div className="prose">
        <h2>なぜ切り替えるのか</h2>
        <p>
          閉場中のキャンプ場サイトで困るのは、営業しているのかどうかが分からないまま
          予約ページまで進んでしまうことです。標高 {1050} m のこの場所は年の三分の一が閉場していて、
          その間は水道も止まります。開いていないことは、最初に伝えるべきことです。
        </p>
        <p>
          ただ「やっていません」で終えると、読んだ人は次に何をすればよいか分かりません。
          そこで、次に開く日({nextOpening(WINTER_DAY)})と、予約の受付が始まる日
          ({SEASON.bookingOpen.month} 月 {SEASON.bookingOpen.day} 日)を必ず添えています。
          閉場中は予約への導線を出しません —— 押しても申し込めないボタンは置かない、という考えです。
        </p>
        <p>
          いまの<Link href="/">トップページ</Link>は、一時間ごとに焼き直しながら
          その日の状態を出しています。
        </p>
      </div>
    </Page>
  );
}
