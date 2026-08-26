// 空き状況(F-03 / G-05)。
//
// **これは作り物である。** 実在の予約台帳が無いので、区画 ID と日付から決定論的に
// 状態を導く。乱数を使わないので、同じ日付は誰が何度引いても同じ結果になり、
// テストもスクリーンショットも安定する。
//
// 作り物なりに満たすべき性質があり、tests/availability.test.ts が縛っている:
//   保存則(空 + 満 = 40)・決定論・偏りの不在(常に満/常に空の区画が無い)・
//   需要の向き(繁忙期のほうが埋まる)。
// これらを縛らないと、生成器が壊れても図はそれらしく出てしまう。
//
// L3 で Route Handler(ISR 60s)の背後へ移す予定。純関数のままにしてあるのはそのため。

import { PITCHES, SITE_TYPES, findPitch, type SiteType } from "@/data/sites";
import { isPeak } from "@/lib/pricing";
import { isOpenDate } from "@/lib/season";

export type PitchStatus = "open" | "booked";

/** FNV-1a(32bit)。暗号用途ではなく、文字列から安定した数を得るためだけのもの */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** 0 以上 1 未満 */
function unit(s: string): number {
  return hash32(s) / 0x100000000;
}

/**
 * 区画タイプごとの人気の差。数字は架空の設定で、
 * 「川沿いは取りにくく、直火の区画は条件があるぶん空いている」という含意を持たせている。
 */
const POPULARITY: Record<SiteType, number> = {
  seoto: 0.1,
  hidamari: 0.05,
  komore: 0,
  solo: -0.05,
  takibi: -0.1,
};

const BASE_NORMAL = 0.35;
const BASE_PEAK = 0.8;

function bookedProbability(pitchId: string, dateISO: string): number {
  const pitch = findPitch(pitchId);
  if (!pitch) throw new Error(`知らない区画です: ${pitchId}`);
  const base = isPeak(dateISO) ? BASE_PEAK : BASE_NORMAL;
  return Math.min(0.97, Math.max(0.03, base + POPULARITY[pitch.type]));
}

export function pitchStatus(pitchId: string, dateISO: string): PitchStatus {
  if (!isOpenDate(dateISO)) throw new Error(`${dateISO} は閉場期間です`);
  const p = bookedProbability(pitchId, dateISO);
  return unit(`${pitchId}@${dateISO}`) < p ? "booked" : "open";
}

export interface TypeAvailability {
  total: number;
  open: number;
}

export interface DayAvailability {
  dateISO: string;
  peak: boolean;
  open: number;
  booked: number;
  byPitch: Map<string, PitchStatus>;
  byType: Record<SiteType, TypeAvailability>;
}

export function dayAvailability(dateISO: string): DayAvailability {
  if (!isOpenDate(dateISO)) throw new Error(`${dateISO} は閉場期間です`);

  const byPitch = new Map<string, PitchStatus>();
  const byType = {} as Record<SiteType, TypeAvailability>;
  for (const slug of Object.keys(SITE_TYPES) as SiteType[]) {
    byType[slug] = { total: SITE_TYPES[slug].count, open: 0 };
  }

  let open = 0;
  for (const pitch of PITCHES) {
    const status = pitchStatus(pitch.id, dateISO);
    byPitch.set(pitch.id, status);
    if (status === "open") {
      open++;
      byType[pitch.type].open++;
    }
  }

  return {
    dateISO,
    peak: isPeak(dateISO),
    open,
    booked: PITCHES.length - open,
    byPitch,
    byType,
  };
}

export type TypeLabel = "空" | "残僅" | "満";

/**
 * タイプ単位の見え方。SPEC に無い表示上の決めごとなので、閾値をここに置いて
 * テスト(T-116)で固定する。総数の 25 %(最低 1)以下になったら「残僅」。
 */
export function typeLabel(open: number, total: number): TypeLabel {
  if (open <= 0) return "満";
  const few = Math.max(1, Math.floor(total * 0.25));
  return open <= few ? "残僅" : "空";
}
