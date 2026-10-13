// PagerDuty 유료 계정 없이 데모하기 위한 샘플 인시던트.
// 1) 제니퍼 EventHandler 가 넘기는 EventData 를 시간 순으로 만들고
// 2) jennifer-view-adapter-pagerduty(PagerDutyData.kt)와 같은 규칙으로 Events API v2 이벤트로 바꾼 뒤
// 3) PagerDuty 가 dedup_key 로 묶어 인시던트를 만드는 방식대로 쌓는다.
// 결과는 실제 REST API v2 GET /incidents 응답 모양(PdApiIncident)이라, PAGERDUTY_API_KEY 를 넣으면 같은 코드로 실데이터를 그린다.

export type PdApiIncident = {
  id: string;
  incident_number: number;
  title: string; // = payload.summary  "ErrorType: message (instance)"
  status: "triggered" | "acknowledged" | "resolved";
  urgency: "high" | "low";
  incident_key: string; // = dedup_key  "domainId:instanceId:errorType:serviceName"
  created_at: string;
  last_status_change_at: string;
  service: { id: string; summary: string };
  assignments: { at: string; assignee: { summary: string } }[];
  acknowledgements?: { at: string }[];
  alert_counts?: { all: number };
  html_url: string;
};

// 하루 동안 같은 결과가 나오도록 날짜 기반 의사 난수
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

// 제니퍼 도메인·인스턴스(EventData.domainId/domainName/instanceId/instanceName)
const INSTANCES = [
  { domainId: 7000, domainName: "REALTIME, ANALYSIS", instanceId: 10021, instanceName: "groupware-01" },
  { domainId: 7000, domainName: "REALTIME, ANALYSIS", instanceId: 10022, instanceName: "groupware-02" },
  { domainId: 1000, domainName: "Order", instanceId: 11001, instanceName: "order-api-01" },
  { domainId: 1000, domainName: "Order", instanceId: 11002, instanceName: "payment-api-01" },
  { domainId: 1000, domainName: "Order", instanceId: 11005, instanceName: "batch-01" },
];
// 제니퍼 이벤트(EventData.errorType / eventLevel / serviceName / message). 가중치는 운영에서 흔한 정도.
const EVENTS: { errorType: string; level: "FATAL" | "WARNING"; w: number; services: string[]; message: string; recovers?: boolean }[] = [
  { errorType: "SERVICE_EXCEPTION", level: "FATAL", w: 5, services: ["/groupware/approval/list", "/order/submit", "/payment/confirm"], message: "java.lang.IllegalStateException: approval line not found" },
  { errorType: "SQL_EXCEPTION", level: "FATAL", w: 3, services: ["/order/history", "/member/profile"], message: "ORA-01013: user requested cancel of current operation" },
  { errorType: "EXTERNALCALL_EXCEPTION", level: "WARNING", w: 3, services: ["/payment/confirm", "/order/delivery"], message: "java.net.SocketTimeoutException: Read timed out" },
  { errorType: "DB_CONNECTION_FAIL", level: "FATAL", w: 1, services: ["/order/submit"], message: "Cannot get a connection, pool error Timeout waiting for idle object" },
  { errorType: "RECURSIVE_CALL", level: "WARNING", w: 1, services: ["/groupware/board/view"], message: "Recursive call detected" },
  { errorType: "PLC_REJECTED", level: "WARNING", w: 1, services: ["/order/submit"], message: "Rejected by peak load control" },
];
const TOTAL_W = EVENTS.reduce((a, e) => a + e.w, 0);
const ONCALL = ["On-call A", "On-call B", "On-call C"];
const SERVICE = { id: "PJENN05", summary: "JENNIFER5" }; // integration key 하나 = PagerDuty 서비스 하나

