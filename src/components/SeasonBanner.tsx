// 季節による表示の切替(F-08)。
//
// 標高 1,050 m のキャンプ場は年の三分の一が閉場している。閉場期間に来た人へ
// 「やっていません」だけを出して終わるのは不親切なので、次に開く日と、
// 予約の受付が始まる日を必ず添える。閉場中は予約への導線を出さない
// —— 押しても申し込めないボタンを置かないため。

import Link from "next/link";
import { SEASON, nextOpening, parseISODate, seasonPhase } from "@/lib/season";
import "./season.css";

function jpDate(dateISO: string): string {
  const d = parseISODate(dateISO);
  return `${d.getUTCFullYear()} 年 ${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日`;
}

export function SeasonBanner({ todayISO }: { todayISO: string }) {
  const phase = seasonPhase(todayISO);
  const opening = nextOpening(todayISO);
  const year = parseISODate(todayISO).getUTCFullYear();
  const bookingOpen = `${SEASON.bookingOpen.month} 月 ${SEASON.bookingOpen.day} 日`;

  if (phase === "open") {
    return (
      <aside className="season" data-phase="open">
        <p className="season__lead">
          いま開場しています。今季は {SEASON.close.month} 月 {SEASON.close.day} 日まで。
        </p>
        <p className="season__sub">
          <Link href="/reserve">空き状況を見る</Link>
        </p>
      </aside>
    );
  }

  if (phase === "after") {
    return (
      <aside className="season" data-phase="after">
        <p className="season__lead">今季の営業は終了しました。</p>
        <p className="season__sub">
          次の開場は {jpDate(opening)} です。ご予約の受付は {bookingOpen} から始まります。
          標高 1,050 m のこの場所は、12 月から 3 月にかけて路面が凍り、水道も止まります。
        </p>
      </aside>
    );
  }

  return (
    <aside className="season" data-phase="before">
      <p className="season__lead">
        {year} 年の開場は {jpDate(opening)} からです。
      </p>
      <p className="season__sub">
        ご予約の受付は {bookingOpen} から。開場直後は朝が冷えます。
      </p>
    </aside>
  );
}
