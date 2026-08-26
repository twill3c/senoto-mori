import { describe, expect, it } from "vitest";
import { PITCHES, SITE_TYPES, type SiteType } from "@/data/sites";
import { dayAvailability, pitchStatus, typeLabel } from "@/lib/availability";
import { isPeak } from "@/lib/pricing";
import { openDates } from "@/lib/season";

const TYPES = Object.keys(SITE_TYPES) as SiteType[];

// T-110 台: 空き状況のモック(F-03 / G-05)
//
// 実在の予約台帳が無いので、空きは決定論的な純関数で作る。
// 「作り物である」ことは隠さないが、作り物なりに満たすべき性質はある:
//   保存則(数が合う)・決定論(同じ日は何度引いても同じ)・
//   偏りの不在(常に満・常に空の区画が無い)・需要の向き(繁忙期のほうが埋まる)。
// これらを縛らないと、生成器が壊れても図はそれらしく出てしまう。

describe("G-05: 保存則と決定論", () => {
  const dates = openDates(2026);

  it("T-110: 各日の 空 + 満 が総区画数 40 に一致する", () => {
    for (const d of dates) {
      const a = dayAvailability(d);
      expect(a.open + a.booked).toBe(PITCHES.length);
      expect(a.byPitch.size).toBe(PITCHES.length);
    }
  });

  it("T-110b: タイプ別の内訳の総和が全体に一致する", () => {
    for (const d of ["2026-04-18", "2026-08-15", "2026-11-30"]) {
      const a = dayAvailability(d);
      const sumOpen = TYPES.reduce((n, t) => n + a.byType[t].open, 0);
      const sumTotal = TYPES.reduce((n, t) => n + a.byType[t].total, 0);
      expect(sumOpen).toBe(a.open);
      expect(sumTotal).toBe(PITCHES.length);
      for (const t of TYPES) {
        expect(a.byType[t].total).toBe(SITE_TYPES[t].count);
        expect(a.byType[t].open).toBeLessThanOrEqual(a.byType[t].total);
        expect(a.byType[t].open).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("T-111: 決定論 — 同じ日を二度引いても同じ結果", () => {
    for (const d of ["2026-05-03", "2026-07-11", "2026-10-20"]) {
      const a = dayAvailability(d);
      const b = dayAvailability(d);
      for (const p of PITCHES) {
        expect(a.byPitch.get(p.id)).toBe(b.byPitch.get(p.id));
        expect(pitchStatus(p.id, d)).toBe(a.byPitch.get(p.id));
      }
    }
  });

  it("T-112: 常に満・常に空の区画が無い(開場 227 日を通して)", () => {
    const dates227 = openDates(2026);
    const alwaysOpen: string[] = [];
    const alwaysBooked: string[] = [];
    for (const p of PITCHES) {
      let open = 0;
      for (const d of dates227) if (pitchStatus(p.id, d) === "open") open++;
      if (open === dates227.length) alwaysOpen.push(p.id);
      if (open === 0) alwaysBooked.push(p.id);
    }
    expect({ alwaysOpen, alwaysBooked }).toEqual({ alwaysOpen: [], alwaysBooked: [] });
  });

  it("T-113: 需要の向き — 繁忙期のほうが埋まっている", () => {
    const dates227 = openDates(2026);
    const peak = dates227.filter(isPeak);
    const normal = dates227.filter((d) => !isPeak(d));
    // 両群が十分な標本数を持つことを先に確かめる(片方が空なら比較に意味が無い)
    expect(peak.length).toBeGreaterThan(30);
    expect(normal.length).toBeGreaterThan(30);

    const rate = (ds: string[]) =>
      ds.reduce((n, d) => n + dayAvailability(d).booked, 0) / (ds.length * PITCHES.length);
    const peakRate = rate(peak);
    const normalRate = rate(normal);
    expect(peakRate).toBeGreaterThan(normalRate);
    // 「差が出ればよい」ではなく、体感できる差であること
    expect(peakRate - normalRate).toBeGreaterThan(0.15);
    // どちらも 0 % や 100 % に張り付いていないこと
    expect(normalRate).toBeGreaterThan(0.05);
    expect(peakRate).toBeLessThan(0.98);
  });

  it("T-114: 閉場日を引くと拒否される", () => {
    expect(() => dayAvailability("2026-12-25")).toThrow();
    expect(() => pitchStatus("SE-01", "2026-01-05")).toThrow();
  });

  it("T-115: 知らない区画 ID は拒否される", () => {
    expect(() => pitchStatus("XX-99", "2026-06-10")).toThrow();
  });
});

describe("タイプ別の表示ラベル", () => {
  it("T-116: 空きの数から 空 / 残僅 / 満 が決まる", () => {
    // 出所: SPEC §2 に無い表示上の決めごとなので、ここで定義を固定する。
    // 0 なら満、総数の 25 % 以下(かつ 1 以上)なら残僅、それ以外は空。
    expect(typeLabel(0, 12)).toBe("満");
    expect(typeLabel(1, 12)).toBe("残僅");
    expect(typeLabel(3, 12)).toBe("残僅"); // 12 の 25 % = 3
    expect(typeLabel(4, 12)).toBe("空");
    expect(typeLabel(12, 12)).toBe("空");
    // 区画数の少ないタイプでも破綻しない
    expect(typeLabel(1, 4)).toBe("残僅");
    expect(typeLabel(2, 4)).toBe("空");
    expect(typeLabel(0, 4)).toBe("満");
  });
});
