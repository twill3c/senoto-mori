import type { Metadata } from "next";
import { Page } from "@/components/Page";
import { routeOf } from "@/lib/routes";

const route = routeOf("/play/mtb");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

const TRAILS = [
  { name: "草原まわり", level: "初級", km: 2.1, up: 40, note: "場内だけで完結します。子どもの練習に使われることが多い一本" },
  { name: "杣道（そまみち）", level: "中級", km: 5.3, up: 210, note: "隣接する林道へ出て、旧作業道を降りてきます。雨の翌日はぬかるみます" },
  { name: "尾根越え", level: "上級", km: 8.4, up: 470, note: "登りが続きます。押して歩く区間が二か所。往復 2 時間半をみてください" },
];

export default function MtbPage() {
  return (
    <Page title="マウンテンバイク" lede={route?.lede}>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>コース</th>
              <th>難度</th>
              <th className="num">距離</th>
              <th className="num">獲得標高</th>
              <th>ひとこと</th>
            </tr>
          </thead>
          <tbody>
            {TRAILS.map((t) => (
              <tr key={t.name}>
                <th>{t.name}</th>
                <td>{t.level}</td>
                <td className="num">{t.km.toFixed(1)} km</td>
                <td className="num">{t.up} m</td>
                <td>{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>貸し出し</h2>
      <div className="prose">
        <p>
          26 インチと 27.5 インチを合わせて 8 台、子ども用を 3 台。ヘルメットは無料でお貸しします。
          台数が少ないので、繁忙期は予約のときに一緒にお申し込みください。
        </p>
      </div>

      <h2>走るときのお願い</h2>
      <div className="prose">
        <p>
          場内で走ってよいのは草原まわりのコースだけです。区画の間を抜ける道と、
          炊事場・トイレの周辺は押して歩いてください。林道は一般の車が通ります。
          カーブの先が見えない区間では速度を落としてください。
        </p>
      </div>
    </Page>
  );
}
