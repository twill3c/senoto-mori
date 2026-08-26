"use client";

// 場内図・絞り込み・日付を束ねる(F-01 / F-02 / F-03)。
//
// 状態はここだけが持つ。図(GroundMapSvg)は状態を持たない純粋な描画なので、
// テストは図を単体で描いて G-01 を掛けられる。
//
// JS が無い環境では、この木は初期状態のまま静的に描かれる —— 図は出るが操作はできない。
// そのぶん、下の全区画表(サーバ側で描いている)が本文として残る(N-06)。

import { useCallback, useMemo, useState } from "react";
import { GroundMapSvg } from "@/components/GroundMapSvg";
import { PITCHES, SITE_TYPES, findPitch, type SiteType } from "@/data/sites";
import { PITCH_FEE } from "@/data/pricing";
import { dayAvailability, typeLabel, type PitchStatus } from "@/lib/availability";
import { FILTERS, applyFilters, type FilterKey } from "@/lib/filters";
import { formatYen, isPeak, peakReason } from "@/lib/pricing";
import { isOpenDate, seasonRange } from "@/lib/season";
import "./explorer.css";

const TYPE_ORDER: SiteType[] = ["seoto", "komore", "hidamari", "solo", "takibi"];

export function StayExplorer({ year }: { year: number }) {
  const season = seasonRange(year);
  const [date, setDate] = useState("");
  const [keys, setKeys] = useState<FilterKey[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const dateUsable = date !== "" && isOpenDate(date);

  const availability = useMemo(
    () => (dateUsable ? dayAvailability(date) : null),
    [date, dateUsable],
  );

  const statuses = availability?.byPitch as ReadonlyMap<string, PitchStatus> | undefined;

  const matched = useMemo(
    () => new Set(applyFilters(PITCHES, keys).map((p) => p.id)),
    [keys],
  );

  const toggle = useCallback((key: FilterKey) => {
    setKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }, []);

  // svg 全体で受けて、押された区画へ委譲する。
  // 区画ごとにハンドラを付けないので、図の側は状態も関数も持たずに済む。
  const pickFrom = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Element)) return;
    const g = target.closest("[data-site-id]");
    const id = g?.getAttribute("data-site-id");
    if (id) setSelected((prev) => (prev === id ? null : id));
  }, []);

  const pitch = selected ? findPitch(selected) : undefined;
  const selectedStatus = pitch && statuses ? statuses.get(pitch.id) : undefined;

  return (
    <div className="explorer">
      <div className="explorer__controls">
        <div className="explorer__field">
          <label htmlFor="explorer-date">日付</label>
          <input
            id="explorer-date"
            type="date"
            value={date}
            min={season.from}
            max={season.to}
            onChange={(e) => setDate(e.target.value)}
          />
          <p className="explorer__hint">
            {date === ""
              ? `選ぶと空きが図に出ます(${year} 年は ${season.from} 〜 ${season.to})`
              : dateUsable
                ? isPeak(date)
                  ? `繁忙期です(${peakReason(date)})`
                  : "通常期です"
                : "この日は閉場しています"}
          </p>
        </div>

        <fieldset className="explorer__filters">
          <legend>絞り込み</legend>
          {FILTERS.map((f) => {
            const on = keys.includes(f.key);
            return (
              <button
                key={f.key}
                type="button"
                className="explorer__chip"
                aria-pressed={on}
                title={f.hint}
                onClick={() => toggle(f.key)}
              >
                {f.label}
              </button>
            );
          })}
          {keys.length > 0 && (
            <button type="button" className="explorer__clear" onClick={() => setKeys([])}>
              解除
            </button>
          )}
        </fieldset>
      </div>

      <p className="explorer__count" aria-live="polite">
        {keys.length === 0
          ? `全 ${PITCHES.length} 区画`
          : `該当 ${matched.size} / ${PITCHES.length} 区画`}
        {availability && ` ／ この日の空き ${availability.open} 区画`}
      </p>

      <div className="explorer__body">
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: 委譲先の区画が role="button" と tabIndex を持ち、キーボードは onKeyDown で拾っている */}
        <div
          className="explorer__map"
          onClick={(e) => pickFrom(e.target)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              const el = e.target as Element;
              if (el.closest("[data-site-id]")) {
                e.preventDefault();
                pickFrom(e.target);
              }
            }
          }}
        >
          <GroundMapSvg
            pitches={PITCHES}
            matched={keys.length > 0 ? matched : undefined}
            statuses={statuses}
            selected={selected}
          />
        </div>

        <aside className="explorer__pane" aria-live="polite">
          {pitch ? (
            <>
              <p className="card__meta">{SITE_TYPES[pitch.type].name}</p>
              <h3 className="explorer__pane-title">{pitch.id}</h3>
              <p className="explorer__pane-note">{pitch.note}</p>
              <dl className="explorer__dl">
                <dt>広さ</dt>
                <dd>
                  {pitch.rect.w} × {pitch.rect.h} m
                </dd>
                <dt>地面</dt>
                <dd>{SITE_TYPES[pitch.type].ground}</dd>
                <dt>川沿い</dt>
                <dd>{pitch.riverside ? "はい(30 m 以内)" : "いいえ"}</dd>
                <dt>まわり</dt>
                <dd>{pitch.meadow ? "草原" : "林間"}</dd>
                <dt>車</dt>
                <dd>{pitch.driveIn ? "横付けできます" : "共同駐車場から徒歩"}</dd>
                <dt>直火</dt>
                <dd>{pitch.openFire ? "できます" : "焚火台をお使いください"}</dd>
                <dt>AC 電源</dt>
                <dd>{pitch.ac ? "あります" : "ありません"}</dd>
                <dt>区画料</dt>
                <dd>
                  {dateUsable
                    ? formatYen(isPeak(date) ? PITCH_FEE[pitch.type].peak : PITCH_FEE[pitch.type].normal)
                    : `${formatYen(PITCH_FEE[pitch.type].normal)} 〜 ${formatYen(PITCH_FEE[pitch.type].peak)}`}
                </dd>
                {selectedStatus && (
                  <>
                    <dt>{date} の状況</dt>
                    <dd>{selectedStatus === "open" ? "空きあり" : "満"}</dd>
                  </>
                )}
              </dl>
              <p className="explorer__caveat">{SITE_TYPES[pitch.type].caveat}</p>
              <button type="button" className="explorer__clear" onClick={() => setSelected(null)}>
                閉じる
              </button>
            </>
          ) : (
            <p className="explorer__empty">
              図の区画を選ぶと、ここに詳細が出ます。日付を選ぶと空きの色が付きます。
            </p>
          )}
        </aside>
      </div>

      {availability && (
        <div className="scroll-x">
          <table>
            <caption className="card__meta">{date} の空き</caption>
            <thead>
              <tr>
                <th>区画</th>
                <th className="num">空き</th>
                <th>状況</th>
                <th className="num">区画料</th>
              </tr>
            </thead>
            <tbody>
              {TYPE_ORDER.map((slug) => {
                const a = availability.byType[slug];
                return (
                  <tr key={slug}>
                    <th>{SITE_TYPES[slug].name}</th>
                    <td className="num">
                      {a.open} / {a.total}
                    </td>
                    <td>{typeLabel(a.open, a.total)}</td>
                    <td className="num">
                      {formatYen(
                        availability.peak ? PITCH_FEE[slug].peak : PITCH_FEE[slug].normal,
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
