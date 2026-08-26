import { describe, expect, it } from "vitest";
import { FOREST, RIVER, RIVERSIDE_THRESHOLD_M, SITE_BOUNDARY } from "@/data/geo";
import { PITCHES, SITE_TYPES, type SiteType } from "@/data/sites";
import {
  distanceToPolyline,
  pointInPolygon,
  rectCorners,
  rectsOverlap,
} from "@/lib/geometry";

// T-001..T-011: 区画データと地形の整合(SPEC §2.1 / G-02 / G-03)
//
// G-03 の要点: riverside / meadow は src/data/sites.ts に **人手で** 書かれたフラグであり、
// 座標から生成していない。ここでは座標から独立に計算した値と突き合わせる。
// どちらか一方を他方から生成した瞬間、この照合は何も検証しなくなる(循環の禁止)。

describe("区画データ(SPEC §2.1)", () => {
  it("T-001: 区画総数は 40", () => {
    expect(PITCHES).toHaveLength(40);
  });

  it("T-002: タイプ別内訳が SPEC §2.1 と一致する", () => {
    const counts: Record<string, number> = {};
    for (const p of PITCHES) counts[p.type] = (counts[p.type] ?? 0) + 1;
    expect(counts).toEqual({
      seoto: 8,
      komore: 12,
      hidamari: 10,
      solo: 6,
      takibi: 4,
    });
    // SITE_TYPES のメタデータ側の宣言数とも一致すること(二重定義の照合)
    for (const [slug, meta] of Object.entries(SITE_TYPES)) {
      expect(counts[slug]).toBe(meta.count);
    }
  });

  it("T-003: 区画 ID は一意", () => {
    const ids = PITCHES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("T-008: openFire が真なのは takibi のみ(4 件)", () => {
    const fire = PITCHES.filter((p) => p.openFire);
    expect(fire).toHaveLength(4);
    expect(fire.every((p) => p.type === "takibi")).toBe(true);
    expect(PITCHES.filter((p) => p.type === "takibi").every((p) => p.openFire)).toBe(true);
  });

  it("T-009: ac が真なのは komore のみ・8 件", () => {
    const ac = PITCHES.filter((p) => p.ac);
    expect(ac).toHaveLength(8);
    expect(ac.every((p) => p.type === "komore")).toBe(true);
  });

  it("T-010: seoto は全件 riverside かつ非 meadow", () => {
    const seoto = PITCHES.filter((p) => p.type === "seoto");
    expect(seoto).toHaveLength(8);
    expect(seoto.every((p) => p.riverside && !p.meadow)).toBe(true);
  });

  it("T-011: hidamari は全件 meadow かつ非 riverside", () => {
    const hidamari = PITCHES.filter((p) => p.type === "hidamari");
    expect(hidamari).toHaveLength(10);
    expect(hidamari.every((p) => p.meadow && !p.riverside)).toBe(true);
  });
});

describe("G-02: 区画の配置", () => {
  it("T-004: 全区画の四隅が敷地ポリゴン内に収まる", () => {
    const outside = PITCHES.filter((p) =>
      rectCorners(p.rect).some((c) => !pointInPolygon(c, SITE_BOUNDARY)),
    ).map((p) => p.id);
    expect(outside).toEqual([]);
  });

  it("T-005: 区画同士が重ならない", () => {
    const collisions: string[] = [];
    for (let i = 0; i < PITCHES.length; i++) {
      for (let j = i + 1; j < PITCHES.length; j++) {
        if (rectsOverlap(PITCHES[i].rect, PITCHES[j].rect)) {
          collisions.push(`${PITCHES[i].id}×${PITCHES[j].id}`);
        }
      }
    }
    // 40 区画の総当たりは 780 対
    expect((40 * 39) / 2).toBe(780);
    expect(collisions).toEqual([]);
  });
});

describe("G-03: フラグと幾何の双方向照合", () => {
  it("T-006: riverside が真 ⇔ 渓流からの距離 ≤ 30 m", () => {
    const mismatched = PITCHES.filter((p) => {
      const near =
        distanceToPolyline({ x: p.rect.x, y: p.rect.y }, RIVER) <= RIVERSIDE_THRESHOLD_M;
      return near !== p.riverside;
    }).map((p) => ({
      id: p.id,
      flag: p.riverside,
      dist: Math.round(distanceToPolyline({ x: p.rect.x, y: p.rect.y }, RIVER)),
    }));
    expect(mismatched).toEqual([]);

    // 双方向であることを保証する: 両クラスが空でないこと。
    // 片方が空なら「常に false」の実装でも上の照合は通ってしまう。
    expect(PITCHES.some((p) => p.riverside)).toBe(true);
    expect(PITCHES.some((p) => !p.riverside)).toBe(true);
  });

  it("T-007: meadow が真 ⇔ 森林ポリゴンの外", () => {
    const mismatched = PITCHES.filter((p) => {
      const inForest = pointInPolygon({ x: p.rect.x, y: p.rect.y }, FOREST);
      return !inForest !== p.meadow;
    }).map((p) => p.id);
    expect(mismatched).toEqual([]);

    expect(PITCHES.some((p) => p.meadow)).toBe(true);
    expect(PITCHES.some((p) => !p.meadow)).toBe(true);
  });

  it("森林ポリゴン自体が敷地ポリゴンの内側にある", () => {
    for (const v of FOREST) {
      expect(pointInPolygon(v, SITE_BOUNDARY)).toBe(true);
    }
  });

  it("渓流ポリラインの各点が敷地ポリゴンの内側にある", () => {
    for (const v of RIVER) {
      expect(pointInPolygon(v, SITE_BOUNDARY)).toBe(true);
    }
  });
});

describe("幾何プリミティブの検算", () => {
  // 期待値の出所: 手計算。単位正方形と原点からの距離という自明な例で
  // プリミティブ自体が正しいことを先に押さえる(HC-004)
  const unit = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it("pointInPolygon: 内側 true・外側 false", () => {
    expect(pointInPolygon({ x: 5, y: 5 }, unit)).toBe(true);
    expect(pointInPolygon({ x: 15, y: 5 }, unit)).toBe(false);
    expect(pointInPolygon({ x: -1, y: 5 }, unit)).toBe(false);
  });

  it("distanceToPolyline: 垂線の足が線分内にある場合", () => {
    // (0,0)-(10,0) の線分に対し (5,3) からの距離は 3
    expect(distanceToPolyline({ x: 5, y: 3 }, [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ])).toBeCloseTo(3, 9);
    // 端点の外側では端点までの距離になる: (13,4) → (10,0) まで 5
    expect(distanceToPolyline({ x: 13, y: 4 }, [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ])).toBeCloseTo(5, 9);
  });

  it("rectsOverlap: 接するだけなら重複としない", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 10, y: 0, w: 10, h: 10 }; // 中心間 10 = (10+10)/2 → 辺で接する
    expect(rectsOverlap(a, b)).toBe(false);
    const c = { x: 9, y: 0, w: 10, h: 10 };
    expect(rectsOverlap(a, c)).toBe(true);
  });

  it("rectCorners: 中心と幅高から四隅を返す", () => {
    expect(rectCorners({ x: 0, y: 0, w: 4, h: 2 })).toEqual([
      { x: -2, y: -1 },
      { x: 2, y: -1 },
      { x: 2, y: 1 },
      { x: -2, y: 1 },
    ]);
  });
});

describe("型の網羅", () => {
  it("SITE_TYPES のキーが SiteType を網羅する", () => {
    const slugs: SiteType[] = ["seoto", "komore", "hidamari", "solo", "takibi"];
    expect(Object.keys(SITE_TYPES).sort()).toEqual([...slugs].sort());
  });
});
