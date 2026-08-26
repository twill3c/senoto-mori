import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { routeOf } from "@/lib/routes";

const route = routeOf("/play/keiryu");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

export default function KeiryuPage() {
  return (
    <Page title="渓流釣り" lede={route?.lede}>
      {/* F-18: 開場期間と釣り期間はずれる。隠さず先に書く */}
      <div className="notice">
        <strong>開場期間と釣りのできる期間はずれています。</strong>
        <br />
        当場の営業は 4 月 18 日から 11 月 30 日まで。いっぽう渓流魚の解禁は 3 月で、
        禁漁は 9 月末です。つまり <strong>10 月と 11 月にお越しでも竿は出せません</strong>。
        紅葉の時期を狙って釣りに来られる方が毎年いらっしゃるので、先にお伝えします。
      </div>

      <h2>瀬音川のこと</h2>
      <div className="prose">
        <p>
          場内の東を流れる小さな川です。川幅は広いところで 6 m ほど。
          瀬音サイトの前が最も開けていて、そこから上流は木が覆いかぶさります。
          アマゴとイワナが入っていて、上流に行くほどイワナの比率が上がります。
        </p>
        <p>
          源流に近いぶん水量は天候にすぐ左右されます。まとまった雨のあと半日は濁ります。
          増水したときは立ち入りを止め、場内放送でお伝えします。
        </p>
      </div>

      <h2>遊漁券</h2>
      <div className="prose">
        <p>
          漁協の遊漁券が必要です。受付でも取り扱っています。日券と年券があり、
          中学生以下は無料です。券は釣っている間、外から見える位置に着けてください。
        </p>
      </div>

      <h2>はじめての方へ</h2>
      <div className="prose">
        <p>
          渓流竿・仕掛け・餌の一式をお貸ししています。土曜の朝 6 時から、
          管理人が 2 時間ほど川を一緒に歩く回を設けています。竿の振り方より、
          どこに魚がいるかを見る回です。
        </p>
        <p>
          <Link href="/stay/seoto">瀬音サイト</Link>{" "}
          に泊まると、テントから岸まで十数メートルです。朝いちばんに竿を出したい方に。
        </p>
      </div>
    </Page>
  );
}
