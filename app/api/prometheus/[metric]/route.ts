import { NextRequest } from "next/server";
import { INFRA_METRICS, PROMETHEUS_URL, isInfraMetricId, type InfraPoint } from "../../../lib/infraMetrics";
import fallback from "../../../data/infra-fallback.json";

const RANGE_SECONDS = 15 * 60;
const STEP_SECONDS = 15;

// 허용한 지표 이름만 PromQL로 바꿔 조회한다. 임의 쿼리는 받지 않는다.
// 공개 데모가 응답하지 않으면 녹화해 둔 fallback 데이터를 돌려준다(발표용).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ metric: string }> }) {
  const { metric } = await params;
  if (!isInfraMetricId(metric)) {
    return Response.json({ error: "metric not allowed" }, { status: 404 });
  }

  const end = Math.floor(Date.now() / 1000);
  const url = new URL("/api/v1/query_range", PROMETHEUS_URL);
  url.searchParams.set("query", INFRA_METRICS[metric].query);
  url.searchParams.set("start", String(end - RANGE_SECONDS));
  url.searchParams.set("end", String(end));
  url.searchParams.set("step", String(STEP_SECONDS));

  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    const body = await res.json();
    const values: [number, string][] = body?.data?.result?.[0]?.values ?? [];
    if (!res.ok || values.length === 0) throw new Error("empty");
    const points: InfraPoint[] = values.map(([t, v]) => [t, Number(v)]);
    return Response.json({ metric, source: "live", points });
  } catch {
    const points = (fallback as unknown as Record<string, InfraPoint[]>)[metric] ?? [];
    return Response.json({ metric, source: "fallback", points });
  }
}
