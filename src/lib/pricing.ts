// 料金の計算(SPEC §2.2 / G-04)。
// テスト側に置いた素朴実装(表を引いて足すだけ)と総当たりで照合される。

import { isHoliday } from "@/data/holidays";
import {
  AC_FEE,
  MAX_HEADS_PER_PITCH,
  PEAK_RANGES,
  PERSON_FEE,
  PITCH_FEE,
} from "@/data/pricing";
import type { SiteType } from "@/data/sites";
import { isOpenDate, parseISODate, toISODate } from "@/lib/season";

/** その日が繁忙期か。期間 / 土曜 / 祝前日 のいずれか */
export function isPeak(dateISO: string): boolean {
  const d = parseISODate(dateISO);
  const md = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;

  for (const r of PEAK_RANGES) {
    // 期間が年をまたがない前提(SPEC §2.2 の 3 期間はいずれも開場期間内)
    if (md >= r.from && md <= r.to) return true;
  }
  if (d.getUTCDay() === 6) return true; // 土曜

  const tomorrow = new Date(d.getTime());
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return isHoliday(toISODate(tomorrow)); // 祝前日
}

/** その日が繁忙期になった理由。料金表の説明に使う */
export function peakReason(dateISO: string): string | null {
  const d = parseISODate(dateISO);
  const md = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
  for (const r of PEAK_RANGES) {
    if (md >= r.from && md <= r.to) return r.label;
  }
  if (d.getUTCDay() === 6) return "土曜";
  const tomorrow = new Date(d.getTime());
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (isHoliday(toISODate(tomorrow))) return "祝前日";
  return null;
}

export interface QuoteInput {
  type: SiteType;
  dateISO: string;
  adults: number;
  children: number;
  infants: number;
  ac: boolean;
}

export interface Quote {
  peak: boolean;
  reason: string | null;
  pitchFee: number;
  personFee: number;
  acFee: number;
  total: number;
}

export function quote(input: QuoteInput): Quote {
  const { type, dateISO, adults, children, infants, ac } = input;

  if (!isOpenDate(dateISO)) {
    throw new Error(`${dateISO} は閉場期間です(開場は 4/18〜11/30)`);
  }
  if (!Number.isInteger(adults) || adults < 1) {
    throw new Error("大人は 1 名以上でお申し込みください");
  }
  for (const [label, n] of [
    ["小学生", children],
    ["未就学児", infants],
  ] as const) {
    if (!Number.isInteger(n) || n < 0) throw new Error(`${label}の人数が不正です`);
  }
  if (adults + children > MAX_HEADS_PER_PITCH) {
    throw new Error(
      `1 区画は未就学児を除いて ${MAX_HEADS_PER_PITCH} 名までです(お申し込みは ${
        adults + children
      } 名)`,
    );
  }
  if (ac && type !== "komore") {
    throw new Error("AC 電源は木洩れサイトの一部区画にのみございます");
  }

  const peak = isPeak(dateISO);
  const pitchFee = peak ? PITCH_FEE[type].peak : PITCH_FEE[type].normal;
  const personFee =
    adults * PERSON_FEE.adult + children * PERSON_FEE.child + infants * PERSON_FEE.infant;
  const acFee = ac ? AC_FEE : 0;

  return {
    peak,
    reason: peakReason(dateISO),
    pitchFee,
    personFee,
    acFee,
    total: pitchFee + personFee + acFee,
  };
}

export function formatYen(n: number): string {
  return `${n.toLocaleString("ja-JP")} 円`;
}
