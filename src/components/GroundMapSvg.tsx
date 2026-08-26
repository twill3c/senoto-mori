// 場内図(F-01)。**画像ではなく DOM である。**
//
// 区画ひとつひとつが data-site-id を持つ要素として出るので、絞り込みも空き状況も
// 図の見た目に直結する。G-01(tests/ground-map.test.tsx)は、ここが出力した HTML から
// data-site-id を拾って、区画データの ID 集合と突き合わせている。
//
// このコンポーネントは状態を持たない。クリックの受け口は親(GroundMap)が
// svg 全体への委譲で用意する。そのおかげでテストはこれを単体で描画できる。

import { FACILITIES, FOREST, RIVER, SITE_BOUNDARY } from "@/data/geo";
import type { Pitch } from "@/data/sites";
import type { PitchStatus } from "@/lib/availability";
import { projectPoint, projectPolygon, projectPolyline, projectRect, viewBoxAttr } from "@/lib/map-projection";
import "./map.css";

export interface GroundMapSvgProps {
  pitches: readonly Pitch[];
  /** 絞り込みに該当する区画。渡さなければ全件が該当扱い */
  matched?: ReadonlySet<string>;
  /** 日付を選んだときの空き。渡さなければ unknown */
  statuses?: ReadonlyMap<string, PitchStatus>;
  selected?: string | null;
  titleId?: string;
  descId?: string;
}

const STATUS_TEXT: Record<PitchStatus | "unknown", string> = {
  open: "空きあり",
  booked: "満",
  unknown: "日付未選択",
};

export function GroundMapSvg({
  pitches,
  matched,
  statuses,
  selected = null,
  titleId = "groundmap-title",
  descId = "groundmap-desc",
}: GroundMapSvgProps) {
  return (
    <svg
      className="gmap"
      viewBox={viewBoxAttr()}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={titleId}>瀬音の杜 場内図</title>
      <desc id={descId}>
        {`敷地の東縁を瀬音川が南北に流れ、北東が草原、残りが落葉樹の森です。${pitches.length} の区画が描かれています。`}
      </desc>

      {/* 草原は「森でないところ」。敷地全体を草原色で敷き、その上に森を重ねる */}
      <path id="ground-meadow" className="gmap__meadow" d={projectPolygon(SITE_BOUNDARY)} />
      <path id="ground-forest" className="gmap__forest" d={projectPolygon(FOREST)} />
      <path id="ground-boundary" className="gmap__boundary" d={projectPolygon(SITE_BOUNDARY)} />
      <path id="ground-river" className="gmap__river" d={projectPolyline(RIVER)} />

      <g className="gmap__facilities">
        {FACILITIES.map((f) => {
          const at = projectPoint(f.at);
          return (
            <g key={f.id}>
              <circle className="gmap__facility-dot" cx={at.x} cy={at.y} r={3} />
              <text className="gmap__facility-label" x={at.x + 6} y={at.y + 3}>
                {f.label}
              </text>
            </g>
          );
        })}
      </g>

      <g className="gmap__pitches">
        {pitches.map((p) => {
          const r = projectRect(p.rect);
          const status = statuses?.get(p.id) ?? "unknown";
          const dim = matched ? !matched.has(p.id) : false;
          return (
            <g
              key={p.id}
              data-site-id={p.id}
              data-dim={dim ? "true" : "false"}
              data-type={p.type}
              data-status={status}
              data-selected={selected === p.id ? "true" : "false"}
              className="gmap__pitch"
              tabIndex={0}
              role="button"
              aria-label={`${p.id} ${p.note} ${STATUS_TEXT[status]}`}
            >
              {/* React は <title> に単一のテキスト子要素しか許さない。
                  複数の式に割ると中身が落ちる(loop_002 で踏んだ) */}
              <title>{`${p.id} — ${STATUS_TEXT[status]}`}</title>
              <rect
                className="gmap__pitch-rect"
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                rx={1}
              />
              <text
                className="gmap__pitch-label"
                x={r.x + r.width / 2}
                y={r.y + r.height / 2 + 1.8}
              >
                {p.id.slice(-2)}
              </text>
            </g>
          );
        })}
      </g>

      {/* 方位。北が上であることを図の中で示す */}
      <g className="gmap__compass" aria-hidden="true">
        <text className="gmap__compass-label" x={22} y={26}>
          北 ↑
        </text>
      </g>
    </svg>
  );
}
