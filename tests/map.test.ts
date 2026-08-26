import { describe, expect, it } from "vitest";
import { FOREST, RIVER, SITE_BOUNDARY } from "@/data/geo";
import { PITCHES } from "@/data/sites";
import {
  MAP_PADDING_M,
  VIEWBOX,
  projectPoint,
  projectRect,
  viewBoxAttr,
} from "@/lib/map-projection";

// T-090 台: 場内図の投影(F-01)
//
// 地形データは x が東・y が北の数学座標。SVG は y が下向きなので、投影で反転する。
// 反転を間違えると図は「それらしく」出てしまい、目視では気づけない。
// 川の上流(北)が図の上に来ることを、座標の大小で縛る。

describe("T-090: 座標の投影", () => {
  it("原点(南西の基準杭)は SVG の左下に落ちる", () => {
    const p = projectPoint({ x: 0, y: 0 });
    expect(p.x).toBeCloseTo(MAP_PADDING_M, 9);
    // y は反転するので、最大値側に来る
    expect(p.y).toBeCloseTo(VIEWBOX.height - MAP_PADDING_M, 9);
  });

  it("北ほど SVG の y が小さい(上に来る)", () => {
    const south = projectPoint({ x: 200, y: 0 });
    const north = projectPoint({ x: 200, y: 380 });
    expect(north.y).toBeLessThan(south.y);
  });

  it("東ほど SVG の x が大きい", () => {
    const west = projectPoint({ x: 0, y: 200 });
    const east = projectPoint({ x: 470, y: 200 });
    expect(east.x).toBeGreaterThan(west.x);
  });

  it("川は上流(配列の先頭)が図の上に来る", () => {
    const upstream = projectPoint(RIVER[0]);
    const downstream = projectPoint(RIVER[RIVER.length - 1]);
    expect(upstream.y).toBeLessThan(downstream.y);
  });

  it("敷地・森林・区画のすべてが viewBox に収まる", () => {
    const pts = [
      ...SITE_BOUNDARY,
      ...FOREST,
      ...RIVER,
      ...PITCHES.flatMap((p) => [
        { x: p.rect.x - p.rect.w / 2, y: p.rect.y - p.rect.h / 2 },
        { x: p.rect.x + p.rect.w / 2, y: p.rect.y + p.rect.h / 2 },
      ]),
    ];
    for (const pt of pts) {
      const q = projectPoint(pt);
      expect(q.x).toBeGreaterThanOrEqual(0);
      expect(q.y).toBeGreaterThanOrEqual(0);
      expect(q.x).toBeLessThanOrEqual(VIEWBOX.width);
      expect(q.y).toBeLessThanOrEqual(VIEWBOX.height);
    }
  });

  it("projectRect は中心指定の矩形を SVG の左上指定に直す", () => {
    const r = projectRect({ x: 100, y: 100, w: 10, h: 8 });
    const topLeftInMeters = projectPoint({ x: 95, y: 104 }); // 北西の角
    expect(r.x).toBeCloseTo(topLeftInMeters.x, 9);
    expect(r.y).toBeCloseTo(topLeftInMeters.y, 9);
    expect(r.width).toBeCloseTo(10, 9);
    expect(r.height).toBeCloseTo(8, 9);
  });

  it("縮尺は等方(x と y で同じ)— 図が歪まない", () => {
    const a = projectPoint({ x: 0, y: 0 });
    const b = projectPoint({ x: 100, y: 0 });
    const c = projectPoint({ x: 0, y: 100 });
    expect(Math.abs(b.x - a.x)).toBeCloseTo(Math.abs(c.y - a.y), 9);
  });

  it("viewBoxAttr は SVG の viewBox 文字列を返す", () => {
    expect(viewBoxAttr()).toBe(`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`);
  });
});
