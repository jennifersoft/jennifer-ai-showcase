import { QUERIES } from "@/lib/prometheus";
import { t, withParams } from "@/lib/i18n";
import { requestLang } from "@/lib/requestLang";

// 통합 대시보드 데모: 왼쪽은 제니퍼 APM 차트, 오른쪽은 외부 데이터 소스(Prometheus 데모)의 서버 지표.
// 두 쪽은 서로 다른 서버의 데이터다. 발표에서 "외부 데이터 소스 연동 예시"로 소개한다.
// ?lang=, ?theme= 는 하위 위젯 iframe 에도 그대로 넘긴다.
export default async function IntegratedDashboard({
  searchParams,
}: {
  searchParams: Promise<{ src?: string; theme?: string; lang?: string }>;
}) {
  const { src, theme, lang: langParam } = await searchParams;
  const lang = await requestLang(langParam);
  const base = process.env.JENNIFER_URL;
  const chartSrc = src ?? (base ? new URL("/popup/chartIframe", base).toString() : "");
  const child = (path: string) => withParams(path, { lang, theme: theme === "dark" ? "dark" : undefined });

  return (
    <main className="dash-page">
      <header className="dash-head">
        <h1>{t(lang, "dash.integrated.title")}</h1>
        <p>{t(lang, "dash.integrated.desc")}</p>
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
            <div className="empty" style={{ flex: 1 }}>{t(lang, "dash.noJennifer")}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, height: "34%" }}>
            <iframe src={child("/charts/tps")} className="frame" title={t(lang, "chart.tps")} />
            <iframe src={child("/charts/response")} className="frame" title={t(lang, "chart.response")} />
          </div>
        </section>
        <section className="panel">
          <div className="panel-title">
            <span className="dot" style={{ background: "var(--series-1)" }} />
            {t(lang, "dash.infra")}
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: "1fr", gap: 10 }}>
            {(Object.keys(QUERIES) as (keyof typeof QUERIES)[]).map((id) => (
              <iframe key={id} src={child(`/charts/${id}`)} className="frame" title={t(lang, `infra.${id}`)} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
