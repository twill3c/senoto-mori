// 気温早見表(F-07)。
//
// 甲府の値は外部権威。当地の値は「甲府 − 設定差分」で導出する。導出式そのものが正本であり、
// 月ごとの数値を手で書き並べてはいない(書き並べると、後から式を変えたとき表だけが古くなる)。
//
// 出典: 気象庁「過去の気象データ検索 — 平年値(月ごとの値)」甲府 / 統計期間 1991–2020
//       https://www.data.jma.go.jp/stats/etrn/view/nml_sfc_ym.php?prec_no=49&block_no=47638
//       2026-08-27 取得。抜き出したのは「日最低気温(℃)」の欄。

/** 甲府の日最低気温 平年値(℃)。添字 0 = 1 月 */
export const KOFU_MIN_NORMALS: readonly number[] = [
  -2.1, -0.7, 3.1, 8.4, 13.7, 18.3, 22.3, 23.3, 19.4, 13.0, 5.9, 0.3,
] as const;

/**
 * 当地が甲府より低い分(℃)。**架空のキャンプ場の設定値**である。
 *
 * 根拠としては、標高差およそ 780 m に気温減率 0.6 ℃/100 m を当てた 4.7 ℃ を採っている。
 * ただし甲府地方気象台の標高を外部権威として確定できなかったため(2026-08-27 時点)、
 * 標高差から毎回計算する形は採らず、差分そのものを設定として固定した。
 * ここを動かせば早見表と本文の数字は一斉に動く。
 */
export const ELEVATION_OFFSET_C = 4.7;

/** 当地の標高(m)。SPEC §2 の設定 */
export const SITE_ELEVATION_M = 1050;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** 当地の日最低気温(℃)。添字 0 = 1 月 */
export function siteMinNormals(): number[] {
  return KOFU_MIN_NORMALS.map((v) => round1(v - ELEVATION_OFFSET_C));
}

export interface GuideRow {
  month: number;
  kofu: number;
  site: number;
  /** その月の朝をどう過ごすことになるか。数字だけでは伝わらない部分 */
  advice: string;
}

const ADVICE: Record<number, string> = {
  4: "開場したてです。氷点下まで下がる朝があります。冬用の寝袋と、火のそばで羽織るものを。",
  5: "日中は汗ばみ、朝は息が白い。この落差がいちばん大きい月です。",
  6: "梅雨。雨よりも、濡れたあとの冷えに備えてください。着替えを一組多めに。",
  7: "いちばん過ごしやすい月。それでも朝は 17 ℃ 前後、薄手の上着は要ります。",
  8: "平地が猛暑でも、ここは朝 18 ℃ 台。日中の直射だけは草原サイトで強く出ます。",
  9: "下旬から急に冷えます。渓流釣りは末日で禁漁、水にも入らなくなる時期です。",
  10: "紅葉期。朝は一桁台まで落ちます。焚火の時間がいちばん長くなる月です。",
  11: "閉場までのひと月。朝の平年値は 1 ℃ 台で、冷え込んだ日は氷点下です。水道が凍る朝があり、炊事場の一部を止めます。",
};

/** 開場期間の 8 か月(4–11 月)だけを返す */
export function guideTable(): GuideRow[] {
  const site = siteMinNormals();
  const rows: GuideRow[] = [];
  for (let month = 4; month <= 11; month++) {
    rows.push({
      month,
      kofu: KOFU_MIN_NORMALS[month - 1],
      site: site[month - 1],
      advice: ADVICE[month],
    });
  }
  return rows;
}
