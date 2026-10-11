import { QUERIES } from "@/lib/prometheus";

const frame = { width: "100%", height: "100%", border: "1px solid #ddd", borderRadius: 8, background: "#fff" };

// 통합 대시보드 데모: 왼쪽은 제니퍼 APM 차트, 오른쪽은 외부 데이터 소스(Prometheus 데모)의 서버 지표.
// 두 쪽은 서로 다른 서버의 데이터다. 발표에서 "외부 데이터 소스 연동 예시"로 소개한다.
export default async function IntegratedDashboard({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const { src } = await searchParams;
  const base = process.env.JENNIFER_URL;
  const chartSrc = src ?? (base ? new URL("/popup/chartIframe", base).toString() : "");

  return (
    <main style={{ height: "100vh", boxSizing: "border-box", padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#f4f5f7" }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>APM · JENNIFER</h2>
        {chartSrc ? <iframe src={chartSrc} style={{ ...frame, flex: 1 }} /> : <p>JENNIFER_URL 환경변수 또는 ?src= 로 chartIframe 주소를 지정하세요.</p>}
      </section>
      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Infra · Prometheus (외부 데이터 소스)</h2>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: "1fr", gap: 8 }}>
          {Object.keys(QUERIES).map((id) => (
            <iframe key={id} src={`/charts/${id}`} style={frame} />
          ))}
        </div>
      </section>
    </main>
  );
}
