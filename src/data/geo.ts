// 架空の地形(SPEC §2)。座標はローカル平面・単位メートル、x が東・y が北。
// 敷地はおよそ 470 m × 380 m。東縁を瀬音川が南北に流れ、北東部が草原、残りが落葉樹の森。
//
// このファイルは「土地」であって「区画」ではない。区画は src/data/sites.ts が持つ。
// 区画の riverside / meadow フラグをここから生成してはならない(SPEC §5 循環の禁止)。

import type { Point } from "@/lib/geometry";

/** 敷地境界。反時計回り */
export const SITE_BOUNDARY: readonly Point[] = [
  { x: 0, y: 0 },
  { x: 460, y: 0 },
  { x: 470, y: 180 },
  { x: 440, y: 360 },
  { x: 120, y: 380 },
  { x: 0, y: 210 },
] as const;

/** 瀬音川(架空)。北から南へ流れる。配列は上流(北)から下流(南)の順 */
export const RIVER: readonly Point[] = [
  { x: 390, y: 358 },
  { x: 398, y: 280 },
  { x: 382, y: 200 },
  { x: 396, y: 120 },
  { x: 388, y: 30 },
] as const;

/**
 * 落葉樹林の範囲。北東に草原ぶんの切り欠きがある。
 * 草原 = 敷地内でこのポリゴンの外側、と定義する(G-03)。
 */
export const FOREST: readonly Point[] = [
  { x: 5, y: 5 },
  { x: 455, y: 5 },
  { x: 464, y: 180 },
  { x: 440, y: 250 },
  { x: 330, y: 190 },
  { x: 150, y: 200 },
  { x: 140, y: 372 },
  { x: 118, y: 374 },
  { x: 5, y: 208 },
] as const;

/** 渓流沿いとみなす距離のしきい値(m)。SPEC G-03 */
export const RIVERSIDE_THRESHOLD_M = 30;

/** 場内の施設。マップの注記に使う(L2) */
export interface Facility {
  id: string;
  label: string;
  at: Point;
}

export const FACILITIES: readonly Facility[] = [
  { id: "kanri", label: "管理棟・受付", at: { x: 210, y: 32 } },
  { id: "suiji-mori", label: "炊事場(森)", at: { x: 175, y: 118 } },
  { id: "suiji-hara", label: "炊事場(草原)", at: { x: 255, y: 292 } },
  { id: "toilet-mori", label: "トイレ(森)", at: { x: 120, y: 120 } },
  { id: "toilet-hara", label: "トイレ(草原)", at: { x: 300, y: 292 } },
  { id: "kama", label: "石窯ピザ小屋", at: { x: 262, y: 40 } },
  { id: "parking", label: "共同駐車場", at: { x: 60, y: 22 } },
  { id: "mtb", label: "MTB トレイル入口", at: { x: 36, y: 168 } },
  { id: "hiroba", label: "焚火学舎ひろば", at: { x: 240, y: 40 } },
] as const;
