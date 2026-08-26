import type { Metadata } from "next";
import { Page } from "@/components/Page";
import { routeOf } from "@/lib/routes";

const route = routeOf("/play/pizza");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

const STEPS = [
  ["16:00", "火入れ", "薪をくべ始めます。窯の温度が上がるまで、ここから 2 時間ほどかかります"],
  ["17:00", "生地を伸ばす", "前日から冷蔵で寝かせた生地をお渡しします。伸ばすところからご自分で"],
  ["18:00", "焼く", "窯の底が 400 ℃ を超えたら順番に。1 枚 90 秒ほどで焼き上がります"],
  ["19:30", "余熱で", "温度が落ちたあとの窯で、焼き芋やパンを入れる方が多いです"],
];

export default function PizzaPage() {
  return (
    <Page title="石窯ピザ" lede={route?.lede}>
      <div className="prose">
        <p>
          管理棟の隣に薪の石窯があります。1 日 6 組まで、ひと組 45 分の入れ替え制です。
          生地・ソース・チーズの基本の一式で、1 枚 900 円。具は持ち込みでも、
          受付で買い足していただいても構いません。
        </p>
      </div>

      <h2>当日の流れ</h2>
      <div className="scroll-x">
        <table>
          <tbody>
            {STEPS.map(([time, what, note]) => (
              <tr key={time}>
                <th>{time}</th>
                <td>{what}</td>
                <td>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>子ども連れの方へ</h2>
      <div className="prose">
        <p>
          生地を伸ばして具をのせるところまでは、子どもがいちばん喜ぶ工程です。
          いっぽう窯の口は 400 ℃ を超えていて、近づくと数十センチ手前でも熱を感じます。
          窯へ入れる作業は大人がしてください。踏み台は用意していません。
        </p>
        <p>
          日没が早い 10 月・11 月は、17 時の枠が暗くなります。
          小さなお子さんとご一緒なら、16 時台の枠をおすすめしています。
        </p>
      </div>
    </Page>
  );
}
