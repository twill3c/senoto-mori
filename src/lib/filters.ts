// 区画の絞り込み(F-02)。述語は区画データのフラグをそのまま読むだけにする。
// ここで距離を計算し直したりすると、G-03 が守っている「手書きのフラグ」と
// 二重の真実ができてしまう。

import type { Pitch } from "@/data/sites";

export type FilterKey = "riverside" | "meadow" | "openFire" | "ac" | "solo" | "driveIn";

export interface FilterDef {
  key: FilterKey;
  label: string;
  /** 押したときに何が起きるかの説明。ツールチップと読み上げに使う */
  hint: string;
  test: (p: Pitch) => boolean;
}

export const FILTERS: readonly FilterDef[] = [
  {
    key: "riverside",
    label: "川沿い",
    hint: "瀬音川から 30 m 以内の区画",
    test: (p) => p.riverside,
  },
  {
    key: "meadow",
    label: "草原",
    hint: "森の外、見晴らしのきく区画",
    test: (p) => p.meadow,
  },
  {
    key: "openFire",
    label: "直火可",
    hint: "焚火学舎。ブッシュクラフト講習の受講が条件です",
    test: (p) => p.openFire,
  },
  {
    key: "ac",
    label: "AC 電源",
    hint: "木洩れサイトの一部にのみあります",
    test: (p) => p.ac,
  },
  {
    key: "solo",
    label: "ソロ向き",
    hint: "ひとり用の小区画。車は共同駐車場へ",
    test: (p) => p.type === "solo",
  },
  {
    key: "driveIn",
    label: "車を横付け",
    hint: "区画の脇まで車を入れられます",
    test: (p) => p.driveIn,
  },
] as const;

const BY_KEY = new Map(FILTERS.map((f) => [f.key, f]));

/** すべての条件を満たす区画だけを返す(AND) */
export function applyFilters(pitches: readonly Pitch[], keys: readonly FilterKey[]): Pitch[] {
  const defs = keys.map((k) => {
    const d = BY_KEY.get(k);
    if (!d) throw new Error(`知らない絞り込みです: ${k}`);
    return d;
  });
  return pitches.filter((p) => defs.every((d) => d.test(p)));
}

/** URL の ?f=a,b を FilterKey[] に直す。知らないキーは黙って捨てる */
export function parseFilterParam(raw: string | undefined): FilterKey[] {
  if (!raw) return [];
  const out: FilterKey[] = [];
  for (const part of raw.split(",")) {
    const k = part.trim();
    if (BY_KEY.has(k as FilterKey) && !out.includes(k as FilterKey)) out.push(k as FilterKey);
  }
  return out;
}
