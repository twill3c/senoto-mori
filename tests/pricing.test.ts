import { describe, expect, it } from "vitest";
import { AC_FEE, PEAK_RANGES, PERSON_FEE, PITCH_FEE } from "@/data/pricing";
import { isPeak, peakReason, quote } from "@/lib/pricing";
import { openDates, isOpenDate } from "@/lib/season";
import type { SiteType } from "@/data/sites";

const TYPES: SiteType[] = ["seoto", "komore", "hidamari", "solo", "takibi"];

// T-030..T-034: 料金(SPEC §2.2 / G-04)

describe("G-06: 営業期間", () => {
  it("T-020: 境界日 — 4/17 不可・4/18 可・11/30 可・12/1 不可", () => {
    expect(isOpenDate("2026-04-17")).toBe(false);
    expect(isOpenDate("2026-04-18")).toBe(true);
    expect(isOpenDate("2026-11-30")).toBe(true);
    expect(isOpenDate("2026-12-01")).toBe(false);
  });

  it("T-021: 2026 年の開場日数は 227", () => {
    // 出所: SPEC §2 の 4/18–11/30 から算出。
    // 4月 13 + 5月 31 + 6月 30 + 7月 31 + 8月 31 + 9月 30 + 10月 31 + 11月 30
    const byHand = 13 + 31 + 30 + 31 + 31 + 30 + 31 + 30;
    expect(byHand).toBe(227);
    expect(openDates(2026)).toHaveLength(227);
  });

  it("T-021b: 開場日一覧は全て isOpenDate を満たし、昇順で重複が無い", () => {
    const dates = openDates(2026);
    expect(dates.every(isOpenDate)).toBe(true);
    expect(new Set(dates).size).toBe(dates.length);
    expect([...dates].sort()).toEqual(dates);
    expect(dates[0]).toBe("2026-04-18");
    expect(dates[dates.length - 1]).toBe("2026-11-30");
  });

  it("T-022: 閉場期間の代表日は不可", () => {
    for (const d of ["2026-01-01", "2026-03-01", "2026-12-25"]) {
      expect(isOpenDate(d)).toBe(false);
    }
  });

  it("うるう年でも 2 月を跨いだ日数計算が壊れない", () => {
    // 開場期間は 4/18 以降なので、うるう年でも日数は 227 のまま
    expect(openDates(2028)).toHaveLength(227);
  });
});

describe("繁忙期(SPEC §2.2)", () => {
  it("T-030: GW / お盆 / 紅葉期の境界", () => {
    // 出所: SPEC §2.2。GW 4/29–5/5, お盆 8/9–8/16, 紅葉 10/11–11/3
    // 4/27(月)は期間外・土曜でなく・翌 4/28 も祝日でないので通常期
    expect(isPeak("2026-04-27")).toBe(false);
    expect(isPeak("2026-04-29")).toBe(true);
    expect(isPeak("2026-05-05")).toBe(true);
    expect(isPeak("2026-08-09")).toBe(true);
    expect(isPeak("2026-08-16")).toBe(true);
    expect(isPeak("2026-10-11")).toBe(true);
    expect(isPeak("2026-11-03")).toBe(true);
  });

  it("T-031: 土曜は繁忙期", () => {
    // 2026-06-06 は土曜(実測: new Date('2026-06-06').getUTCDay() === 6)
    expect(new Date("2026-06-06T00:00:00Z").getUTCDay()).toBe(6);
    expect(isPeak("2026-06-06")).toBe(true);
    // 2026-06-09 は火曜。範囲外なので通常期
    expect(new Date("2026-06-09T00:00:00Z").getUTCDay()).toBe(2);
    expect(isPeak("2026-06-09")).toBe(false);
  });

  it("T-030b: 祝前日は繁忙期(内閣府 CSV 由来の祝日表を引く)", () => {
    // 2026-04-29 昭和の日 / 2026-07-20 海の日 / 2026-09-21 敬老の日 の各前日。
    // 出所: data/syukujitsu.csv(内閣府・2026-08-27 取得)を機械で起こした src/data/holidays.ts
    //
    // 選定条件を明示する: peakReason は PEAK_RANGES → 土曜 → 祝前日 の順に判定するため、
    // 「祝前日」が理由として返るのは期間外かつ土曜でない日に限る。
    // 8/10 や 11/2 は祝前日だが同時に お盆 / 紅葉期 の期間内なので、ここでは使えない。
    // 実測(2026-08-27): 7/19 は日曜、9/20 は日曜、4/28 は火曜。いずれも土曜ではない。
    for (const eve of ["2026-04-28", "2026-07-19", "2026-09-20"]) {
      expect(isPeak(eve)).toBe(true);
      expect(peakReason(eve)).toBe("祝前日");
    }
  });

  it("PEAK_RANGES は全て開場期間内にある(仕様の自己整合)", () => {
    for (const r of PEAK_RANGES) {
      expect(isOpenDate(`2026-${r.from}`)).toBe(true);
      expect(isOpenDate(`2026-${r.to}`)).toBe(true);
    }
  });
});

