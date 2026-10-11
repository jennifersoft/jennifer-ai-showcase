// 통합 대시보드 데모의 인프라 지표. 공개 Prometheus 데모(node_exporter)에서 가져온다.
// 제니퍼가 감시하는 서버와 다른 서버이므로 "외부 데이터 소스 연동 예시"로만 쓴다.
export const PROMETHEUS_URL = process.env.PROMETHEUS_URL || "https://prometheus.demo.prometheus.io";

export const INFRA_METRICS = {
  cpu: { label: "CPU 사용률", unit: "%", query: '100 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100' },
  memory: { label: "메모리 사용률", unit: "%", query: "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100" },
  load: { label: "Load (1분)", unit: "", query: "node_load1" },
  network: { label: "네트워크 수신", unit: "B/s", query: "sum(rate(node_network_receive_bytes_total[1m]))" },
} as const;

export type InfraMetricId = keyof typeof INFRA_METRICS;

export function isInfraMetricId(id: string): id is InfraMetricId {
  return Object.prototype.hasOwnProperty.call(INFRA_METRICS, id);
}

export type InfraPoint = [number, number];
