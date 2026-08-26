import { describe, expect, it } from "vitest";
import { SITE_TYPES, type SiteType } from "@/data/sites";
import { MAX_HEADS_PER_PITCH } from "@/data/pricing";
import { buildMonth, monthLabel, shiftMonth } from "@/lib/calendar";
import { reservationSchema, summarize } from "@/lib/reservation";
import { dayAvailability } from "@/lib/availability";
import { openDates, seasonRange } from "@/lib/season";
import { quote } from "@/lib/pricing";

// T-140 台: 申し込みの検証(F-09)
//
// 期待値の出所は SPEC §2.1 / §2.2。ここで新しい制約を発明しない。
// フォームは「送っても何も起きない」が、検証だけは本気で通す —— 通らない入力を
// 受け付けてしまうと、確認画面に出る金額が嘘になる。

const VALID = {
  type: "komore" as SiteType,
  dateISO: "2026-06-10",
  nights: 1,
  adults: 2,
  children: 1,
  infants: 0,
  ac: false,
  name: "坂田 哲朗",
  email: "example@example.com",
  note: "",
};

describe("T-140: 申し込みの検証", () => {
  it("正しい入力は通り、値が保たれる", () => {
    const r = reservationSchema.safeParse(VALID);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.type).toBe("komore");
      expect(r.data.adults).toBe(2);
    }
  });

  it("T-140b: 閉場日は拒否される(G-06 と同じ境界)", () => {
    for (const dateISO of ["2026-04-17", "2026-12-01", "2026-01-05"]) {
      expect(reservationSchema.safeParse({ ...VALID, dateISO }).success).toBe(false);
    }
    for (const dateISO of ["2026-04-18", "2026-11-30"]) {
      expect(reservationSchema.safeParse({ ...VALID, dateISO }).success).toBe(true);
    }
  });

  it("T-140c: 最終日から泊数がはみ出す申し込みは拒否される", () => {
    // 11/30 に 2 泊すると 12/1 まで居ることになる
    expect(reservationSchema.safeParse({ ...VALID, dateISO: "2026-11-30", nights: 2 }).success).toBe(
      false,
    );
    expect(reservationSchema.safeParse({ ...VALID, dateISO: "2026-11-29", nights: 2 }).success).toBe(
      true,
    );
  });

  it("T-140d: 人数の上限は SPEC §2.2 の 6 名(未就学児を除く)", () => {
    expect(
      reservationSchema.safeParse({ ...VALID, adults: 3, children: 3 }).success,
    ).toBe(true);
    expect(
      reservationSchema.safeParse({ ...VALID, adults: 4, children: 3 }).success,
    ).toBe(false);
    expect(MAX_HEADS_PER_PITCH).toBe(6);
    expect(reservationSchema.safeParse({ ...VALID, adults: 0 }).success).toBe(false);
  });

  it("T-140e: AC は木洩れサイト以外では拒否される", () => {
    for (const type of Object.keys(SITE_TYPES) as SiteType[]) {
      const r = reservationSchema.safeParse({ ...VALID, type, ac: true });
      expect(r.success).toBe(type === "komore");
    }
  });

  it("T-140f: 焚火学舎は講習の受講確認が無いと拒否される", () => {
    expect(reservationSchema.safeParse({ ...VALID, type: "takibi" }).success).toBe(false);
    expect(
      reservationSchema.safeParse({ ...VALID, type: "takibi", bushcraft: true }).success,
    ).toBe(true);
    // 受講確認はほかのタイプでは無視される(付いていても通る)
    expect(
      reservationSchema.safeParse({ ...VALID, type: "komore", bushcraft: true }).success,
    ).toBe(true);
  });

  it("T-140g: 名前と連絡先が要る。メールの形も見る", () => {
    expect(reservationSchema.safeParse({ ...VALID, name: "" }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...VALID, name: "   " }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...VALID, email: "not-an-email" }).success).toBe(false);
  });

  it("T-140h: 泊数は 1 以上 7 以下", () => {
    expect(reservationSchema.safeParse({ ...VALID, nights: 0 }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...VALID, nights: 7 }).success).toBe(true);
    expect(reservationSchema.safeParse({ ...VALID, nights: 8 }).success).toBe(false);
  });

  it("T-140i: エラーは日本語で、どの項目かが分かる", () => {
    const r = reservationSchema.safeParse({ ...VALID, adults: 0, name: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const fields = r.error.issues.map((i) => i.path.join("."));
      expect(fields).toContain("adults");
      expect(fields).toContain("name");
      for (const issue of r.error.issues) {
        // 既定の英語メッセージのまま出さない
        expect(issue.message).not.toMatch(/^(Required|Invalid|Expected)/);
        expect(issue.message.length).toBeGreaterThan(3);
      }
    }
  });
});

