// 月ごとの空き状況(F-09)。
//
// 中身は決定論的な純関数なので、本来なら静的に焼ける。それでも Route Handler に
// 置いて ISR(60 秒)を掛けているのは、実運用でここが予約台帳を引く場所になるためである。
// 差し替える先を最初から用意しておく、という以上の意味は無い。

import { NextResponse } from "next/server";
import { buildMonth, seasonMonths } from "@/lib/calendar";

export const revalidate = 60;

/** 開場期間にかかる月だけを静的に焼き、それ以外は都度 404 を返す */
export function generateStaticParams() {
  return seasonMonths(2026).map((month) => ({ month }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ month: string }> },
) {
  const { month } = await params;
  try {
    return NextResponse.json(buildMonth(month));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "月を解釈できません" },
      { status: 404 },
    );
  }
}
