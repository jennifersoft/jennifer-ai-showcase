// 발표용 화면 이미지: 제니퍼 이벤트가 PagerDuty 인시던트로 들어온 모습.
// 필드는 jennifer-view-adapter-pagerduty(PagerDutyData.kt)가 보내는 Events API v2 페이로드와 같다.
// PagerDuty 실제 화면이 아니라 데이터 형식을 보여주기 위한 재현 화면이다(우측 상단에 표시).

const now = new Date("2026-10-13T10:24:31.482+09:00");
const event = {
  domainId: 7000,
  domainName: "REALTIME, ANALYSIS",
  instanceId: 10021,
  instanceName: "groupware-01",
  serviceName: "/groupware/approval/list",
  errorType: "SERVICE_EXCEPTION",
  eventLevel: "FATAL",
  txid: 4835201937462811,
  message: "java.lang.IllegalStateException: approval line not found",
  metrics: "[ERROR_COUNT]",
};
const jenniferUrl = "https://dev.jennifersoft.com";
const popup = `/popup/xviewAnalysisV2?domainId=${event.domainId}&transactionId=${event.txid}&searchTime=${now.getTime()}`;

// PagerDutyData.kt 와 같은 규칙으로 만든 페이로드
const payload = {
  routing_key: "R0••••••••••••••••••••••••••••7a",
  event_action: "trigger",
  dedup_key: `${event.domainId}:${event.instanceId}:${event.errorType}:${event.serviceName}`,
  client: "JENNIFER5",
  client_url: jenniferUrl,
  payload: {
    summary: `${event.errorType}: ${event.message} (${event.instanceName})`,
    source: `${event.instanceName}:${event.domainName}`,
    severity: "critical",
    timestamp: "2026-10-13T10:24:31.482+09:00",
    component: event.instanceName,
    group: event.domainName,
    class: event.errorType,
    custom_details: {
      Location: { "Domain Name": event.domainName, "Instance Name": event.instanceName, "Instance ID": event.instanceId },
      Context: {
        "Service Name": event.serviceName,
        "Error Type": event.errorType,
        "Event Level": event.eventLevel,
        "Transaction ID": event.txid,
        Metrics: event.metrics,
      },
    },
  },
  links: [{ href: `${jenniferUrl}${popup}&redirect=${encodeURIComponent(popup)}`, text: "Transaction Analysis" }],
};

const C = { green: "#06AC38", ink: "#1f2328", sub: "#5f6b7a", line: "#e2e5ea", bg: "#f6f7f9", red: "#d6372b" };

function Row({ k, v, mono }: { k: string; v: string | number; mono?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, padding: "8px 0", borderTop: `1px solid ${C.line}`, fontSize: 14 }}>
      <span style={{ color: C.sub }}>{k}</span>
      <span style={{ color: C.ink, fontFamily: mono ? "var(--mono)" : undefined, wordBreak: "break-all" }}>{String(v)}</span>
    </div>
  );
}

export default function PagerDutyIncidentMock() {
  const p = payload.payload;
  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "Inter, var(--font)", padding: 0 }}>
      <header style={{ background: "#0b1f17", color: "#fff", display: "flex", alignItems: "center", gap: 16, padding: "12px 24px" }}>
        <span style={{ width: 28, height: 28, borderRadius: 6, background: C.green, display: "grid", placeItems: "center", fontWeight: 900 }}>P</span>
        <b>Incidents</b>
        <span style={{ opacity: 0.6 }}>Services</span>
        <span style={{ opacity: 0.6 }}>Schedules</span>
        <span style={{ marginLeft: "auto", fontSize: 12, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,.12)" }}>画面イメージ / 화면 예시</span>
      </header>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 20 }}>
        <section style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: 24 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <span style={{ background: C.red, color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>Triggered</span>
            <span style={{ border: `1px solid ${C.red}`, color: C.red, fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 999 }}>High urgency</span>
            <span style={{ color: C.sub, fontSize: 13, marginLeft: 4 }}>#1284 · JENNIFER APM</span>
          </div>
          <h1 style={{ fontSize: 22, lineHeight: 1.35, margin: "0 0 6px" }}>{p.summary}</h1>
          <p style={{ color: C.sub, margin: "0 0 18px", fontSize: 14 }}>
            Opened 2026-10-13 10:24 · Assigned to On-call A · via JENNIFER5 (Events API v2)
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <span style={{ background: C.green, color: "#fff", padding: "8px 14px", borderRadius: 6, fontWeight: 600, fontSize: 14 }}>Acknowledge</span>
            <span style={{ border: `1px solid ${C.line}`, padding: "8px 14px", borderRadius: 6, fontWeight: 600, fontSize: 14 }}>Resolve</span>
            <a href={payload.links[0].href} style={{ marginLeft: "auto", alignSelf: "center", color: "#1a5ee8", fontWeight: 600, fontSize: 14 }}>
              ↗ {payload.links[0].text}
            </a>
          </div>
          <h2 style={{ fontSize: 15, margin: "0 0 4px" }}>Alert details</h2>
          <Row k="Severity" v={p.severity} />
          <Row k="Source" v={p.source} />
          <Row k="Component" v={p.component} />
          <Row k="Group" v={p.group} />
          <Row k="Class" v={p.class} />
          <Row k="Dedup key" v={payload.dedup_key} mono />
          <h2 style={{ fontSize: 15, margin: "18px 0 4px" }}>Custom details · Location</h2>
          {Object.entries(p.custom_details.Location).map(([k, v]) => <Row key={k} k={k} v={v} />)}
          <h2 style={{ fontSize: 15, margin: "18px 0 4px" }}>Custom details · Context</h2>
          {Object.entries(p.custom_details.Context).map(([k, v]) => <Row key={k} k={k} v={v} mono={k === "Transaction ID"} />)}
        </section>
        <section style={{ background: "#0d1117", color: "#c9d1d9", borderRadius: 10, padding: 20, fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.6, overflow: "hidden" }}>
          <div style={{ color: "#8b949e", marginBottom: 8 }}>POST https://events.pagerduty.com/v2/enqueue</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{JSON.stringify(payload, null, 2)}</pre>
        </section>
      </div>
    </main>
  );
}
