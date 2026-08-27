// 区画データ(SPEC §2.1)。40 区画。
//
// riverside / meadow は **区画を置いた人間の意図として手で書いたフラグ** である。
// geo.ts の座標から計算して埋めてはならない。テスト(T-006 / T-007)は、この手書きの
// フラグと、座標から独立に計算した値との一致を見ている。片方を他方から生成した瞬間、
// 照合は何も検証しなくなる(SPEC §5 循環の禁止)。

import type { Rect } from "@/lib/geometry";

export type SiteType = "seoto" | "komore" | "hidamari" | "solo" | "takibi";

export interface Pitch {
  id: string;
  type: SiteType;
  /** 場内座標(m)。中心と広さ */
  rect: Rect;
  /** 渓流沿い(瀬音川から 30 m 以内) */
  riverside: boolean;
  /** 草原(落葉樹林の外) */
  meadow: boolean;
  /** AC 電源あり */
  ac: boolean;
  /** 直火可 */
  openFire: boolean;
  /** 車の横付け可 */
  driveIn: boolean;
  /** 区画ごとの一言。短所も書く */
  note: string;
}

export interface SiteTypeMeta {
  slug: SiteType;
  name: string;
  count: number;
  ground: string;
  lede: string;
  /** その区画タイプの弱点。隠さずに書く */
  caveat: string;
}

export const SITE_TYPES: Record<SiteType, SiteTypeMeta> = {
  seoto: {
    slug: "seoto",
    name: "瀬音サイト",
    count: 8,
    ground: "砂利まじりの土",
    lede: "瀬音川の岸から十数メートル。テントの中まで水音が届く、場内でいちばん川に近い列です。",
    caveat:
      "水音は一晩じゅう止みません。静けさを求める方には向きません。雨が続いた翌日は川霧で朝の気温が下がります。",
  },
  komore: {
    slug: "komore",
    name: "木洩れサイト",
    count: 12,
    ground: "落葉と土",
    lede: "落葉樹の下。夏の日中でも直射が入らず、木洩れ日が一日じゅう動きます。",
    caveat:
      "根が浅く張っています。ペグは打つ場所を選んでください。曲がっても構わない鍛造ペグを推奨します。",
  },
  hidamari: {
    slug: "hidamari",
    name: "陽だまりサイト",
    count: 10,
    ground: "芝",
    lede: "北東の草原。八ヶ岳の稜線と、遮るもののない夜空が正面にあります。",
    caveat:
      "西風が抜けます。日没後に急に冷えるので、風下側にタープを張る前提で来てください。日陰はありません。",
  },
  solo: {
    slug: "solo",
    name: "ソロの間",
    count: 6,
    ground: "落葉と土",
    lede: "森の西端に一列。隣とは樹林で仕切られ、車は共同駐車場に置いて歩いて入ります。",
    caveat:
      "駐車場から最も遠い区画で 250 m ほど歩きます。荷車の貸し出しはありますが、台数に限りがあります。",
  },
  takibi: {
    slug: "takibi",
    name: "焚火学舎",
    count: 4,
    ground: "土と石囲い",
    lede: "場内で唯一、直火が許されている区画です。石囲いの炉が備え付けてあります。",
    caveat:
      "ブッシュクラフト講習の受講が利用条件です。受講なしでは予約できません。灰は必ず灰捨て場へ。",
  },
};

