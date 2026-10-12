import { NextRequest } from "next/server";
import { httpUrlOrNull, renderDeck } from "@/lib/slides";

// /slides/<덱이름> : slides/<덱이름>/ 을 공통 엔진과 합쳐 렌더링한다.
// ?jennifer=<url> 로 {{live:jennifer}} 주소를 발표 직전에 덮어쓸 수 있다(http/https만).
export async function GET(req: NextRequest, { params }: { params: Promise<{ deck: string }> }) {
  const { deck } = await params;
  const jennifer =
    httpUrlOrNull(req.nextUrl.searchParams.get("jennifer")) ?? httpUrlOrNull(process.env.JENNIFER_DASHBOARD_URL);
  const html = await renderDeck(deck, jennifer);
  if (html === null) {
    return new Response("deck not found", { status: 404 });
  }
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
