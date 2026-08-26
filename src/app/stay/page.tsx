import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { PITCHES, SITE_TYPES, type SiteType } from "@/data/sites";
import { routeOf } from "@/lib/routes";

const route = routeOf("/stay");
export const metadata: Metadata = { title: route?.title, description: route?.lede };

const TYPE_ORDER: SiteType[] = ["seoto", "komore", "hidamari", "solo", "takibi"];

function marks(p: (typeof PITCHES)[number]): string {
  const m: string[] = [];
  if (p.riverside) m.push("川沿い");
  if (p.meadow) m.push("草原");
  else m.push("林間");
  if (p.driveIn) m.push("横付け可");
  if (p.ac) m.push("AC");
  if (p.openFire) m.push("直火可");
  return m.join("・");
}

export default function StayPage() {
  return (
    <Page title="泊まる" lede={route?.lede}>
      <div className="notice">
        <strong>場内図は次の更新で入ります。</strong>{" "}
        区画をクリックして詳細と空き状況を見られる図を用意しています。
        それまでは下の一覧で、川からの距離と地面をご確認ください。
      </div>

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
            </Link>
          );
        })}
      </div>

      <h2>全 {PITCHES.length} 区画</h2>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>区画</th>
              <th>タイプ</th>
              <th className="num">広さ</th>
              <th>性格</th>
              <th>ひとこと</th>
            </tr>
          </thead>
          <tbody>
            {PITCHES.map((p) => (
              <tr key={p.id}>
                <th>{p.id}</th>
                <td>
                  <Link href={`/stay/${p.type}`}>{SITE_TYPES[p.type].name}</Link>
                </td>
                <td className="num">
                  {p.rect.w} × {p.rect.h} m
                </td>
                <td>{marks(p)}</td>
                <td>{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
