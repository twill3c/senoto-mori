"use client";

// 申込フォーム(F-09 / N-02 / N-06)。
//
// useActionState を使うので、JS があれば画面遷移なしに確認へ進む。JS が無ければ
// 素の form POST として同じ Server Action に届き、同じ検証を通って同じ画面が返る。
// どちらでも動くのが要点で、そのために入力欄はすべて素の HTML のままにしてある。

import { cloneElement, isValidElement, useActionState } from "react";
import Link from "next/link";
import { submitReservation } from "@/app/reserve/actions";
import { INITIAL_STATE } from "@/lib/reserve-state";
import { SITE_TYPES, type SiteType } from "@/data/sites";
import { MAX_NIGHTS } from "@/lib/reservation";
import { formatYen } from "@/lib/pricing";
import { seasonRange } from "@/lib/season";
import "./form.css";

const TYPE_ORDER: SiteType[] = ["seoto", "komore", "hidamari", "solo", "takibi"];

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  // 入力欄そのものに説明とエラーを結び付ける。読み上げでは、これが無いと
  // 「なぜ弾かれたのか」が入力欄に焦点を当てた人に届かない(N-02)
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        "aria-describedby": describedBy === "" ? undefined : describedBy,
        "aria-invalid": error ? "true" : undefined,
      })
    : children;
  return (
    <div className="field" data-invalid={error ? "true" : "false"}>
      <label htmlFor={id}>{label}</label>
      {control}
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function ReserveForm({
  year,
  date,
  onDateChange,
}: {
  year: number;
  /** カレンダーと共有する到着日。親が持つ */
  date: string;
  onDateChange: (dateISO: string) => void;
}) {
  const [state, action, pending] = useActionState(submitReservation, INITIAL_STATE);
  const season = seasonRange(year);
  const v = state.values;
  const e = state.errors;

  if (state.status === "confirmed" && state.data && state.summary) {
    const d = state.data;
    const s = state.summary;
    return (
      <section className="confirm" aria-live="polite">
        <div className="notice">
          <strong>これは架空のキャンプ場です。予約は成立していません。</strong>
          <br />
          いま入力された内容はどこにも保存されておらず、誰にも届いていません。
          下は「もし実在したらこうなる」という見積もりです。
        </div>

        <h2>ご確認</h2>
        <div className="scroll-x">
          <table>
            <tbody>
              <tr>
                <th>区画</th>
                <td>{SITE_TYPES[d.type].name}</td>
              </tr>
              <tr>
                <th>日程</th>
                <td>
                  {d.dateISO} から {d.nights} 泊(チェックアウト {s.checkoutISO})
                </td>
              </tr>
              <tr>
                <th>人数</th>
                <td>
                  大人 {d.adults} 名 ／ 小学生 {d.children} 名 ／ 未就学児 {d.infants} 名
                </td>
              </tr>
              <tr>
                <th>AC 電源</th>
                <td>{d.ac ? "あり" : "なし"}</td>
              </tr>
              <tr>
                <th>お名前</th>
                <td>{d.name}</td>
              </tr>
              <tr>
                <th>ご連絡先</th>
                <td>{d.email}</td>
              </tr>
              {d.note !== "" && (
                <tr>
                  <th>ご要望</th>
                  <td>{d.note}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2>お見積もり</h2>
        <div className="scroll-x">
          <table>
            <thead>
              <tr>
                <th>泊</th>
                <th>区分</th>
                <th className="num">区画料</th>
                <th className="num">人数料</th>
                <th className="num">AC</th>
                <th className="num">小計</th>
              </tr>
            </thead>
            <tbody>
              {s.nights.map((n) => (
                <tr key={n.dateISO}>
                  <th>{n.dateISO}</th>
                  <td>{n.peak ? `繁忙期(${n.reason})` : "通常期"}</td>
                  <td className="num">{formatYen(n.pitchFee)}</td>
                  <td className="num">{formatYen(n.personFee)}</td>
                  <td className="num">{n.acFee === 0 ? "—" : formatYen(n.acFee)}</td>
                  <td className="num">{formatYen(n.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={5}>合計</th>
                <td className="num">
                  <strong>{formatYen(s.total)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="prose">
          泊ごとに区分が変わるのは、繁忙期の判定が日単位だからです。判定の条件は{" "}
          <Link href="/price">料金</Link> にすべて出しています。
        </p>
        <p>
          <a className="button" href="/reserve">
            入力し直す
          </a>
        </p>
      </section>
    );
  }

  return (
    <form action={action} className="form" noValidate>
      {e.form && (
        <p className="field__error" role="alert">
          {e.form}
        </p>
      )}

      <Field id="type" label="区画" error={e.type}>
        <select id="type" name="type" defaultValue={v.type ?? "komore"} required>
          {TYPE_ORDER.map((slug) => (
            <option key={slug} value={slug}>
              {SITE_TYPES[slug].name}（{SITE_TYPES[slug].count} 区画）
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="dateISO"
        label="到着日"
        hint={`${season.from} 〜 ${season.to} の間でお選びください`}
        error={e.dateISO}
      >
        <input
          id="dateISO"
          name="dateISO"
          type="date"
          min={season.from}
          max={season.to}
          value={date}
          onChange={(ev) => onDateChange(ev.target.value)}
          required
        />
      </Field>

      <Field id="nights" label="泊数" hint={`${MAX_NIGHTS} 泊まで`} error={e.nights}>
        <input
          id="nights"
          name="nights"
          type="number"
          min={1}
          max={MAX_NIGHTS}
          defaultValue={v.nights ?? "1"}
          required
        />
      </Field>

      <div className="form__row">
        <Field id="adults" label="大人" error={e.adults}>
          <input id="adults" name="adults" type="number" min={1} max={6} defaultValue={v.adults ?? "2"} required />
        </Field>
        <Field id="children" label="小学生" error={e.children}>
          <input id="children" name="children" type="number" min={0} max={5} defaultValue={v.children ?? "0"} required />
        </Field>
        <Field id="infants" label="未就学児" hint="無料です" error={e.infants}>
          <input id="infants" name="infants" type="number" min={0} max={5} defaultValue={v.infants ?? "0"} required />
        </Field>
      </div>

      <div className="field field--check">
        <input id="ac" name="ac" type="checkbox" defaultChecked={v.ac === "on"} />
        <label htmlFor="ac">AC 電源を使う（木洩れサイトのみ・1 泊 1,000 円）</label>
        {e.ac && (
          <p className="field__error" role="alert">
            {e.ac}
          </p>
        )}
      </div>

      <div className="field field--check">
        <input id="bushcraft" name="bushcraft" type="checkbox" defaultChecked={v.bushcraft === "on"} />
        <label htmlFor="bushcraft">ブッシュクラフト講習を受講済み（焚火学舎に必要）</label>
        {e.bushcraft && (
          <p className="field__error" role="alert">
            {e.bushcraft}
          </p>
        )}
      </div>

      <Field id="name" label="お名前" error={e.name}>
        <input id="name" name="name" type="text" autoComplete="name" defaultValue={v.name ?? ""} required />
      </Field>

      <Field
        id="email"
        label="ご連絡先（メール）"
        hint="架空のサイトなので、実際には送信も返信もありません"
        error={e.email}
      >
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email ?? ""} required />
      </Field>

      <Field id="note" label="ご要望（任意）" error={e.note}>
        <textarea id="note" name="note" rows={3} defaultValue={v.note ?? ""} />
      </Field>

      <button type="submit" className="button" disabled={pending}>
        {pending ? "確認しています…" : "内容を確認する"}
      </button>
      <p className="form__foot">
        押しても予約は成立しません。入力内容は保存も送信もされません。
      </p>
    </form>
  );
}
