import fallback from "./prometheus-fallback.json";

// 공개 Prometheus 데모(node_exporter). 제니퍼가 감시하는 서버와는 다른 서버다.
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || "https://prometheus.demo.prometheus.io";

// 허용한 쿼리만 실행한다. 브라우저가 임의 PromQL을 보내지 못하게 키로만 받는다.
export const QUERIES = {
  "node-cpu": { label: "CPU 사용률", unit: "%", promql: '100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m])))' },
  "node-memory": { label: "메모리 사용률", unit: "%", promql: "100 * (1 - sum(node_memory_MemAvailable_bytes) / sum(node_memory_MemTotal_bytes))" },
  "node-load": { label: "Load 1m", unit: "", promql: "avg(node_load1)" },
  "node-network": { label: "네트워크 수신", unit: "KB/s", promql: 'sum(rate(node_network_receive_bytes_total{device!="lo"}[1m])) / 1024' },
} as const;

export type QueryKey = keyof typeof QUERIES;
export type Series = { source: "live" | "fallback"; points: [number, number][] };

export function isQueryKey(key: string): key is QueryKey {
  return key in QUERIES;
}

export async function fetchSeries(key: QueryKey, minutes = 30): Promise<Series> {
  const end = Math.floor(Date.now() / 1000);
  const url = new URL("/api/v1/query_range", PROMETHEUS_URL);
  url.searchParams.set("query", QUERIES[key].promql);
  url.searchParams.set("start", String(end - minutes * 60));
  url.searchParams.set("end", String(end));
  url.searchParams.set("step", "15");

  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    const json = await res.json();
    const values: [number, string][] = json?.data?.result?.[0]?.values ?? [];
    if (!res.ok || values.length === 0) throw new Error("empty");
    return { source: "live", points: values.map(([t, v]) => [t, Number(v)]) };
  } catch {
    // 발표장 네트워크 장애 대비. 시각만 현재로 옮겨서 보여준다.
    const values = (fallback as Record<QueryKey, number[]>)[key];
    const start = end - (values.length - 1) * 15;
    return { source: "fallback", points: values.map((v, i) => [start + i * 15, v]) };
  }
}
