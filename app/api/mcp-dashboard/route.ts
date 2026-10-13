// 21장 MCP 대시보드(public/jennifer-mcp-dashboard.html)의 실시간 데이터.
// GPT가 jennifer5-mcp로 만든 대시보드와 같은 모양(meta·instances·domainMetrics·instanceMetrics·events·errors)으로 돌려준다.
// 제니퍼 Open API를 서버에서 부르고(토큰은 서버 환경변수에만), 화면은 2초마다 이 경로를 폴링한다.
// - KPI(TPS·응답시간·액티브)는 /api/realtime/domain 으로 매번 새로 가져온다.
// - 1시간 차트·이벤트·에러는 분 단위 데이터라 10초 동안 캐시한다. ?part=kpi 는 KPI만 돌려준다(화면은 KPI 2초, 차트 10초 주기).

export const dynamic = "force-dynamic";

const DOMAIN_ID = 2000;
const INTERVAL = 2;
const SLOW_TTL = 10_000;
const DOMAIN_METRICS = ["service_rate", "service_time", "active_service", "error_count", "concurrent_user"];

type Point = { t: string; v: number | null };
type Series = { points: Point[] };
type Slow = {
  at: number;
  startMs: number;
  endMs: number;
  instances: { instanceId: number; name: string; status: string; platform?: string }[];
  domainMetrics: Record<string, Series>;
  instanceMetrics: Record<string, Series>;
  errorTotal: number;
  events: unknown[];
  errors: unknown[];
};

let slow: Slow | null = null;
let slowLoading: Promise<Slow> | null = null;

// 제니퍼 Open API 시각은 KST(UTC+9). 화면은 yyyyMMddHHmm 문자열을 쓴다.
const kst = (ms: number) => new Date(ms + 9 * 3_600_000).toISOString();
const stamp = (ms: number) => kst(ms).slice(0, 16).replace(/[-T:]/g, "");
const iso = (ms: number) => kst(ms).slice(0, 19);

async function api<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const base = process.env.JENNIFER_URL!;
  const url = new URL(`/api/${path}`, base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${process.env.JENNIFER_API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return ((await res.json()) as { result: T }).result;
}

// dbmetrics 는 한 번에 메트릭 하나만 안정적으로 응답한다
async function series(path: string, params: Record<string, string | number>): Promise<Series> {
  try {
    const rows = await api<{ time: string; value: number }[]>(path, params);
    return { points: rows.map((r) => ({ t: stamp(Number(r.time)), v: Number.isFinite(r.value) ? r.value : null })) };
  } catch {
    return { points: [] };
  }
}

const trim = (list: { message?: string }[]) => list.map((e) => ({ ...e, message: e.message?.slice(0, 1500) }));

async function loadSlow(): Promise<Slow> {
  const endMs = Math.floor(Date.now() / 60_000) * 60_000;
  const startMs = endMs - 3_600_000;
  const range = { start_time: startMs, end_time: endMs };
  const instances = await api<Slow["instances"]>("instance", { domain_id: DOMAIN_ID });
  const live = instances.filter((i) => i.status !== "STOPPED");
  const [domainList, cpuList, events, errors] = await Promise.all([
    Promise.all(DOMAIN_METRICS.map((m) => series("dbmetrics/domain", { domain_id: DOMAIN_ID, interval_minute: INTERVAL, metrics: m, ...range }))),
    Promise.all(live.map((i) => series("dbmetrics/instance", { domain_id: DOMAIN_ID, instance_id: i.instanceId, interval_minute: INTERVAL, metrics: "max_sys_cpu", ...range }))),
    api<{ eventLevel?: string; message?: string }[]>("dbsearch/event", { domain_id: DOMAIN_ID, ...range }).catch(() => []),
    api<{ message?: string }[]>("dbsearch/error", { domain_id: DOMAIN_ID, ...range }).catch(() => []),
  ]);
  const domainMetrics: Record<string, Series> = {};
  DOMAIN_METRICS.forEach((m, i) => (domainMetrics[`${DOMAIN_ID},${m}`] = domainList[i]));
  const instanceMetrics: Record<string, Series> = {};
  live.forEach((inst, i) => (instanceMetrics[`${inst.instanceId},max_sys_cpu`] = cpuList[i]));
  const errorTotal = domainMetrics[`${DOMAIN_ID},error_count`].points.reduce((a, p) => a + (p.v ?? 0), 0);
  return {
    at: Date.now(),
    startMs,
    endMs,
    instances: instances.map(({ instanceId, name, status, platform }) => ({ instanceId, name, status, platform })),
    domainMetrics,
    instanceMetrics,
    errorTotal: Math.round(errorTotal),
    events: trim(events.filter((e) => e.eventLevel === "WARNING" || e.eventLevel === "FATAL").slice(-30)),
    errors: trim(errors.slice(-100)),
  };
}

export async function GET(req: Request) {
  const kpiOnly = new URL(req.url).searchParams.get("part") === "kpi";
  if (!process.env.JENNIFER_URL || !process.env.JENNIFER_API_TOKEN) {
    return Response.json({ error: "JENNIFER_URL / JENNIFER_API_TOKEN not set" }, { status: 503 });
  }
  try {
    if (!slow || Date.now() - slow.at > SLOW_TTL) {
      slowLoading ??= loadSlow().finally(() => (slowLoading = null));
      if (!slow) slow = await slowLoading;
      else slowLoading.then((s) => (slow = s)).catch(() => {}); // 오래된 값은 바로 주고 뒤에서 갱신
    }
    const [rt] = await api<{ domainName: string; tps: number; responseTime: number; activeService: number }[]>("realtime/domain", { domain_id: DOMAIN_ID });
    const s = slow;
    if (kpiOnly) {
      return Response.json(
        {
          meta: { observedAt: iso(Date.now()) + "+09:00", live: true },
          realtime: rt ? { tps: rt.tps, responseTime: rt.responseTime, activeService: rt.activeService } : null,
          errorTotal: { value: s.errorTotal, intervalMinute: INTERVAL },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      {
        meta: {
          domainId: DOMAIN_ID,
          domainName: rt?.domainName ?? "",
          effectiveStartTime: iso(s.startMs),
          effectiveEndTime: iso(s.endMs),
          observedAt: iso(Date.now()) + "+09:00",
          timezone: "Asia/Tokyo",
          intervalMinute: INTERVAL,
          live: true,
        },
        realtime: rt ? { tps: rt.tps, responseTime: rt.responseTime, activeService: rt.activeService } : null,
        instances: s.instances,
        domainMetrics: s.domainMetrics,
        instanceMetrics: s.instanceMetrics,
        errorTotal: { value: s.errorTotal, intervalMinute: INTERVAL },
        events: s.events,
        errors: s.errors,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
