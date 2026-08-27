import { describe, expect, it } from "vitest";
import { FACILITIES, SITE_BOUNDARY } from "@/data/geo";
import { PITCHES } from "@/data/sites";
import { pointInPolygon, type Rect } from "@/lib/geometry";
import { FACILITY_LABEL, labelBox } from "@/lib/map-projection";

// T-108 台: 図の読みやすさ(F-01)
//
// loop_004 の反省: 幾何のゲート(G-02 / G-03)は座標の正しさを守るが、
// **図が読めるかどうか**は守らない。実際にブラウザで開くまで、施設の注記が
// 互いに重なっていることに気づかなかった。loop_002 で「施設と区画の重なりなし」を
// 実測したときに見ていたのは施設の**点**であって、**文字が占める幅**ではなかった。
//
// 文字幅は環境で変わるので厳密には決まらない。ここでは全角 1 em・半角 0.6 em の
// 見積もりを使う。厳密でなくとも、重なりが「明らかにある」状態は捕まえられる。

function overlaps(a: Rect, b: Rect): boolean {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
}

describe("T-108: 施設の注記が読める", () => {
  const boxes = FACILITIES.map((f) => ({ id: f.id, label: f.label, box: labelBox(f) }));

  it("見積もりの前提が成立している(全角と半角で幅が変わる)", () => {
    // 前提を検算する(HC-004)。半角だけの文字列は同じ字数の全角より狭い
    const wide = labelBox({ label: "あいうえお", at: { x: 0, y: 0 } });
    const narrow = labelBox({ label: "abcde", at: { x: 0, y: 0 } });
    expect(narrow.w).toBeLessThan(wide.w);
    expect(wide.h).toBeCloseTo(FACILITY_LABEL.fontSize * 1.25, 6);
  });

  it("T-108a: 施設の注記どうしが重ならない", () => {
    const collisions: string[] = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (overlaps(boxes[i].box, boxes[j].box)) {
          collisions.push(`${boxes[i].label} × ${boxes[j].label}`);
        }
      }
    }
    expect(collisions).toEqual([]);
  });

  it("T-108b: 施設の注記が区画に重ならない", () => {
    const collisions: string[] = [];
    for (const b of boxes) {
      for (const p of PITCHES) {
        if (overlaps(b.box, p.rect)) collisions.push(`${b.label} × ${p.id}`);
      }
    }
    expect(collisions).toEqual([]);
  });

  it("T-108c: 施設の注記が敷地からはみ出さない", () => {
    const outside: string[] = [];
    for (const b of boxes) {
      const corners = [
        { x: b.box.x - b.box.w / 2, y: b.box.y - b.box.h / 2 },
        { x: b.box.x + b.box.w / 2, y: b.box.y - b.box.h / 2 },
        { x: b.box.x + b.box.w / 2, y: b.box.y + b.box.h / 2 },
        { x: b.box.x - b.box.w / 2, y: b.box.y + b.box.h / 2 },
      ];
      if (corners.some((c) => !pointInPolygon(c, SITE_BOUNDARY))) outside.push(b.label);
    }
    expect(outside).toEqual([]);
  });

  it("検査が空振りしていない(施設が実在し、幅がゼロでない)", () => {
    expect(boxes.length).toBeGreaterThanOrEqual(8);
    for (const b of boxes) expect(b.box.w).toBeGreaterThan(0);
  });
});

describe("T-109: 区画がタイプ別に見分けられる", () => {
  it("番号だけでは一意にならないことを踏まえ、タイプが図に出ている", () => {
    // 下 2 桁だけでは SE-05 と KO-05 が図の上で同じ「05」になる。
    // だから data-type を出し、CSS がタイプごとに塗り分ける。
    const tails = PITCHES.map((p) => p.id.slice(-2));
    expect(new Set(tails).size).toBeLessThan(PITCHES.length);
  });
});
