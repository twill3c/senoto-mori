// 営業期間(SPEC §2)。4/18 開場・11/30 閉場。冬季は閉場する。
//
// 日付は "YYYY-MM-DD" の文字列で扱い、内部の計算だけ UTC の Date に載せる。
// ローカルタイムゾーンに依存させないため、Date をそのまま外へ出さない。

export const SEASON = {
  open: { month: 4, day: 18 },
  close: { month: 11, day: 30 },
  /** 予約受付の開始日(その年の) */
  bookingOpen: { month: 3, day: 1 },
} as const;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISODate(dateISO: string): Date {
  const m = ISO_RE.exec(dateISO);
  if (!m) throw new Error(`日付の形式が不正です: ${dateISO}`);
  const d = new Date(`${dateISO}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`存在しない日付です: ${dateISO}`);
  // 2026-02-30 のような繰り上がりを弾く
  if (d.getUTCMonth() + 1 !== Number(m[2]) || d.getUTCDate() !== Number(m[3])) {
    throw new Error(`存在しない日付です: ${dateISO}`);
  }
  return d;
}

export function toISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 月日だけを 4 桁の数に潰して範囲比較する(0418 ≤ x ≤ 1130) */
function monthDayKey(month: number, day: number): number {
  return month * 100 + day;
}

export function isOpenDate(dateISO: string): boolean {
  const d = parseISODate(dateISO);
  const key = monthDayKey(d.getUTCMonth() + 1, d.getUTCDate());
  return (
    key >= monthDayKey(SEASON.open.month, SEASON.open.day) &&
    key <= monthDayKey(SEASON.close.month, SEASON.close.day)
  );
}

/** その年の開場日を昇順で返す */
export function openDates(year: number): string[] {
  const out: string[] = [];
  const cursor = new Date(Date.UTC(year, SEASON.open.month - 1, SEASON.open.day));
  const end = new Date(Date.UTC(year, SEASON.close.month - 1, SEASON.close.day));
  while (cursor.getTime() <= end.getTime()) {
    out.push(toISODate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/** 開場初日 / 最終日 */
export function seasonRange(year: number): { from: string; to: string } {
  return {
    from: toISODate(new Date(Date.UTC(year, SEASON.open.month - 1, SEASON.open.day))),
    to: toISODate(new Date(Date.UTC(year, SEASON.close.month - 1, SEASON.close.day))),
  };
}

/**
 * その日付時点で「今季」がどの状態にあるか。
 * トップページのオフシーズン表示(F-08)がこれを見る。
 */
export type SeasonPhase = "open" | "before" | "after";

export function seasonPhase(todayISO: string): SeasonPhase {
  const d = parseISODate(todayISO);
  const key = monthDayKey(d.getUTCMonth() + 1, d.getUTCDate());
  if (key < monthDayKey(SEASON.open.month, SEASON.open.day)) return "before";
  if (key > monthDayKey(SEASON.close.month, SEASON.close.day)) return "after";
  return "open";
}

/** 次に開場する日。閉場後なら翌年の開場日を返す */
export function nextOpening(todayISO: string): string {
  const d = parseISODate(todayISO);
  const year = d.getUTCFullYear() + (seasonPhase(todayISO) === "after" ? 1 : 0);
  return toISODate(new Date(Date.UTC(year, SEASON.open.month - 1, SEASON.open.day)));
}
