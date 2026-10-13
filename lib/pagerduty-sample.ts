// PagerDuty 유료 계정 없이 데모하기 위한 샘플 인시던트.
// 실제 REST API v2 GET /incidents 응답과 같은 모양(PdApiIncident)으로 만들고, 위젯은 이 모양만 읽는다.
// 그래서 PAGERDUTY_API_KEY 를 넣으면 같은 코드로 실제 데이터를 그대로 그릴 수 있다.

export type PdApiIncident = {
  id: string;
  incident_number: number;
  title: string;
  status: "triggered" | "acknowledged" | "resolved";
  urgency: "high" | "low";
  created_at: string;
  last_status_change_at: string;
  service: { id: string; summary: string };
  assignments: { at: string; assignee: { summary: string } }[];
  acknowledgements?: { at: string }[];
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

const SERVICES = [
  { id: "PSVC001", summary: "order-api" },
  { id: "PSVC002", summary: "payment-api" },
  { id: "PSVC003", summary: "batch-01" },
  { id: "PSVC004", summary: "member-api" },
];
const EVENTS = [
  "Response time over threshold",
  "Error rate spike",
  "Active services rising",
  "SERVICE_EXCEPTION",
  "DB connection pool exhausted",
];
const ONCALL = ["On-call A", "On-call B", "On-call C"];

/** 최근 24시간 샘플 인시던트. 업무 시간대(9~19시)에 많이 몰리고, 대부분 해결되며 최근 것만 열려 있다. */
export function sampleIncidents(now = Date.now()): PdApiIncident[] {
  const day = Math.floor(now / 86_400_000);
  const r = rng(day * 7919);
  const out: PdApiIncident[] = [];
  let n = 1200 + (day % 100) * 3;
  for (let h = 23; h >= 0; h--) {
    const hourStart = now - (h + 1) * 3_600_000;
    const local = new Date(hourStart).getHours();
    const busy = local >= 9 && local <= 19;
    const count = Math.floor(r() * (busy ? 4 : 1.6) + (busy && r() > 0.7 ? 2 : 0));
    for (let i = 0; i < count; i++) {
      const created = hourStart + Math.floor(r() * 3_600_000);
      const ageMin = (now - created) / 60_000;
      const high = r() < 0.38;
      const mtta = (high ? 2 : 6) + r() * (high ? 6 : 18); // 분
      const mttr = mtta + (high ? 12 : 25) + r() * (high ? 45 : 90);
      const status: PdApiIncident["status"] =
        ageMin < mtta ? "triggered" : ageMin < mttr ? "acknowledged" : "resolved";
      const svc = SERVICES[Math.floor(r() * SERVICES.length)];
      const ev = EVENTS[Math.floor(r() * EVENTS.length)];
      const ackAt = created + mtta * 60_000;
      const changed = status === "triggered" ? created : status === "acknowledged" ? ackAt : created + mttr * 60_000;
      n += 1;
      out.push({
        id: `Q${n.toString(36).toUpperCase()}`,
        incident_number: n,
        title: `[JENNIFER] ${ev} · ${svc.summary}`,
        status,
        urgency: high ? "high" : "low",
        created_at: new Date(created).toISOString(),
        last_status_change_at: new Date(changed).toISOString(),
        service: svc,
        assignments: [{ at: new Date(created).toISOString(), assignee: { summary: ONCALL[Math.floor(r() * ONCALL.length)] } }],
        acknowledgements: status === "triggered" ? [] : [{ at: new Date(ackAt).toISOString() }],
        html_url: `https://example.pagerduty.com/incidents/Q${n.toString(36).toUpperCase()}`,
      });
    }
  }
  return out;
}

export type PdSummary = {
  hours: { t: number; high: number; low: number }[]; // 시간대별 생성 건수
  open: number;
  triggered: number;
  mttaMin: number | null; // 평균 확인(acknowledge)까지 걸린 분
  mttrMin: number | null; // 평균 해결까지 걸린 분
  total: number;
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
  };
}
