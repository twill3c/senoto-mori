import Link from "next/link";
import { Page } from "@/components/Page";
import { SeasonBanner } from "@/components/SeasonBanner";
import { guideTable } from "@/data/climate";
import { SITE_TYPES, type SiteType } from "@/data/sites";
import { routeOf } from "@/lib/routes";
import { seasonRange, toISODate } from "@/lib/season";

// ISR。季節の表示が「今日」に依存するので、一時間ごとに焼き直す(F-08 / N-04)
export const revalidate = 3600;

const TYPE_ORDER: SiteType[] = ["seoto", "komore", "hidamari", "solo", "takibi"];

const PLAY = [
  { href: "/play/keiryu", label: "渓流釣り", body: "瀬音川はアマゴとイワナ。三月解禁、九月末で禁漁です。" },
  { href: "/play/mtb", label: "マウンテンバイク", body: "場内と隣接林道に三本。初級 2.1 km から上級 8.4 km まで。" },
  { href: "/play/pizza", label: "石窯ピザ", body: "薪の石窯をひと組ずつお貸しします。火入れは焼く二時間前から。" },
  { href: "/play/bushcraft", label: "ブッシュクラフト", body: "焚火学舎で講習。受講した方だけが直火の区画を使えます。" },
];

export default function Home() {
  const season = seasonRange(2026);
  const august = guideTable().find((r) => r.month === 8);

  return (
    <Page
      title="水音のいちばん近くで眠る"
      lede={routeOf("/")?.lede}
    >
      <SeasonBanner todayISO={toISODate(new Date())} />

      <div className="prose">
        <p>
          東の縁を瀬音川が流れ、西半分は落葉樹の森、北東が草原です。四十の区画は、
          川に近いもの、木洩れ日の下のもの、遮るもののない草の上のものに分かれています。
          どれを選ぶかで、その二日間の過ごし方がほとんど決まります。
        </p>
        <p>
          <Link href="/stay">場内図</Link>
          から、川からの距離・地面・日陰・車を横付けできるかを見比べて選んでください。
          区画ごとの短所も同じ場所に書いてあります。
        </p>
      </div>

      <h2>四つの遊び</h2>
      <div className="cards">
        {PLAY.map((p) => (
          <Link key={p.href} href={p.href} className="card">
            <p className="card__label">{p.label}</p>
            <p className="card__body">{p.body}</p>
          </Link>
        ))}
      </div>

      <h2>五つの区画</h2>
      <div className="cards">
        {TYPE_ORDER.map((slug) => {
          const t = SITE_TYPES[slug];
          return (
            <Link key={slug} href={`/stay/${slug}`} className="card">
              <p className="card__meta">
                {t.count} 区画 ／ {t.ground}
              </p>
              <p className="card__label">{t.name}</p>
              <p className="card__body">{t.lede}</p>
              <p className="card__body caveat">{t.caveat}</p>
            </Link>
          );
        })}
      </div>

      <h2>来る前に</h2>
      <div className="prose">
        <p>
          標高 1,050 m です。八月でも朝の平年値は {august?.site} ℃、甲府より{" "}
          {august ? (august.kofu - august.site).toFixed(1) : ""} ℃ 低い。
          平地の感覚で荷物を組むと、たいてい寒がることになります。
          月ごとの気温は <Link href="/guide">はじめての方へ</Link> に一覧があります。
        </p>
        <p>
          営業は {season.from.replace(/^\d{4}-/, "").replace("-", " 月 ")} 日から{" "}
          {season.to.replace(/^\d{4}-/, "").replace("-", " 月 ")} 日まで。
          冬季は閉場します。料金の考え方は <Link href="/price">料金</Link>、
          申し込みは <Link href="/reserve">予約</Link> から。
        </p>
      </div>
    </Page>
  );
}
