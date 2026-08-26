import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { routeOf } from "@/lib/routes";
import { seasonRange } from "@/lib/season";

const route = routeOf("/access");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

export default function AccessPage() {
  const season = seasonRange(2026);
  return (
    <Page title="アクセス" lede={route?.lede}>
      <div className="notice">
        所在地は山梨県北杜市高根町としています。
        <strong>架空の施設のため、番地は置いていません。</strong>
        地図アプリで検索しても出てきません。
      </div>

      <h2>車で</h2>
      <div className="prose">
        <p>
          中央自動車道の須玉インターまたは長坂インターから 25 分ほど。
          最後の 2 km は舗装の細い道になり、対向車とすれ違えない区間があります。
          カーブミラーの少ない道なので、速度を落としてお越しください。
        </p>
        <p>
          駐車は 1 区画につき 1 台まで。2 台目は共同駐車場をお使いください(1 泊 1,000 円)。
          ソロの間をご利用の方は、全員が共同駐車場になります。
        </p>
      </div>

      <h2>電車とバスで</h2>
      <div className="prose">
        <p>
          JR 小海線の甲斐大泉駅から約 7 km。路線バスはありません。
          事前にご連絡いただければ、14 時と 15 時の 2 便だけ駅まで迎えに上がります
          (1 名 500 円、繁忙期はお受けできないことがあります)。
        </p>
      </div>

      <h2>冬季</h2>
      <div className="prose">
        <p>
          {season.to.replace(/^\d{4}-/, "").replace("-", " 月 ")} 日で閉場し、
          翌年の {season.from.replace(/^\d{4}-/, "").replace("-", " 月 ")} 日まで開けません。
          標高 1,050 m では 12 月から 3 月にかけて路面が凍り、水道も止まるためです。
        </p>
        <p>
          開場直後の 4 月下旬と、閉場前の 11 月も、朝は路面が凍ることがあります。
          この時期は冬タイヤかチェーンをご用意ください。気温は{" "}
          <Link href="/guide">はじめての方へ</Link> の表をご覧ください。
        </p>
      </div>
    </Page>
  );
}
