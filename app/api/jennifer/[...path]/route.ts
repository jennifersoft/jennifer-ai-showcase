import { NextRequest } from "next/server";

// 제니퍼 OpenAPI 프록시. 토큰은 서버 환경변수에만 두고 브라우저에는 노출하지 않는다.
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const base = process.env.JENNIFER_URL;
  const token = process.env.JENNIFER_API_TOKEN;
  if (!base || !token) {
    return Response.json({ error: "JENNIFER_URL / JENNIFER_API_TOKEN not set" }, { status: 503 });
  }

  const { path } = await params;
  const url = new URL(`/api/${path.map(encodeURIComponent).join("/")}`, base);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
  url.searchParams.set("token", token);

  const res = await fetch(url, { cache: "no-store" });
  return new Response(res.body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
