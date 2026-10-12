import { QUERIES } from "@/lib/prometheus";

// 통합 대시보드 데모: 왼쪽은 제니퍼 APM 차트, 오른쪽은 외부 데이터 소스(Prometheus 데모)의 서버 지표.
// 두 쪽은 서로 다른 서버의 데이터다. 발표에서 "외부 데이터 소스 연동 예시"로 소개한다.
export default async function IntegratedDashboard({ searchParams }: { searchParams: Promise<{ src?: string; theme?: string }> }) {
  const { src, theme } = await searchParams;
  const base = process.env.JENNIFER_URL;
  const chartSrc = src ?? (base ? new URL("/popup/chartIframe", base).toString() : "");
  const t = theme === "dark" ? "?theme=dark" : "";

  return (
    <main className="dash-page">
      <header className="dash-head">
        <h1>통합 대시보드</h1>
        <p>APM은 JENNIFER, 서버 지표는 외부 데이터 소스(Prometheus 데모). 서로 다른 서버의 데이터입니다.</p>
      </header>
      <div className="dash-grid">
        <section className="panel">
          <div className="panel-title">
            <span className="dot" style={{ background: "var(--accent)" }} />
            APM · JENNIFER
          </div>
          {chartSrc ? (
            <iframe src={chartSrc} className="frame" style={{ flex: 1 }} title="JENNIFER chart" />
          ) : (
            <div className="empty" style={{ flex: 1 }}>
              JENNIFER_URL 환경변수 또는 ?src= 로
              <br />
              제니퍼 chartIframe 주소를 지정하세요.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, height: "34%" }}>
            <iframe src={`/charts/tps${t}`} className="frame" title="TPS" />
            <iframe src={`/charts/response${t}`} className="frame" title="응답시간" />
          </div>
        </section>
        <section className="panel">
          <div className="panel-title">
            <span className="dot" style={{ background: "var(--series-1)" }} />
            Infra · Prometheus (외부 데이터 소스)
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: "1fr", gap: 10 }}>
            {Object.entries(QUERIES).map(([id, q]) => (
              <iframe key={id} src={`/charts/${id}${t}`} className="frame" title={q.label} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
