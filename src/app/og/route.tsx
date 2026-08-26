import { ImageResponse } from "next/og";
import { OG_PALETTE, OG_SIZE, ogParams } from "@/lib/og";

// 共有されたときの画像(F-15)。next/og が SVG 相当の指定から PNG を焼く。
//
// 何を書くかは @/lib/og の純関数が決めていて、テスト(T-161)はそちらを見ている。
// ここは描くだけ。画像に使える CSS は限られるので、凝ったことはしない。

export const runtime = "edge";

// 色は @/lib/og の OG_PALETTE から。ImageResponse は CSS 変数を解釈しないので
// 値そのものを持つしかないが、globals.css との一致は T-161e が見張っている
const { ink: INK, inkSoft: INK_SOFT, paper: PAPER, river: RIVER, ember: EMBER } = OG_PALETTE;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const params =
    kind === "pitch"
      ? ogParams({ kind: "pitch", slug: searchParams.get("slug") ?? "" })
      : ogParams({ kind: "route", path: searchParams.get("path") ?? "/" });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: PAPER,
        padding: "72px 80px",
        borderLeft: `24px solid ${RIVER}`,
      }}
    >
      <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: EMBER }}>
        {params.badge}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 84, color: INK, lineHeight: 1.25 }}>{params.title}</div>
        <div style={{ fontSize: 32, color: INK_SOFT, marginTop: 18, lineHeight: 1.5 }}>
          {params.subtitle}
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 24, color: INK_SOFT }}>
        八ヶ岳南麓 標高 1,050 m ／ 架空のキャンプ場です
      </div>
    </div>,
    { ...OG_SIZE },
  );
}
