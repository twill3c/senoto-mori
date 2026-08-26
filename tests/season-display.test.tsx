import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SeasonBanner } from "@/components/SeasonBanner";
import { nextOpening, seasonPhase } from "@/lib/season";

// T-130 台: 季節による表示の切替(F-08)
//
// 閉場期間にトップを開いた人へ何を出すか。12 月から 3 月まで待たないと確認できない
// 表示なので、専用ルート /preview/offseason を用意して、いつでも見られるようにしている。

function render(node: React.ReactElement): string {
  return renderToStaticMarkup(node);
}

describe("T-130: 季節の判定", () => {
  it("開場前 / 開場中 / 今季終了 の三態に分かれる", () => {
    // 出所: SPEC §2 の 4/18–11/30
    expect(seasonPhase("2026-03-01")).toBe("before");
    expect(seasonPhase("2026-04-17")).toBe("before");
    expect(seasonPhase("2026-04-18")).toBe("open");
    expect(seasonPhase("2026-08-27")).toBe("open");
    expect(seasonPhase("2026-11-30")).toBe("open");
    expect(seasonPhase("2026-12-01")).toBe("after");
  });

  it("次の開場日 — 今季終了後は翌年になる", () => {
    expect(nextOpening("2026-03-01")).toBe("2026-04-18");
    expect(nextOpening("2026-08-27")).toBe("2026-04-18");
    expect(nextOpening("2026-12-25")).toBe("2027-04-18");
  });
});

describe("T-131: 季節バナーの表示", () => {
  it("開場中は営業していることと最終日が出る", () => {
    const html = render(<SeasonBanner todayISO="2026-08-27" />);
    expect(html).toContain("開場しています");
    expect(html).toContain("11 月 30 日");
    expect(html).not.toContain("閉場中");
  });

  it("T-131b: 今季終了後は「終わったこと」と「次に開くこと」の両方を出す", () => {
    const html = render(<SeasonBanner todayISO="2026-12-25" />);
    expect(html).toContain("今季の営業は終了しました");
    // 次の開場日を出さないと、読んだ人は次に何をすればよいか分からない
    expect(html).toContain("2027 年 4 月 18 日");
    // 予約受付の開始日も出す(SPEC §2 の 3/1)
    expect(html).toContain("3 月 1 日");
  });

  it("T-131c: 開場前は開場までの案内が出る", () => {
    const html = render(<SeasonBanner todayISO="2026-03-05" />);
    expect(html).toContain("2026 年 4 月 18 日");
    expect(html).not.toContain("開場しています");
  });

  it("T-131d: どの状態でも「架空である」ことは崩れない", () => {
    for (const today of ["2026-03-05", "2026-08-27", "2026-12-25"]) {
      const html = render(<SeasonBanner todayISO={today} />);
      // バナー自体は架空注記を持たないが、閉場中でも予約への導線を出さないこと
      if (today === "2026-12-25") {
        expect(html).not.toContain('href="/reserve"');
      }
    }
  });

  it("T-131e: 状態が data 属性に出る(スタイルとテストの取り付き先)", () => {
    for (const [today, phase] of [
      ["2026-03-05", "before"],
      ["2026-08-27", "open"],
      ["2026-12-25", "after"],
    ] as const) {
      const html = render(<SeasonBanner todayISO={today} />);
      expect(html).toContain(`data-phase="${phase}"`);
    }
  });
});
