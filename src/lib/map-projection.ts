// 場内図の投影。地形データ(x が東・y が北のメートル座標)を SVG 座標に移す。
//
// SVG は y が下向きなので、ここで一度だけ反転する。図を描く側は反転を意識しない。
// 縮尺は等方(x と y で同じ)。歪めると距離感が嘘になり、「川まで何 m か」を
// 図から読み取れなくなる。

import type { Point, Rect } from "@/lib/geometry";

/** 敷地の外周に取る余白(m)。図の縁で線が切れないように */
export const MAP_PADDING_M = 14;

/** 敷地の広がり(m)。src/data/geo.ts の SITE_BOUNDARY を包む矩形 */
export const EXTENT = { minX: 0, minY: 0, maxX: 470, maxY: 380 } as const;

export const VIEWBOX = {
  width: EXTENT.maxX - EXTENT.minX + MAP_PADDING_M * 2,
  height: EXTENT.maxY - EXTENT.minY + MAP_PADDING_M * 2,
} as const;

export function viewBoxAttr(): string {
  return `0 0 ${VIEWBOX.width} ${VIEWBOX.height}`;
}

/** メートル座標 → SVG 座標。1 m = 1 SVG 単位(等方) */
export function projectPoint(p: Point): Point {
  return {
    x: p.x - EXTENT.minX + MAP_PADDING_M,
    y: VIEWBOX.height - MAP_PADDING_M - (p.y - EXTENT.minY),
  };
}

export interface SvgRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 中心指定の矩形 → SVG の左上指定 */
export function projectRect(r: Rect): SvgRect {
  const nw = projectPoint({ x: r.x - r.w / 2, y: r.y + r.h / 2 });
  return { x: nw.x, y: nw.y, width: r.w, height: r.h };
}

export function projectPolygon(poly: readonly Point[]): string {
  const pts = poly.map(projectPoint);
  return `${pts.map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${v.y}`).join(" ")} Z`;
}

export function projectPolyline(line: readonly Point[]): string {
  const pts = line.map(projectPoint);
  return pts.map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${v.y}`).join(" ");
}

/** 施設の注記の体裁。map.css の .gmap__facility-label と一致させる */
export const FACILITY_LABEL = {
  fontSize: 8,
  /** 点から文字の始まりまでの間隔 */
  offsetX: 6,
  /** 文字の縦位置の補正 */
  baselineY: 3,
} as const;

/** 全角は 1 em、半角は 0.6 em として文字列の幅を見積もる */
function textWidth(s: string, fontSize: number): number {
  let em = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    em += code < 0x100 ? 0.6 : 1;
  }
  return em * fontSize;
}

/**
 * 施設の注記が占める矩形(中心指定・メートル)。
 * 厳密な字形は環境で変わるので、あくまで見積もり。T-108 が重なりの検査に使う。
 */
export function labelBox(f: { label: string; at: Point }): Rect {
  const w = textWidth(f.label, FACILITY_LABEL.fontSize);
  const h = FACILITY_LABEL.fontSize * 1.25;
  return {
    x: f.at.x + FACILITY_LABEL.offsetX + w / 2,
    // SVG では y が下向きなので、メートル座標では文字は点より下(y が小さい側)に出る
    y: f.at.y - FACILITY_LABEL.baselineY + h / 2 - h / 2,
    w,
    h,
  };
}