describe("T-141: 見積もりの要約", () => {
  it("泊ごとの内訳の合計が総額に一致する", () => {
    const input = reservationSchema.parse({ ...VALID, dateISO: "2026-05-01", nights: 3 });
    const s = summarize(input);
    expect(s.nights).toHaveLength(3);
    expect(s.nights.map((n) => n.dateISO)).toEqual(["2026-05-01", "2026-05-02", "2026-05-03"]);
    expect(s.nights.reduce((n, x) => n + x.total, 0)).toBe(s.total);
  });

  it("各泊の金額が quote() と一致する(料金の正本はひとつ)", () => {
    const input = reservationSchema.parse({ ...VALID, dateISO: "2026-08-13", nights: 2, ac: true });
    const s = summarize(input);
    for (const n of s.nights) {
      const q = quote({
        type: input.type,
        dateISO: n.dateISO,
        adults: input.adults,
        children: input.children,
        infants: input.infants,
        ac: input.ac,
      });
      expect(n.total).toBe(q.total);
      expect(n.peak).toBe(q.peak);
    }
  });

  it("繁忙期を跨ぐと泊ごとに金額が変わる", () => {
    // 2026-05-05(こどもの日・GW)と 2026-05-06(休日・GW 明け)
    const input = reservationSchema.parse({ ...VALID, dateISO: "2026-05-05", nights: 2 });
    const s = summarize(input);
    expect(s.nights[0].peak).toBe(true);
    expect(s.nights[0].total).not.toBe(s.nights[1].total);
  });
});

describe("T-150: 空きカレンダー", () => {
  const season = seasonRange(2026);

  it("月の枠が正しい日数を持ち、開場外の日は選べない", () => {
    const april = buildMonth("2026-04");
    expect(april.days).toHaveLength(30);
    expect(april.days[0].dateISO).toBe("2026-04-01");
    expect(april.days[29].dateISO).toBe("2026-04-30");
    for (const d of april.days) {
      expect(d.selectable).toBe(d.dateISO >= season.from);
      // 開場外の日には空き数を出さない
      if (!d.selectable) expect(d.open).toBeNull();
    }
  });

  it("T-150b: 空き数が dayAvailability と一致する", () => {
    const june = buildMonth("2026-06");
    expect(june.days).toHaveLength(30);
    for (const d of june.days) {
      expect(d.open).toBe(dayAvailability(d.dateISO).open);
      expect(d.peak).toBe(dayAvailability(d.dateISO).peak);
    }
  });

  it("T-150c: 先頭の曜日オフセットが実際の曜日と合う", () => {
    for (const key of ["2026-04", "2026-07", "2026-11"]) {
      const m = buildMonth(key);
      const first = new Date(`${m.days[0].dateISO}T00:00:00Z`);
      expect(m.leadingBlanks).toBe(first.getUTCDay());
    }
  });

  it("T-150d: 開場期間の全日がどこかの月に一度だけ現れる", () => {
    const seen = new Set<string>();
    for (const key of ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]) {
      for (const d of buildMonth(key).days) {
        if (d.selectable) {
          expect(seen.has(d.dateISO)).toBe(false);
          seen.add(d.dateISO);
        }
      }
    }
    expect(seen.size).toBe(openDates(2026).length);
    expect([...seen].sort()).toEqual(openDates(2026));
  });

  it("T-150e: 月送りは開場期間の外へ出ない", () => {
    expect(shiftMonth("2026-04", -1)).toBeNull();
    expect(shiftMonth("2026-11", 1)).toBeNull();
    expect(shiftMonth("2026-04", 1)).toBe("2026-05");
    expect(shiftMonth("2026-11", -1)).toBe("2026-10");
  });

  it("T-150f: 知らない月の形は拒否される", () => {
    expect(() => buildMonth("2026-13")).toThrow();
    expect(() => buildMonth("not-a-month")).toThrow();
    // 開場期間の外の月も拒否する(空きの概念が無い)
    expect(() => buildMonth("2026-01")).toThrow();
  });

  it("月の見出しが日本語で出る", () => {
    expect(monthLabel("2026-04")).toBe("2026 年 4 月");
    expect(monthLabel("2026-11")).toBe("2026 年 11 月");
  });
});
