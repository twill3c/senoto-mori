import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { routeOf } from "@/lib/routes";

const route = routeOf("/play/bushcraft");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

const CURRICULUM = [
  ["火", "麻紐とファイヤースターターから熾すところまで。着かない人が必ず出るので、時間は多めに取っています"],
  ["刃物", "ナイフの持ち方、刃の向き、フェザースティック。切るより、どこを切らないかの話が長くなります"],
  ["結び", "もやい結び、自在結び、トリポッド。タープを張り直しながら覚えます"],
  ["寝床", "落葉と枝で寝床をつくります。実際に寝るところまではしません"],
];

export default function BushcraftPage() {
  return (
    <Page title="ブッシュクラフト" lede={route?.lede}>
      <div className="notice">
        <strong>焚火学舎の 4 区画は、この講習を受けた方だけが予約できます。</strong>
        <br />
        場内で直火が許されているのはその 4 区画だけです。受講なしでのご予約はお受けしていません。
      </div>

      <h2>講習</h2>
      <div className="prose">
        <p>
          毎週土曜と、繁忙期は毎日。13 時から 3 時間、ひと回 6 名まで。参加費 4,000 円。
          道具はこちらで用意します。長袖・長ズボン、軍手、濡れてよい靴でお越しください。
          中学生以上が対象です。
        </p>
      </div>
      <div className="scroll-x">
        <table>
          <tbody>
            {CURRICULUM.map(([k, v]) => (
              <tr key={k}>
                <th>{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>倒木について</h2>
      <div className="prose">
        <p>
          使ってよいのは、場内の東端に集めてある倒木だけです。立木からは、
          枝であっても切らないでください。落葉樹の森は見た目より回復が遅く、
          年間に出る倒木の量にも限りがあります。
        </p>
        <p>
          灰は必ず灰捨て場へ。埋めたり、川に流したりはしないでください。
          区画の詳細は <Link href="/stay/takibi">焚火学舎</Link> に書いています。
        </p>
      </div>
    </Page>
  );
}