describe("G-04: 料金の二実装照合", () => {
  /**
   * 素朴実装 — 本実装(src/lib/pricing.ts)とは独立に、
   * SPEC §2.2 の表をそのまま引いて足すだけの計算をする。
   * 分岐を持たず、繁忙期かどうかだけを isPeak に尋ねる。
   */
  function naiveQuote(
    type: SiteType,
    dateISO: string,
    adults: number,
    children: number,
    ac: boolean,
  ): number {
    const peak = isPeak(dateISO);
    let total = 0;
    total += peak ? PITCH_FEE[type].peak : PITCH_FEE[type].normal;
    total += adults * PERSON_FEE.adult;
    total += children * PERSON_FEE.child;
    if (ac) total += AC_FEE;
    return total;
  }

  it("T-032: 5 タイプ × 開場全日(227) × 大人 1–6 名で一致", () => {
    const dates = openDates(2026);
    let compared = 0;
    for (const type of TYPES) {
      for (const dateISO of dates) {
        for (let adults = 1; adults <= 6; adults++) {
          const mine = quote({ type, dateISO, adults, children: 0, infants: 0, ac: false });
          const naive = naiveQuote(type, dateISO, adults, 0, false);
          if (mine.total !== naive) {
            throw new Error(
              `不一致: ${type} ${dateISO} 大人${adults} — 本実装 ${mine.total} / 素朴 ${naive}`,
            );
          }
          compared++;
        }
      }
    }
    // 取りこぼしが無いこと(件数そのものでなく、掛け算が成立していること)
    expect(compared).toBe(TYPES.length * dates.length * 6);
  });

  it("T-032b: 小学生・AC を含めた組み合わせでも一致", () => {
    const dates = ["2026-04-18", "2026-05-03", "2026-08-15", "2026-10-20", "2026-11-30"];
    for (const dateISO of dates) {
      for (let children = 0; children <= 3; children++) {
        for (const ac of [false, true]) {
          const type: SiteType = "komore"; // AC を受け付ける唯一のタイプ
          const mine = quote({ type, dateISO, adults: 2, children, infants: 2, ac });
          expect(mine.total).toBe(naiveQuote(type, dateISO, 2, children, ac));
        }
      }
    }
  });
});

describe("料金の内訳と制約(SPEC §2.2)", () => {
  it("T-033: 未就学児は無料", () => {
    const a = quote({ type: "solo", dateISO: "2026-06-09", adults: 1, children: 0, infants: 0, ac: false });
    const b = quote({ type: "solo", dateISO: "2026-06-09", adults: 1, children: 0, infants: 3, ac: false });
    expect(a.total).toBe(b.total);
  });

  it("T-033b: 大人換算 6 名を超えると拒否される", () => {
    expect(() =>
      quote({ type: "seoto", dateISO: "2026-06-09", adults: 7, children: 0, infants: 0, ac: false }),
    ).toThrow();
    // 小学生も頭数に入る: 大人 4 + 小学生 3 = 7 名
    expect(() =>
      quote({ type: "seoto", dateISO: "2026-06-09", adults: 4, children: 3, infants: 0, ac: false }),
    ).toThrow();
    // ちょうど 6 名は通る
    expect(() =>
      quote({ type: "seoto", dateISO: "2026-06-09", adults: 3, children: 3, infants: 0, ac: false }),
    ).not.toThrow();
  });

  it("T-033c: 大人 0 名は拒否される", () => {
    expect(() =>
      quote({ type: "seoto", dateISO: "2026-06-09", adults: 0, children: 2, infants: 0, ac: false }),
    ).toThrow();
  });

  it("T-034: AC は komore 以外では拒否される", () => {
    for (const type of TYPES.filter((t) => t !== "komore")) {
      expect(() =>
        quote({ type, dateISO: "2026-06-09", adults: 2, children: 0, infants: 0, ac: true }),
      ).toThrow();
    }
  });

  it("T-034b: 閉場日の見積もりは拒否される", () => {
    expect(() =>
      quote({ type: "komore", dateISO: "2026-12-25", adults: 2, children: 0, infants: 0, ac: false }),
    ).toThrow();
  });

  it("内訳の合計が total と一致する", () => {
    const q = quote({ type: "komore", dateISO: "2026-08-15", adults: 2, children: 1, infants: 1, ac: true });
    expect(q.pitchFee + q.personFee + q.acFee).toBe(q.total);
    expect(q.peak).toBe(true);
  });

  it("PITCH_FEE は全タイプで 繁忙期 > 通常期", () => {
    for (const type of TYPES) {
      expect(PITCH_FEE[type].peak).toBeGreaterThan(PITCH_FEE[type].normal);
    }
  });
});
