// 申し込みフォームの状態(F-09)。
//
// **"use server" のモジュールは非同期関数しか export できない。**
// 定数や型をそちらに置くと、クライアントから見たときに undefined になり、
// ビルド時のプリレンダリングで落ちる(loop_003 で踏んだ)。だからここに分けてある。

import type { Reservation, ReservationSummary } from "@/lib/reservation";

export interface ReserveState {
  status: "idle" | "error" | "confirmed";
  /** 項目名 → メッセージ */
  errors: Record<string, string>;
  values: Record<string, string>;
  data?: Reservation;
  summary?: ReservationSummary;
}

export const INITIAL_STATE: ReserveState = { status: "idle", errors: {}, values: {} };
