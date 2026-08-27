import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { FACILITIES, RIVER } from "@/data/geo";
import { PITCHES, SITE_TYPES, findPitch, type Pitch, type SiteType } from "@/data/sites";
import { distanceToPolyline, type Point } from "@/lib/geometry";

// T-200 台: 本文中の「位置の主張」が座標と合っているか(G-16)
//
// 起票の経緯(loop_006): HI-04 の紹介文が「南に八ヶ岳」と言っていた。
// この場所は八ヶ岳**南麓**なので、八ヶ岳は北にある。読めば分かる誤りだが、
// 型検査も既存のゲートも素通りした。
//
// さらに全件洗ったところ、L4 で施設の注記の重なりを直すために座標を動かしたとき、
// 「石窯小屋に近く」「炊事場が正面」という本文が取り残されて嘘になっていた。
// **地形を動かすと本文が古くなる**が、本文はどこからも参照されないので誰も気づかない。
//
// そこで、位置の主張を機械が読める形で下に**書き写し**、
//   (a) 本文に語句がまだ含まれていること
//   (b) 主張が座標から計算して成り立つこと
// の両方を検査する。本文を書き換えれば (a) が落ち、座標を動かせば (b) が落ちる。

const F = Object.fromEntries(FACILITIES.map((f) => [f.id, f.at]));
const center = (p: Pitch): Point => ({ x: p.rect.x, y: p.rect.y });
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const ofType = (t: SiteType) => PITCHES.filter((p) => p.type === t);

/** その施設にいちばん近い、指定タイプの区画 */
function nearestTo(type: SiteType, facilityId: string): string {
  const at = F[facilityId];
  return ofType(type).reduce((m, p) => (dist(center(p), at) < dist(center(m), at) ? p : m)).id;
}

/** 歩く速さの目安。荷物を持って 80 m/分 */
const WALK_M_PER_MIN = 80;

interface Claim {
  id: string;
  /** 本文に必ず含まれていなければならない語句 */
  phrase: string;
  /** 座標から計算して成り立つこと */
  holds: () => boolean;
  /** 落ちたときに何を見ればよいか */
  detail: () => string;
}