export const PITCHES: readonly Pitch[] = [
  // 瀬音サイト — 川沿いの一列。南から北へ
  { id: "SE-01", type: "seoto", rect: { x: 370, y: 35, w: 12, h: 10 }, riverside: true, meadow: false, ac: false, openFire: false, driveIn: true, note: "最下流。淵が近く、朝いちばんに竿を出せる" },
  { id: "SE-02", type: "seoto", rect: { x: 370, y: 58, w: 12, h: 10 }, riverside: true, meadow: false, ac: false, openFire: false, driveIn: true, note: "岸まで階段五段。水汲みが楽" },
  { id: "SE-03", type: "seoto", rect: { x: 370, y: 81, w: 12, h: 10 }, riverside: true, meadow: false, ac: false, openFire: false, driveIn: true, note: "頭上が開けていて、夜だけ星が見える" },
  { id: "SE-04", type: "seoto", rect: { x: 370, y: 104, w: 12, h: 10 }, riverside: true, meadow: false, ac: false, openFire: false, driveIn: true, note: "瀬の真横。水音がいちばん大きい区画" },
  { id: "SE-05", type: "seoto", rect: { x: 370, y: 127, w: 12, h: 10 }, riverside: true, meadow: false, ac: false, openFire: false, driveIn: true, note: "大きなミズナラの下。日中は涼しい" },
  { id: "SE-06", type: "seoto", rect: { x: 370, y: 150, w: 12, h: 10 }, riverside: true, meadow: false, ac: false, openFire: false, driveIn: true, note: "やや傾斜。頭を北側にすると寝やすい" },
  { id: "SE-07", type: "seoto", rect: { x: 370, y: 173, w: 12, h: 10 }, riverside: true, meadow: false, ac: false, openFire: false, driveIn: true, note: "淵と瀬の境。魚影が見えることがある" },
  { id: "SE-08", type: "seoto", rect: { x: 370, y: 196, w: 12, h: 10 }, riverside: true, meadow: false, ac: false, openFire: false, driveIn: true, note: "最上流。草原へ抜ける小径の入口が隣" },

  // 木洩れサイト — 森の中央。AC 電源は KO-01〜KO-08 の 8 区画
  { id: "KO-01", type: "komore", rect: { x: 130, y: 60, w: 12, h: 10 }, riverside: false, meadow: false, ac: true, openFire: false, driveIn: true, note: "受付から最も近い。初めての方に案内している区画" },
  { id: "KO-02", type: "komore", rect: { x: 190, y: 60, w: 12, h: 10 }, riverside: false, meadow: false, ac: true, openFire: false, driveIn: true, note: "石窯小屋まで徒歩一分" },
  { id: "KO-03", type: "komore", rect: { x: 250, y: 60, w: 12, h: 10 }, riverside: false, meadow: false, ac: true, openFire: false, driveIn: true, note: "広さは場内で二番目。大きな幕を張れる" },
  { id: "KO-04", type: "komore", rect: { x: 310, y: 60, w: 12, h: 10 }, riverside: false, meadow: false, ac: true, openFire: false, driveIn: true, note: "東端。朝日が早い" },
  { id: "KO-05", type: "komore", rect: { x: 130, y: 110, w: 12, h: 10 }, riverside: false, meadow: false, ac: true, openFire: false, driveIn: true, note: "炊事場とトイレの中間。夜も歩きやすい" },
  { id: "KO-06", type: "komore", rect: { x: 190, y: 110, w: 12, h: 10 }, riverside: false, meadow: false, ac: true, openFire: false, driveIn: true, note: "地面がいちばん平らな区画" },
  { id: "KO-07", type: "komore", rect: { x: 250, y: 110, w: 12, h: 10 }, riverside: false, meadow: false, ac: true, openFire: false, driveIn: true, note: "太い倒木がベンチ代わりに置いてある" },
  { id: "KO-08", type: "komore", rect: { x: 310, y: 110, w: 12, h: 10 }, riverside: false, meadow: false, ac: true, openFire: false, driveIn: true, note: "瀬音サイトの列が木の間から見える" },
  { id: "KO-09", type: "komore", rect: { x: 130, y: 160, w: 12, h: 10 }, riverside: false, meadow: false, ac: false, openFire: false, driveIn: true, note: "MTB トレイル入口に近い。自転車を停める余地がある" },
  { id: "KO-10", type: "komore", rect: { x: 190, y: 160, w: 12, h: 10 }, riverside: false, meadow: false, ac: false, openFire: false, driveIn: true, note: "根が最も張っている。ペグの位置に注意" },
  { id: "KO-11", type: "komore", rect: { x: 250, y: 160, w: 12, h: 10 }, riverside: false, meadow: false, ac: false, openFire: false, driveIn: true, note: "森と草原の境。両方の光が入る" },
  { id: "KO-12", type: "komore", rect: { x: 310, y: 160, w: 12, h: 10 }, riverside: false, meadow: false, ac: false, openFire: false, driveIn: true, note: "北向きにひらけ、日中でも薄暗い" },

  // 陽だまりサイト — 北東の草原。二列
  { id: "HI-01", type: "hidamari", rect: { x: 175, y: 260, w: 12, h: 10 }, riverside: false, meadow: true, ac: false, openFire: false, driveIn: true, note: "草原の西端。森が風よけになる" },
  { id: "HI-02", type: "hidamari", rect: { x: 220, y: 260, w: 12, h: 10 }, riverside: false, meadow: true, ac: false, openFire: false, driveIn: true, note: "まわりが開けていて子どもに目が届く。子ども連れに案内している" },
  { id: "HI-03", type: "hidamari", rect: { x: 265, y: 260, w: 12, h: 10 }, riverside: false, meadow: true, ac: false, openFire: false, driveIn: true, note: "芝が最も密。設営が楽" },
  { id: "HI-04", type: "hidamari", rect: { x: 310, y: 260, w: 12, h: 10 }, riverside: false, meadow: true, ac: false, openFire: false, driveIn: true, note: "北に八ヶ岳の稜線。日中の眺めがよい" },
  { id: "HI-05", type: "hidamari", rect: { x: 355, y: 260, w: 12, h: 10 }, riverside: false, meadow: true, ac: false, openFire: false, driveIn: true, note: "川の音が遠くに聞こえる。岸へは 40 m ほど" },
  { id: "HI-06", type: "hidamari", rect: { x: 175, y: 320, w: 12, h: 10 }, riverside: false, meadow: true, ac: false, openFire: false, driveIn: true, note: "北列の西端。炊事場がいちばん近いが、風も最も強く当たる" },
  { id: "HI-07", type: "hidamari", rect: { x: 220, y: 320, w: 12, h: 10 }, riverside: false, meadow: true, ac: false, openFire: false, driveIn: true, note: "場内でいちばん暗く、星がよく見える" },
  { id: "HI-08", type: "hidamari", rect: { x: 265, y: 320, w: 12, h: 10 }, riverside: false, meadow: true, ac: false, openFire: false, driveIn: true, note: "地面がわずかに北へ傾く" },
  { id: "HI-09", type: "hidamari", rect: { x: 310, y: 320, w: 12, h: 10 }, riverside: false, meadow: true, ac: false, openFire: false, driveIn: true, note: "朝、草原に霧が溜まるのを正面から見られる" },
  { id: "HI-10", type: "hidamari", rect: { x: 355, y: 320, w: 12, h: 10 }, riverside: false, meadow: true, ac: false, openFire: false, driveIn: true, note: "北東の角。隣が片側だけの区画" },

  // ソロの間 — 森の西端に縦一列。車は共同駐車場
  { id: "SO-01", type: "solo", rect: { x: 70, y: 50, w: 7, h: 7 }, riverside: false, meadow: false, ac: false, openFire: false, driveIn: false, note: "駐車場から最短。歩いて 1 分" },
  { id: "SO-02", type: "solo", rect: { x: 70, y: 95, w: 7, h: 7 }, riverside: false, meadow: false, ac: false, openFire: false, driveIn: false, note: "トイレが近い" },
  { id: "SO-03", type: "solo", rect: { x: 70, y: 140, w: 7, h: 7 }, riverside: false, meadow: false, ac: false, openFire: false, driveIn: false, note: "三方を樹林に囲まれ、隣が見えない" },
  { id: "SO-04", type: "solo", rect: { x: 70, y: 185, w: 7, h: 7 }, riverside: false, meadow: false, ac: false, openFire: false, driveIn: false, note: "MTB トレイル入口の真横" },
  { id: "SO-05", type: "solo", rect: { x: 70, y: 230, w: 7, h: 7 }, riverside: false, meadow: false, ac: false, openFire: false, driveIn: false, note: "森の奥。物音がいちばん少ない" },
  { id: "SO-06", type: "solo", rect: { x: 70, y: 275, w: 7, h: 7 }, riverside: false, meadow: false, ac: false, openFire: false, driveIn: false, note: "最も遠く、駐車場から 250 m。荷車の貸し出しあり" },

  // 焚火学舎 — 南の一角。直火可・講習受講が条件
  { id: "TA-01", type: "takibi", rect: { x: 150, y: 15, w: 10, h: 10 }, riverside: false, meadow: false, ac: false, openFire: true, driveIn: false, note: "炉が最も大きく、石窯小屋にもいちばん近い。初日の講習はここで行う" },
  { id: "TA-02", type: "takibi", rect: { x: 210, y: 15, w: 10, h: 10 }, riverside: false, meadow: false, ac: false, openFire: true, driveIn: false, note: "薪棚が隣。受講者は持ち出し自由" },
  { id: "TA-03", type: "takibi", rect: { x: 270, y: 15, w: 10, h: 10 }, riverside: false, meadow: false, ac: false, openFire: true, driveIn: false, note: "石囲いが低く、五徳を据えやすい。熾火は石窯小屋から分けてもらえる" },
  { id: "TA-04", type: "takibi", rect: { x: 330, y: 15, w: 10, h: 10 }, riverside: false, meadow: false, ac: false, openFire: true, driveIn: false, note: "東端。倒木の伐り出し場へ最短" },
] as const;

export function pitchesOfType(type: SiteType): Pitch[] {
  return PITCHES.filter((p) => p.type === type);
}

export function findPitch(id: string): Pitch | undefined {
  return PITCHES.find((p) => p.id === id);
}
