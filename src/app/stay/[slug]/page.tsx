import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Page } from "@/components/Page";
import { PITCH_FEE } from "@/data/pricing";
import { SITE_TYPES, pitchesOfType, type SiteType } from "@/data/sites";
import { ogUrl } from "@/lib/og";
import { formatYen } from "@/lib/pricing";

const SLUGS = Object.keys(SITE_TYPES) as SiteType[];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

function metaOf(slug: string) {
  return SLUGS.includes(slug as SiteType) ? SITE_TYPES[slug as SiteType] : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = metaOf(slug);
  return t
    ? {
        title: t.name,
        description: t.lede,
        openGraph: { images: [ogUrl({ kind: "pitch", slug })] },
      }
    : {};
}

export default async function PitchTypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = metaOf(slug);
  if (!t) notFound();

  const pitches = pitchesOfType(t.slug);
  const fee = PITCH_FEE[t.slug];

  return (
    <Page title={t.name} lede={t.lede}>
      <div className="scroll-x">
        <table>
          <tbody>
            <tr>
              <th>区画数</th>
              <td>{t.count}</td>
            </tr>
            <tr>
              <th>地面</th>
              <td>{t.ground}</td>
            </tr>
            <tr>
              <th>車の横付け</th>
              <td>{pitches[0].driveIn ? "できます" : "できません(共同駐車場から徒歩)"}</td>
            </tr>
            <tr>
              <th>直火</th>
              <td>{pitches[0].openFire ? "できます" : "できません(焚火台をお使いください)"}</td>
            </tr>
            <tr>
              <th>区画料</th>
              <td>
                通常期 {formatYen(fee.normal)} ／ 繁忙期 {formatYen(fee.peak)}
                <span className="card__meta">人数料は別です</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="notice">
        <strong>この区画の弱点</strong>
        <br />
        {t.caveat}
      </div>

      <h2>区画ごとの違い</h2>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>区画</th>
              <th className="num">広さ</th>
              <th>ひとこと</th>
            </tr>
          </thead>
          <tbody>
            {pitches.map((p) => (
              <tr key={p.id}>
                <th>{p.id}</th>
                <td className="num">
                  {p.rect.w} × {p.rect.h} m
                </td>
                <td>
                  {p.note}
                  {p.ac && <span className="card__meta">AC 電源あり</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="prose">
        <Link href="/stay">ほかの区画を見る</Link> ／{" "}
        <Link href="/reserve">この区画で予約する</Link>
      </p>
    </Page>
  );
}
