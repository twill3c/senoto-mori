// 申し込みの検証と見積もり(F-09)。
//
// **送っても何も起きない。**それでも検証は本気で通す —— 通らない入力を受け付けると、
// 確認画面に出る金額が嘘になる。嘘の金額を出すくらいなら、架空の施設でも断る。
//
// 制約の出どころは SPEC §2.1 / §2.2 だけ。ここで新しい決まりを発明しない。

import { z } from "zod";
import { MAX_HEADS_PER_PITCH } from "@/data/pricing";
import { SITE_TYPES, type SiteType } from "@/data/sites";
import { quote, type Quote } from "@/lib/pricing";
import { isOpenDate, parseISODate, toISODate } from "@/lib/season";

const SITE_SLUGS = Object.keys(SITE_TYPES) as [SiteType, ...SiteType[]];

export const MAX_NIGHTS = 7;

const base = z.object({
  type: z.enum(SITE_SLUGS, { message: "区画をお選びください" }),
  dateISO: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "日付をお選びください" })
    .refine((v) => isOpenDate(v), { message: "その日は閉場しています(開場は 4/18〜11/30)" }),
  nights: z
    .number({ message: "泊数を入力してください" })
    .int({ message: "泊数は整数で入力してください" })
    .min(1, { message: "泊数は 1 泊以上でお願いします" })
    .max(MAX_NIGHTS, { message: `続けてお泊まりいただけるのは ${MAX_NIGHTS} 泊までです` }),
  adults: z
    .number({ message: "大人の人数を入力してください" })
    .int({ message: "人数は整数で入力してください" })
    .min(1, { message: "大人は 1 名以上でお申し込みください" }),
  children: z
    .number({ message: "小学生の人数を入力してください" })
    .int({ message: "人数は整数で入力してください" })
    .min(0, { message: "人数は 0 名以上で入力してください" }),
  infants: z
    .number({ message: "未就学児の人数を入力してください" })
    .int({ message: "人数は整数で入力してください" })
    .min(0, { message: "人数は 0 名以上で入力してください" }),
  ac: z.boolean(),
  /** 焚火学舎を選ぶときの、ブッシュクラフト講習の受講確認 */
  bushcraft: z.boolean().default(false),
  name: z
    .string()
    .trim()
    .min(1, { message: "お名前を入力してください" })
    .max(60, { message: "お名前が長すぎます(60 文字まで)" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "ご連絡先のメールアドレスを入力してください" })
    .email({ message: "メールアドレスの形をご確認ください" }),
  note: z.string().trim().max(400, { message: "ご要望は 400 文字までです" }).default(""),
});

export const reservationSchema = base
  .refine((v) => v.adults + v.children <= MAX_HEADS_PER_PITCH, {
    message: `1 区画は未就学児を除いて ${MAX_HEADS_PER_PITCH} 名までです`,
    path: ["adults"],
  })
  .refine((v) => !v.ac || v.type === "komore", {
    message: "AC 電源は木洩れサイトの一部区画にのみございます",
    path: ["ac"],
  })
  .refine((v) => v.type !== "takibi" || v.bushcraft, {
    message: "焚火学舎はブッシュクラフト講習を受けた方のみご利用いただけます",
    path: ["bushcraft"],
  })
  .refine(
    (v) => {
      // 最終泊の日まで開場していること。11/30 に 2 泊すると 12/1 まで居ることになる
      const start = parseISODate(v.dateISO);
      const last = new Date(start.getTime());
      last.setUTCDate(last.getUTCDate() + v.nights - 1);
      return isOpenDate(toISODate(last));
    },
    { message: "ご滞在が閉場日にかかります。泊数か日付をご調整ください", path: ["nights"] },
  );

export type Reservation = z.infer<typeof reservationSchema>;

export interface NightLine extends Quote {
  dateISO: string;
}

export interface ReservationSummary {
  nights: NightLine[];
  total: number;
  /** 最終日の翌朝がチェックアウト */
  checkoutISO: string;
}

/** 泊ごとに quote() を引いて足す。料金の正本は pricing.ts のひとつだけ */
export function summarize(input: Reservation): ReservationSummary {
  const start = parseISODate(input.dateISO);
  const nights: NightLine[] = [];

  for (let i = 0; i < input.nights; i++) {
    const d = new Date(start.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    const dateISO = toISODate(d);
    nights.push({
      dateISO,
      ...quote({
        type: input.type,
        dateISO,
        adults: input.adults,
        children: input.children,
        infants: input.infants,
        ac: input.ac,
      }),
    });
  }

  const checkout = new Date(start.getTime());
  checkout.setUTCDate(checkout.getUTCDate() + input.nights);

  return {
    nights,
    total: nights.reduce((n, x) => n + x.total, 0),
    checkoutISO: toISODate(checkout),
  };
}
