"use client";

// 空きカレンダー(F-09)。
//
// 初回の月はサーバで組んで渡す。月を送ると Route Handler(/api/availability/[month]、
// ISR 60 秒)から取り直す。JS が無ければ最初の月が静的に表示されたままになり、
// 日付は入力欄に直接打ち込める —— 使えなくはならない(N-06)。

import { useState } from "react";
import { PITCHES } from "@/data/sites";
import { monthLabel, shiftMonth, type CalendarMonth } from "@/lib/calendar";
import "./calendar.css";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 空きの多寡を三段で表す。図と同じ語彙にそろえる */
function density(open: number): "ample" | "few" | "full" {
  if (open <= 0) return "full";
  return open <= Math.max(1, Math.floor(PITCHES.length * 0.25)) ? "few" : "ample";
}

export function AvailabilityCalendar({
  initial,
  selected,
  onSelect,
}: {
  initial: CalendarMonth;
  selected: string;
  onSelect: (dateISO: string) => void;
}) {
  const [month, setMonth] = useState<CalendarMonth>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prev = shiftMonth(month.key, -1);
  const next = shiftMonth(month.key, 1);

  async function go(key: string | null) {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/availability/${key}`);
      if (!res.ok) throw new Error(`${key} を取得できませんでした`);
      setMonth((await res.json()) as CalendarMonth);
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cal" data-loading={loading ? "true" : "false"}>
      <div className="cal__head">
        <button type="button" onClick={() => go(prev)} disabled={!prev || loading}>
          ← 前の月
        </button>
        <h3 className="cal__title">{monthLabel(month.key)}</h3>
        <button type="button" onClick={() => go(next)} disabled={!next || loading}>
          次の月 →
        </button>
      </div>

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      {/* role="grid" は行(role="row")の入れ子を要求する。CSS の一次元グリッドに
          その役割を被せると、支援技術には壊れた表として渡る(loop_004 で Lighthouse が指摘)。
          日付は各ボタンの読み上げ名が持っているので、ここは素のボタンの並びにする */}
      <div className="cal__grid" aria-label={`${monthLabel(month.key)} の空き状況`}>
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal__weekday" aria-hidden="true">
            {w}
          </div>
        ))}
        {Array.from({ length: month.leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} className="cal__blank" aria-hidden="true" />
        ))}
        {month.days.map((d) => {
          const day = Number(d.dateISO.slice(-2));
          if (!d.selectable || d.open === null) {
            return (
              <div key={d.dateISO} className="cal__day cal__day--closed">
                <span className="cal__num">{day}</span>
                <span className="cal__mark">閉場</span>
              </div>
            );
          }
          return (
            <button
              key={d.dateISO}
              type="button"
              className="cal__day"
              data-density={density(d.open)}
              data-peak={d.peak ? "true" : "false"}
              aria-pressed={selected === d.dateISO}
              onClick={() => onSelect(d.dateISO)}
            >
              <span className="cal__num">{day}</span>
              <span className="cal__mark">{d.open === 0 ? "満" : `空 ${d.open}`}</span>
              {/* aria-label で名前を上書きすると、目に見えている文字と読み上げ名が
                  食い違い、音声で操作する人が見えている語で指示できなくなる。
                  見えている文字を残したまま、続きとして文脈を足す */}
              <span className="visually-hidden">
                {` ${d.dateISO}${d.peak ? " 繁忙期" : ""}`}
              </span>
            </button>
          );
        })}
      </div>

      <p className="cal__legend">
        <span data-density="ample">空きあり</span>
        <span data-density="few">残りわずか</span>
        <span data-density="full">満</span>
        <span data-peak="true">繁忙期</span>
      </p>
    </div>
  );
}
