"use server";

// 申し込みの受け口(F-09)。
//
// **ここは何もしない。**保存も送信も課金もしない。架空の施設だからである。
// それでも Server Action として置いているのは、検証をサーバ側で行い、
// JS が無い環境でもフォームが動くようにするため(N-06)。

// 型と初期値は @/lib/reserve-state にある。"use server" のモジュールは
// 非同期関数しか export できないため、ここに置くと undefined になる。

import { reservationSchema, summarize } from "@/lib/reservation";
import type { ReserveState } from "@/lib/reserve-state";

function num(form: FormData, key: string): number {
  const raw = form.get(key);
  if (raw === null || raw === "") return Number.NaN;
  return Number(raw);
}

export async function submitReservation(
  _prev: ReserveState,
  form: FormData,
): Promise<ReserveState> {
  // 入力し直しのために、受け取った値はそのまま返す
  const values: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string") values[k] = v;
  }

  const parsed = reservationSchema.safeParse({
    type: form.get("type"),
    dateISO: form.get("dateISO"),
    nights: num(form, "nights"),
    adults: num(form, "adults"),
    children: num(form, "children"),
    infants: num(form, "infants"),
    ac: form.get("ac") === "on",
    bushcraft: form.get("bushcraft") === "on",
    name: form.get("name") ?? "",
    email: form.get("email") ?? "",
    note: form.get("note") ?? "",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!errors[key]) errors[key] = issue.message;
    }
    return { status: "error", errors, values };
  }

  return {
    status: "confirmed",
    errors: {},
    values,
    data: parsed.data,
    summary: summarize(parsed.data),
  };
}
