import { isDeckName, readDeckMeta } from "@/lib/slides";

export const dynamic = "force-dynamic";

// 발표 중 대본을 휴대폰 홈 화면에 앱처럼 설치한다. 발표자용과 통역용을 따로 설치할 수 있게 id를 나눈다.
export async function GET(request: Request, { params }: { params: Promise<{ deck: string }> }) {
  const { deck } = await params;
  const meta = isDeckName(deck) ? await readDeckMeta(deck) : null;
  if (meta === null) return new Response("deck not found", { status: 404 });

  const mode = new URL(request.url).searchParams.get("mode") === "interpreter" ? "interpreter" : "presenter";
  const scope = `/slides/${deck}/script`;
  const start = `${scope}?view=stage&mode=${mode}`;
  const label = mode === "interpreter" ? "통역 대본" : "발표 대본";
  return Response.json(
    {
      id: start,
      name: `${meta.title} ${label}`,
      short_name: label,
      start_url: start,
      scope,
      display: "standalone",
      orientation: "any",
      background_color: "#0E0F12",
      theme_color: "#0E0F12",
      lang: "ko",
      icons: [
        { src: "/slides-script/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/slides-script/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" } },
  );
}
