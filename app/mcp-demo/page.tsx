import ChartWidget from "@/components/ChartWidget";
import type { Point } from "@/components/TimeSeriesChart";
import { t } from "@/lib/i18n";
import { requestLang } from "@/lib/requestLang";
import demo from "@/lib/mcp-demo.json";

// MCP 데모: ChatGPT·Claude 에 제니퍼 MCP(insight-dev.jennifersoft.com/mcp)를 연결해
// get_domain_metric_values 로 dev.jennifersoft.com Open API 데이터를 받아 만든 차트.
// 발표 중 연결 상태에 기대지 않도록, 실제 MCP 응답을 lib/mcp-demo.json 에 기록해 두고 그린다.
type Demo = { domainName: string; recordedAt: string; series: Record<string, [number, number][]> };

export default async function McpDemo({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await requestLang((await searchParams).lang);
  const d = demo as unknown as Demo;
  const pts = (k: string) => (d.series[k] ?? []) as Point[];
  const badge = <span className="chip">MCP · Open API</span>;

  return (
    <main className="dash-page">
      <header className="dash-head">
        <h1>{t(lang, "mcp.title")}</h1>
        <p>{t(lang, "mcp.source", { time: d.recordedAt.replace("T", " ") })}</p>
      </header>
      <div className="empty" style={{ textAlign: "left", fontFamily: "var(--mono)", color: "var(--text)", borderStyle: "solid" }}>
        ❯ {t(lang, "mcp.prompt")}
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, minHeight: 0 }}>
        <div className="frame" style={{ position: "relative", overflow: "hidden" }}>
          <ChartWidget lang={lang} title={t(lang, "chart.tps")} unit="tps" points={pts("service_rate")} badge={badge} />
        </div>
        <div className="frame" style={{ position: "relative", overflow: "hidden" }}>
          <ChartWidget lang={lang} title={t(lang, "chart.response")} unit={t(lang, "unit.ms")} points={pts("service_time")} color="var(--series-2)" badge={badge} />
        </div>
        <div className="frame" style={{ position: "relative", overflow: "hidden" }}>
          <ChartWidget lang={lang} title={t(lang, "chart.active")} unit="" points={pts("active_service")} badge={badge} />
        </div>
      </div>
    </main>
  );
}