const CLAIMS: Claim[] = [
  {
    id: "SE-01",
    phrase: "最下流",
    // 瀬音川は北から南へ流れる(geo.ts の RIVER は上流から下流の順)。下流 = y が小さい
    holds: () => ofType("seoto").every((p) => p.rect.y >= (findPitch("SE-01") as Pitch).rect.y),
    detail: () => `最も y が小さい seoto は ${ofType("seoto").reduce((m, p) => (p.rect.y < m.rect.y ? p : m)).id}`,
  },
  {
    id: "SE-08",
    phrase: "最上流",
    holds: () => ofType("seoto").every((p) => p.rect.y <= (findPitch("SE-08") as Pitch).rect.y),
    detail: () => `最も y が大きい seoto は ${ofType("seoto").reduce((m, p) => (p.rect.y > m.rect.y ? p : m)).id}`,
  },
  {
    id: "KO-01",
    phrase: "受付から最も近い",
    holds: () => nearestTo("komore", "kanri") === "KO-01",
    detail: () => `受付に最も近い komore は ${nearestTo("komore", "kanri")}`,
  },
  {
    id: "KO-02",
    phrase: "徒歩一分",
    holds: () => {
      const m = dist(center(findPitch("KO-02") as Pitch), F.kama) / WALK_M_PER_MIN;
      return m <= 2;
    },
    detail: () =>
      `KO-02 から石窯まで ${Math.round(dist(center(findPitch("KO-02") as Pitch), F.kama))} m`,
  },
  {
    id: "KO-04",
    phrase: "東端",
    holds: () => ofType("komore").every((p) => p.rect.x <= (findPitch("KO-04") as Pitch).rect.x),
    detail: () => `最も東の komore は ${ofType("komore").reduce((m, p) => (p.rect.x > m.rect.x ? p : m)).id}`,
  },
  {
    id: "KO-05",
    phrase: "炊事場とトイレの中間",
    holds: () => {
      const c = center(findPitch("KO-05") as Pitch);
      const a = dist(c, F["suiji-mori"]);
      const b = dist(c, F["toilet-mori"]);
      return Math.abs(a - b) <= Math.max(a, b) * 0.2;
    },
    detail: () => {
      const c = center(findPitch("KO-05") as Pitch);
      return `炊事場まで ${Math.round(dist(c, F["suiji-mori"]))} m / トイレまで ${Math.round(dist(c, F["toilet-mori"]))} m`;
    },
  },
  {
    id: "KO-09",
    phrase: "MTB トレイル入口に近い",
    holds: () => nearestTo("komore", "mtb") === "KO-09",
    detail: () => `MTB 入口に最も近い komore は ${nearestTo("komore", "mtb")}`,
  },
  {
    id: "HI-01",
    phrase: "草原の西端",
    holds: () => ofType("hidamari").every((p) => p.rect.x >= (findPitch("HI-01") as Pitch).rect.x),
    detail: () => `最も西の hidamari は ${ofType("hidamari").reduce((m, p) => (p.rect.x < m.rect.x ? p : m)).id}`,
  },
  {
    id: "HI-04",
    phrase: "北に八ヶ岳",
    // ここは八ヶ岳南麓。稜線は北にある(T-201 が「南に八ヶ岳」の類を全文から禁じる)
    holds: () => true,
    detail: () => "八ヶ岳南麓なので稜線は北",
  },
  {
    id: "HI-05",
    phrase: "岸へは 40 m ほど",
    holds: () => {
      const m = distanceToPolyline(center(findPitch("HI-05") as Pitch), RIVER);
      return Math.abs(m - 40) <= 10;
    },
    detail: () =>
      `HI-05 から川まで ${Math.round(distanceToPolyline(center(findPitch("HI-05") as Pitch), RIVER))} m`,
  },
  {
    id: "HI-06",
    phrase: "炊事場がいちばん近い",
    holds: () => nearestTo("hidamari", "suiji-hara") === "HI-06",
    detail: () => `草原の炊事場に最も近い hidamari は ${nearestTo("hidamari", "suiji-hara")}`,
  },
  {
    id: "HI-10",
    phrase: "北東の角",
    holds: () => {
      const p = findPitch("HI-10") as Pitch;
      return ofType("hidamari").every((q) => q.rect.x <= p.rect.x && q.rect.y <= p.rect.y);
    },
    detail: () => "hidamari の中で x も y も最大であること",
  },
  {
    id: "SO-01",
    phrase: "駐車場から最短",
    holds: () => nearestTo("solo", "parking") === "SO-01",
    detail: () => `駐車場に最も近い solo は ${nearestTo("solo", "parking")}`,
  },
  {
    id: "SO-02",
    phrase: "トイレが近い",
    holds: () => nearestTo("solo", "toilet-mori") === "SO-02",
    detail: () => `森のトイレに最も近い solo は ${nearestTo("solo", "toilet-mori")}`,
  },
  {
    id: "SO-06",
    phrase: "駐車場から 250 m",
    holds: () => {
      const far = ofType("solo").reduce((m, p) =>
        dist(center(p), F.parking) > dist(center(m), F.parking) ? p : m,
      );
      const m = dist(center(findPitch("SO-06") as Pitch), F.parking);
      return far.id === "SO-06" && Math.abs(m - 250) <= 25;
    },
    detail: () =>
      `SO-06 から駐車場まで ${Math.round(dist(center(findPitch("SO-06") as Pitch), F.parking))} m`,
  },
  {
    id: "TA-01",
    phrase: "石窯小屋にもいちばん近い",
    holds: () => nearestTo("takibi", "kama") === "TA-01",
    detail: () => `石窯に最も近い takibi は ${nearestTo("takibi", "kama")}`,
  },
  {
    id: "TA-04",
    phrase: "東端",
    holds: () => ofType("takibi").every((p) => p.rect.x <= (findPitch("TA-04") as Pitch).rect.x),
    detail: () => `最も東の takibi は ${ofType("takibi").reduce((m, p) => (p.rect.x > m.rect.x ? p : m)).id}`,
  },
];

