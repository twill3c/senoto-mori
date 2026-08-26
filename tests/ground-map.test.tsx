import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GroundMapSvg } from "@/components/GroundMapSvg";
import { FACILITIES } from "@/data/geo";
import { PITCHES } from "@/data/sites";
import { FILTERS, applyFilters, type FilterKey } from "@/lib/filters";

// T-100 台: 場内図(F-01 / F-02 / G-01)
//
// G-01 は「区画データと図が同じものを指していること」を守る唯一のゲート。
// ソースを grep しても、ループで回している以上は必ず一致してしまい何も検証できない。
// **レンダリング結果の HTML から data-site-id を拾って集合比較する**。

function render(node: React.ReactElement): string {
  return renderToStaticMarkup(node);
}

function siteIdsIn(html: string): Set<string> {
  const ids = new Set<string>();
  for (const m of html.matchAll(/data-site-id="([^"]+)"/g)) ids.add(m[1]);
  return ids;
}

describe("G-01: 図とデータの一対一対応", () => {
  const html = render(<GroundMapSvg pitches={PITCHES} />);

  it("T-100: SVG の data-site-id 集合が PITCHES の ID 集合と完全一致する", () => {
    const inSvg = siteIdsIn(html);
    const inData = new Set(PITCHES.map((p) => p.id));
    const missing = [...inData].filter((id) => !inSvg.has(id));
    const extra = [...inSvg].filter((id) => !inData.has(id));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    expect(inSvg.size).toBe(PITCHES.length);
  });

  it("T-100b: 同じ区画が二度描かれていない", () => {
    const all = [...html.matchAll(/data-site-id="([^"]+)"/g)].map((m) => m[1]);
    expect(all.length).toBe(new Set(all).size);
  });

  it("T-101: 地形(敷地・渓流・森林・草原)が描かれている", () => {
    for (const id of ["ground-boundary", "ground-forest", "ground-meadow", "ground-river"]) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("T-102: 施設が全件、注記として出ている", () => {
    for (const f of FACILITIES) {
      expect(html).toContain(f.label);
    }
  });

  it("T-103: 図が読み上げ可能である(役割と説明を持つ)", () => {
    expect(html).toMatch(/role="img"/);
    expect(html).toMatch(/aria-labelledby="/);
    // 区画ひとつひとつが名前を持つ
    expect(html).toContain("<title>SE-01");
  });
});

describe("F-02: 絞り込み", () => {
  it("T-104: 絞り込みの結果が区画データの述語と一致する", () => {
    const cases: [FilterKey, (p: (typeof PITCHES)[number]) => boolean][] = [
      ["riverside", (p) => p.riverside],
      ["openFire", (p) => p.openFire],
      ["ac", (p) => p.ac],
      ["solo", (p) => p.type === "solo"],
      ["driveIn", (p) => p.driveIn],
      ["meadow", (p) => p.meadow],
    ];
    for (const [key, pred] of cases) {
      const got = applyFilters(PITCHES, [key]).map((p) => p.id);
      const want = PITCHES.filter(pred).map((p) => p.id);
      expect(got).toEqual(want);
      // どの絞り込みも、全件でも 0 件でもないこと(絞り込みとして意味があること)
      expect(got.length).toBeGreaterThan(0);
      expect(got.length).toBeLessThan(PITCHES.length);
    }
  });

  it("T-104b: 絞り込みは AND で重なる", () => {
    const got = applyFilters(PITCHES, ["riverside", "driveIn"]).map((p) => p.id);
    const want = PITCHES.filter((p) => p.riverside && p.driveIn).map((p) => p.id);
    expect(got).toEqual(want);
    // 両立しない組み合わせは 0 件になる(直火可の区画は車を横付けできない)
    expect(applyFilters(PITCHES, ["openFire", "driveIn"])).toEqual([]);
  });

  it("T-104c: 絞り込み無しなら全件", () => {
    expect(applyFilters(PITCHES, [])).toHaveLength(PITCHES.length);
  });

  it("T-105: FILTERS の定義がすべて applyFilters に届いている", () => {
    for (const f of FILTERS) {
      expect(() => applyFilters(PITCHES, [f.key])).not.toThrow();
      expect(f.label.length).toBeGreaterThan(0);
    }
    expect(new Set(FILTERS.map((f) => f.key)).size).toBe(FILTERS.length);
  });

  it("T-106: 絞り込まれた区画だけが図で強調される", () => {
    const selectedKeys: FilterKey[] = ["riverside"];
    const matched = new Set(applyFilters(PITCHES, selectedKeys).map((p) => p.id));
    const html = render(<GroundMapSvg pitches={PITCHES} matched={matched} />);

    // 該当しない区画は data-dim="true" が付く
    for (const p of PITCHES) {
      const re = new RegExp(`data-site-id="${p.id}"[^>]*data-dim="(true|false)"`);
      const m = re.exec(html);
      expect(m, `${p.id} に data-dim が無い`).not.toBeNull();
      expect(m?.[1]).toBe(matched.has(p.id) ? "false" : "true");
    }
  });
});

describe("F-03: 空き状況の反映", () => {
  it("T-107: 状態を渡すと data-status に出る", () => {
    const statuses = new Map(
      PITCHES.map((p, i) => [p.id, i % 3 === 0 ? "booked" : "open"] as const),
    );
    const html = render(<GroundMapSvg pitches={PITCHES} statuses={statuses} />);
    for (const p of PITCHES) {
      const re = new RegExp(`data-site-id="${p.id}"[^>]*data-status="([^"]+)"`);
      expect(re.exec(html)?.[1]).toBe(statuses.get(p.id));
    }
  });

  it("T-107b: 状態を渡さなければ data-status は unknown", () => {
    const html = render(<GroundMapSvg pitches={PITCHES} />);
    const re = /data-site-id="SE-01"[^>]*data-status="([^"]+)"/;
    expect(re.exec(html)?.[1]).toBe("unknown");
  });
});
