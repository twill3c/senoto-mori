"use client";

// カレンダーと申込フォームを束ねる(F-09)。
// 日付という一つの値を両者が共有するので、状態はここだけが持つ。

import { useState } from "react";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { ReserveForm } from "@/components/ReserveForm";
import type { CalendarMonth } from "@/lib/calendar";

export function ReservePanel({ year, initialMonth }: { year: number; initialMonth: CalendarMonth }) {
  const [date, setDate] = useState("");

  return (
    <>
      <h2>空き状況</h2>
      <AvailabilityCalendar initial={initialMonth} selected={date} onSelect={setDate} />

      <h2>お申し込み</h2>
      <ReserveForm year={year} date={date} onDateChange={setDate} />
    </>
  );
}
