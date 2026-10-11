import { INFRA_METRICS, type InfraMetricId } from "../../lib/infraMetrics";

// 통합 대시보드 데모: 왼쪽은 제니퍼 APM 차트, 오른쪽은 외부 데이터 소스(공개 Prometheus 데모)의 인프라 지표.
// 두 쪽은 서로 다른 서버를 본다. 발표에서는 "외부 데이터 소스 연동 예시"로 소개한다.
const APM_CHARTS = ["tps", "response"];
const INFRA_CHARTS: InfraMetricId[] = ["cpu", "memory", "load", "network"];

const frame = { width: "100%", height: 220, border: "1px solid #ddd", borderRadius: 6 };

export default async function IntegratedDashboard({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const { src } = await searchParams;
  const base = process.env.JENNIFER_URL;
  const jenniferSrc = src ?? (base ? new URL("/popup/chartIframe", base).toString() : "");

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20 }}>통합 대시보드 데모</h1>
      <p style={{ color: "#666", fontSize: 13 }}>
        APM: JENNIFER · 인프라: 공개 Prometheus 데모(node_exporter). 서로 다른 서버의 데이터다.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section>
          <h2 style={{ fontSize: 16 }}>APM (JENNIFER)</h2>
          {jenniferSrc ? <iframe src={jenniferSrc} title="JENNIFER chart" style={frame} /> : null}
          {APM_CHARTS.map((id) => (
            <iframe key={id} src={`/charts/${id}`} title={id} style={{ ...frame, marginTop: 8 }} />
          ))}
        </section>
        <section>
          <h2 style={{ fontSize: 16 }}>인프라 (Prometheus)</h2>
          {INFRA_CHARTS.map((id) => (
            <iframe key={id} src={`/infra/${id}`} title={INFRA_METRICS[id].label} style={{ ...frame, marginBottom: 8 }} />
          ))}
        </section>
      </div>
    </main>
  );
}
