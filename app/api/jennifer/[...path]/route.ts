import { NextRequest } from "next/server";

// 차트에 필요한 제니퍼 OpenAPI(/api/...) 조회 경로만 허용한다. 토큰 권한이 그대로 노출되지 않게 막는다.
// 경로는 제니퍼 view-server OpenAPIController 기준.
const ALLOWED_PATHS = new Set([
  "domain",
  "instance",
  "business",
  "realtime/domain",
  "realtime/instance",
  "realtime/business",
  "metrics",
  "dbmetrics/domain",
  "dbmetrics/instance",
  "dbmetrics/business",
]);

function isAllowedPath(path: string[]): boolean {
  return ALLOWED_PATHS.has(path.join("/"));
}

// 제니퍼 OpenAPI 프록시. 토큰은 서버 환경변수에만 두고 브라우저에는 노출하지 않는다.
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const base = process.env.JENNIFER_URL;
  const token = process.env.JENNIFER_API_TOKEN;
  if (!base || !token) {
    return Response.json({ error: "JENNIFER_URL / JENNIFER_API_TOKEN not set" }, { status: 503 });
  }

  const { path } = await params;
  if (!isAllowedPath(path)) {
    return Response.json({ error: "path not allowed" }, { status: 404 });
  }

  const url = new URL(`/api/${path.map(encodeURIComponent).join("/")}`, base);
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k !== "token") url.searchParams.set(k, v);
  });

  // 제니퍼는 ?token= 과 Authorization: <type> <token> 을 모두 받는다(InterceptorUtil.getTokenKey).
  // 쿼리 토큰은 접근 로그에 남을 수 있어 헤더로 보낸다.
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  return new Response(res.body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