/** 최근 24시간 샘플 인시던트. 업무 시간대(9~19시)에 이벤트가 몰리고, 같은 dedup_key 는 열린 인시던트에 알림으로 합쳐진다. */
export function sampleIncidents(now = Date.now()): PdApiIncident[] {
  const day = Math.floor(now / 86_400_000);
  const r = rng(day * 7919);
  const pick = () => {
    let x = r() * TOTAL_W;
    for (const e of EVENTS) if ((x -= e.w) < 0) return e;
    return EVENTS[0];
  };
  const open = new Map<string, PdApiIncident & { _resolveAt: number }>();
  const out: (PdApiIncident & { _resolveAt: number })[] = [];
  let n = 1200 + (day % 100) * 3;

  for (let h = 23; h >= 0; h--) {
    const hourStart = now - (h + 1) * 3_600_000;
    const local = new Date(hourStart).getHours();
    const busy = local >= 9 && local <= 19;
    const count = Math.floor(r() * (busy ? 5 : 1.8) + (busy && r() > 0.7 ? 3 : 0));
    const times = Array.from({ length: count }, () => hourStart + Math.floor(r() * 3_600_000)).sort((a, b) => a - b);
    for (const time of times) {
      const ev = pick();
      const inst = INSTANCES[Math.floor(r() * INSTANCES.length)];
      const serviceName = ev.services[Math.floor(r() * ev.services.length)];
      // PagerDutyData.kt: buildDedupKey / buildSummary / mapSeverity
      const dedup = `${inst.domainId}:${inst.instanceId}:${ev.errorType}:${serviceName}`;
      const summary = `${ev.errorType}: ${ev.message} (${inst.instanceName})`;
      const severity = ev.level === "FATAL" ? "critical" : "warning";

      // 같은 dedup_key 의 인시던트가 아직 열려 있으면 새 인시던트 없이 알림만 붙는다
      for (const [k, inc] of open) if (inc._resolveAt <= time) open.delete(k);
      const cur = open.get(dedup);
      if (cur) {
        cur.alert_counts!.all += 1;
        continue;
      }

      // 서비스 설정의 심각도 기반 긴급도: critical/error → high, warning/info → low
      const high = severity === "critical";
      const mtta = (high ? 2 : 6) + r() * (high ? 6 : 18); // 분
      // 큐잉처럼 회복 이벤트(NORMAL → event_action: resolve)가 오는 건 자동 해소, 나머지는 담당자가 해결
      const mttr = ev.recovers ? 4 + r() * 20 : mtta + (high ? 12 : 25) + r() * (high ? 45 : 90);
      const ageMin = (now - time) / 60_000;
      const acked = !ev.recovers || mtta < mttr;
      const status: PdApiIncident["status"] =
        ageMin >= mttr ? "resolved" : acked && ageMin >= mtta ? "acknowledged" : "triggered";
      const ackAt = time + mtta * 60_000;
      const resolveAt = time + mttr * 60_000;
      const changed = status === "triggered" ? time : status === "acknowledged" ? ackAt : resolveAt;
      n += 1;
      const id = `Q${n.toString(36).toUpperCase()}`;
      const inc = {
        id,
        incident_number: n,
        title: summary,
        status,
        urgency: high ? ("high" as const) : ("low" as const),
        incident_key: dedup,
        created_at: new Date(time).toISOString(),
        last_status_change_at: new Date(changed).toISOString(),
        service: SERVICE,
        assignments: [{ at: new Date(time).toISOString(), assignee: { summary: ONCALL[Math.floor(r() * ONCALL.length)] } }],
        acknowledgements: acked && status !== "triggered" ? [{ at: new Date(ackAt).toISOString() }] : [],
        alert_counts: { all: 1 },
        html_url: `https://example.pagerduty.com/incidents/${id}`,
        _resolveAt: resolveAt,
      };
      open.set(dedup, inc);
      out.push(inc);
    }
  }
  return out.map(({ _resolveAt: _, ...inc }) => inc);
}

export type PdSummary = {
  hours: { t: number; high: number; low: number }[]; // 시간대별 생성 건수
  open: number;
  triggered: number;
  mttaMin: number | null; // 평균 확인(acknowledge)까지 걸린 분
  mttrMin: number | null; // 평균 해결까지 걸린 분
  total: number;
  recent: { no: number; title: string; status: PdApiIncident["status"]; urgency: PdApiIncident["urgency"]; at: string; alerts: number }[]; // 최근 인시던트
};

/** API 응답 모양의 인시던트를 위젯용 요약으로 바꾼다(실데이터·샘플 공통). */
export function summarize(list: PdApiIncident[], now = Date.now()): PdSummary {
  const hours = Array.from({ length: 24 }, (_, i) => ({ t: Math.floor((now - (24 - i) * 3_600_000) / 1000), high: 0, low: 0 }));
  let ackSum = 0, ackN = 0, resSum = 0, resN = 0;
  for (const inc of list) {
    const c = Date.parse(inc.created_at);
    const idx = Math.floor((c - (now - 24 * 3_600_000)) / 3_600_000);
    if (idx >= 0 && idx < 24) hours[idx][inc.urgency] += 1;
    const ack = inc.acknowledgements?.[0]?.at;
    if (ack) { ackSum += (Date.parse(ack) - c) / 60_000; ackN++; }
    if (inc.status === "resolved") { resSum += (Date.parse(inc.last_status_change_at) - c) / 60_000; resN++; }
  }
  return {
    hours,
    open: list.filter((i) => i.status !== "resolved").length,
    triggered: list.filter((i) => i.status === "triggered").length,
    mttaMin: ackN ? ackSum / ackN : null,
    mttrMin: resN ? resSum / resN : null,
    total: list.length,
    recent: [...list]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 3)
      .map((i) => ({ no: i.incident_number, title: i.title, status: i.status, urgency: i.urgency, at: i.created_at, alerts: i.alert_counts?.all ?? 1 })),
  };
}
