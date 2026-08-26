// 構造化データ(F-16)。schema.org の Campground。
//
// ここは人の目に触れない。触れないからこそ、SPEC §2 の設定と食い違ったまま
// 気づかれずに配信され続ける危険がある。値は定数で書かず、料金表と区画データから取り直す。
//
// **架空である旨を disambiguatingDescription に入れている。** 検索結果に出たときに
// 実在の施設と誤認されないための最後の砦で、これを外してはならない。

import { PITCHES, SITE_TYPES, type SiteType } from "@/data/sites";
import { PITCH_FEE } from "@/data/pricing";
import { SEASON } from "@/lib/season";

export const SITE_URL = "https://senoto-mori.vercel.app";

export interface CampgroundJsonLd {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  description: string;
  disambiguatingDescription: string;
  address: {
    "@type": string;
    addressCountry: string;
    addressRegion: string;
    addressLocality: string;
  };
  numberOfPitches: number;
  priceRange: { min: number; max: number; currency: string };
  amenityFeature: { "@type": string; name: string; value: boolean }[];
  openingHoursSpecification: {
    "@type": string;
    validFrom: string;
    validThrough: string;
  };
}

/** 料金表の実際の端を取り直す。表を書き換えたらここも自動で追随する */
function priceEdges(): { min: number; max: number } {
  const slugs = Object.keys(SITE_TYPES) as SiteType[];
  const all = slugs.flatMap((t) => [PITCH_FEE[t].normal, PITCH_FEE[t].peak]);
  return { min: Math.min(...all), max: Math.max(...all) };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function campgroundJsonLd(year = 2026): CampgroundJsonLd {
  const { min, max } = priceEdges();
  return {
    "@context": "https://schema.org",
    "@type": "Campground",
    name: "瀬音の杜 — 八ヶ岳南麓 渓流キャンプフィールド",
    url: SITE_URL,
    description:
      "山梨県北杜市高根町、標高 1,050 m。渓流沿いの森と草原に 40 区画。渓流釣り・マウンテンバイク・石窯ピザ・ブッシュクラフト。",
    disambiguatingDescription:
      "これは架空のキャンプ場です。実在の施設ではなく、予約は成立しません。Web サイト制作の作例として作られています。",
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: "山梨県",
      addressLocality: "北杜市高根町(架空)",
    },
    numberOfPitches: PITCHES.length,
    priceRange: { min, max, currency: "JPY" },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "炊事場", value: true },
      { "@type": "LocationFeatureSpecification", name: "水洗トイレ", value: true },
      { "@type": "LocationFeatureSpecification", name: "AC 電源(一部区画)", value: true },
      { "@type": "LocationFeatureSpecification", name: "直火(焚火学舎のみ)", value: true },
      { "@type": "LocationFeatureSpecification", name: "入浴施設", value: false },
      { "@type": "LocationFeatureSpecification", name: "冬季営業", value: false },
    ],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      validFrom: `${year}-${pad(SEASON.open.month)}-${pad(SEASON.open.day)}`,
      validThrough: `${year}-${pad(SEASON.close.month)}-${pad(SEASON.close.day)}`,
    },
  };
}
