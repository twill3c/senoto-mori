// 場内図の幾何プリミティブ(G-02 / G-03)。
// 座標系はローカル平面・単位メートル。原点は敷地南西の基準杭、x が東、y が北。

export interface Point {
  x: number;
  y: number;
}

/** 中心座標 (x, y) と幅・高さで表す軸平行矩形 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectCorners(r: Rect): Point[] {
  const hw = r.w / 2;
  const hh = r.h / 2;
  return [
    { x: r.x - hw, y: r.y - hh },
    { x: r.x + hw, y: r.y - hh },
    { x: r.x + hw, y: r.y + hh },
    { x: r.x - hw, y: r.y + hh },
  ];
}

/**
 * 交差数判定(ray casting)。境界上の点の扱いは処理系依存になりやすいので、
 * 呼び出し側は境界ちょうどに点を置かないこと。
 */
export function pointInPolygon(p: Point, poly: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    const straddles = a.y > p.y !== b.y > p.y;
    if (!straddles) continue;
    const xCross = ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (p.x < xCross) inside = !inside;
  }
  return inside;
}

/** 辺で接するだけの矩形は「重なっていない」とする */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2
  );
}

export function distancePointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  // 垂線の足の位置を線分内に丸める
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function distanceToPolyline(p: Point, line: readonly Point[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < line.length - 1; i++) {
    const d = distancePointToSegment(p, line[i], line[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

/** SVG の path 用に頂点列を "M x y L ... Z" に変換する(y 軸は呼び出し側で反転) */
export function polygonToPath(poly: readonly Point[]): string {
  return `${poly.map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${v.y}`).join(" ")} Z`;
}

export function polylineToPath(line: readonly Point[]): string {
  return line.map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${v.y}`).join(" ");
}
