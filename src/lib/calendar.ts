// 空きカレンダー(F-09)。月の枠を組み、各日に空き数を載せる。
//
// 空きの出どころは availability.ts のひとつだけ。ここで数え直さない。
// 数え直すと、図と表とカレンダーで違う数字が出る余地ができる。

import { dayAvailability } from "@/lib/availability";
import { SEASON, isOpenDate, toISODate } from "@/lib/season";

const MONTH_RE = /^(\d{4})-(\d{2})$/;

export interface CalendarDay {
  dateISO: string;
  /** 開場期間内で、申し込みの対象にできる日 */
  selectable: boolean;
  /** 空いている区画数。開場外は null */
  open: number | null;
  peak: boolean;
}

export interface CalendarMonth {
  key: string;
  year: number;
  month: number;
  /** 1 日が何曜日から始まるか(0 = 日曜)。枠の先頭に置く空マスの数 */
  leadingBlanks: number;
  days: CalendarDay[];
}

function parseMonthKey(key: string): { year: number; month: number } {
  const m = MONTH_RE.exec(key);
  if (!m) throw new Error(`月の形式が不正です: ${key}`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) throw new Error(`月の範囲外です: ${key}`);
  // 開場期間に一日もかからない月は、空きという概念そのものが無い
  if (month < SEASON.open.month || month > SEASON.close.month) {
    throw new Error(`${key} は閉場期間の月です`);
  }
  return { year, month };
}

export function buildMonth(key: string): CalendarMonth {
  const { year, month } = parseMonthKey(key);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateISO = toISODate(new Date(Date.UTC(year, month - 1, d)));
    if (isOpenDate(dateISO)) {
      const a = dayAvailability(dateISO);
      days.push({ dateISO, selectable: true, open: a.open, peak: a.peak });
    } else {
      days.push({ dateISO, selectable: false, open: null, peak: false });
    }
  }

  return {
    key,
    year,
    month,
    leadingBlanks: new Date(Date.UTC(year, month - 1, 1)).getUTCDay(),
    days,
  };
}

/** 月送り。開場期間の外へは出さない(null を返す) */
export function shiftMonth(key: string, delta: number): string | null {
  const { year, month } = parseMonthKey(key);
  const next = month + delta;
  if (next < SEASON.open.month || next > SEASON.close.month) return null;
  return `${year}-${String(next).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const { year, month } = parseMonthKey(key);
  return `${year} 年 ${month} 月`;
}

/** 開場期間にかかる月のキーを昇順で返す */
export function seasonMonths(year: number): string[] {
  const out: string[] = [];
  for (let m = SEASON.open.month; m <= SEASON.close.month; m++) {
    out.push(`${year}-${String(m).padStart(2, "0")}`);
  }
  return out;
}