describe("T-200: 本文の位置の主張が座標と合う(G-16)", () => {
  it("検査が空振りしていない(主張が十分な数あり、対象の区画が実在する)", () => {
    expect(CLAIMS.length).toBeGreaterThanOrEqual(15);
    for (const c of CLAIMS) expect(findPitch(c.id), `${c.id} が存在しない`).toBeDefined();
    expect(new Set(CLAIMS.map((c) => c.id)).size).toBe(CLAIMS.length);
  });

  it("(a) 本文に語句がまだ含まれている", () => {
    const missing = CLAIMS.filter((c) => !(findPitch(c.id) as Pitch).note.includes(c.phrase)).map(
      (c) => `${c.id}: 「${c.phrase}」が note に無い(現在: ${(findPitch(c.id) as Pitch).note})`,
    );
    expect(missing).toEqual([]);
  });

  it("(b) 主張が座標から計算して成り立つ", () => {
    const broken = CLAIMS.filter((c) => !c.holds()).map(
      (c) => `${c.id}「${c.phrase}」— ${c.detail()}`,
    );
    expect(broken).toEqual([]);
  });
});

describe("T-201: 八ヶ岳の方角(G-16)", () => {
  // ここは八ヶ岳**南麓**。したがって八ヶ岳は北にある。
  // 「八ヶ岳南麓」という語自体には南が含まれるので、それは許す。
  const FORBIDDEN = [
    "南に八ヶ岳",
    "八ヶ岳は南",
    "八ヶ岳が南",
    "南側に八ヶ岳",
    "南の八ヶ岳",
    "東に八ヶ岳",
    "西に八ヶ岳",
  ];

  const SKIP_EXT = new Set([".png", ".jpg", ".ico", ".svg", ".woff", ".woff2", ".csv"]);
  const SKIP_DIR = new Set(["node_modules", ".next", "out", "coverage", ".git"]);

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const e of readdirSync(dir)) {
      if (SKIP_DIR.has(e)) continue;
      const full = join(dir, e);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else if (!SKIP_EXT.has(extname(e).toLowerCase())) out.push(full);
    }
    return out;
  }

  const targets = [
    ...walk(join(process.cwd(), "src")),
    join(process.cwd(), "README.md"),
    join(process.cwd(), "SPEC.md"),
  ];

  it("走査対象が空でない", () => {
    expect(targets.length).toBeGreaterThan(20);
    // 八ヶ岳がどこかに書かれていること(検査が空振りしていない)
    expect(targets.some((f) => readFileSync(f, "utf8").includes("八ヶ岳"))).toBe(true);
  });

  it("八ヶ岳を南・東・西にあるものとして書いていない", () => {
    const offenders: string[] = [];
    for (const f of targets) {
      if (f.endsWith("claims.test.ts")) continue;
      for (const [i, line] of readFileSync(f, "utf8").split(/\r?\n/).entries()) {
        for (const bad of FORBIDDEN) {
          if (line.includes(bad)) offenders.push(`${f}:${i + 1}: ${bad}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("「八ヶ岳南麓」は許される(この検査が正しい語を落としていないこと)", () => {
    const sample = "八ヶ岳南麓・標高 1,050 m";
    expect(FORBIDDEN.some((bad) => sample.includes(bad))).toBe(false);
  });
});

describe("T-202: 区画タイプの説明にある距離", () => {
  it("ソロの間の「最も遠い区画」の距離が実測と合う", () => {
    const far = ofType("solo").reduce((m, p) =>
      dist(center(p), F.parking) > dist(center(m), F.parking) ? p : m,
    );
    const meters = dist(center(far), F.parking);
    const stated = /(\d+)\s*m/.exec(SITE_TYPES.solo.caveat);
    expect(stated, "solo の caveat に距離の記載が無い").not.toBeNull();
    expect(Math.abs(Number(stated?.[1]) - meters)).toBeLessThanOrEqual(25);
  });
});
