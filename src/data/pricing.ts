// 料金表(SPEC §2.2)。すべて架空の設定値。
// 金額は円・1 泊あたり。区画料と人数料は別建て。

import type { SiteType } from "@/data/sites";

export interface FeePair {
  normal: number;
  peak: number;
}

export const PITCH_FEE: Record<SiteType, FeePair> = {
  seoto: { normal: 7000, peak: 9000 },
  komore: { normal: 5500, peak: 7000 },
  hidamari: { normal: 6000, peak: 7500 },
  solo: { normal: 3000, peak: 3800 },
  takibi: { normal: 6500, peak: 8000 },
};

export const PERSON_FEE = {
  adult: 1200,
  /** 小学生 */
  child: 600,
  /** 未就学児 */
  infant: 0,
} as const;

/** AC 電源。komore の該当 8 区画のみ */
export const AC_FEE = 1000;

/** 1 区画あたりの上限人数(未就学児を除く) */
export const MAX_HEADS_PER_PITCH = 6;

export interface PeakRange {
  label: string;
  /** "MM-DD" */
  from: string;
  to: string;
}

/** 期間で繁忙期になる日(SPEC §2.2)。これに加えて土曜と祝前日も繁忙期 */
export const PEAK_RANGES: readonly PeakRange[] = [
  { label: "ゴールデンウィーク", from: "04-29", to: "05-05" },
  { label: "お盆", from: "08-09", to: "08-16" },
  { label: "紅葉期", from: "10-11", to: "11-03" },
] as const;
