import { t, type Lang } from "./i18n";

// PagerDuty REST API v2로 열린 인시던트(triggered, acknowledged)를 읽는다. 키는 서버 환경변수에만 둔다.
export type Incident = {
  id: string;
  title: string;
  status: "triggered" | "acknowledged" | "resolved";
  urgency: "high" | "low";
  service: string;
  assignee: string;
  createdAt: string;
  url?: string;
};

export type IncidentList = { source: "live" | "sample"; incidents: Incident[] };

type PdIncident = {
  id: string;
  title: string;
  status: Incident["status"];
  urgency: Incident["urgency"];
  created_at: string;
  html_url: string;
  service?: { summary?: string };
  assignments?: { assignee?: { summary?: string } }[];
};

// 키가 없거나 호출에 실패하면 보여줄 샘플. 제니퍼 이벤트가 어댑터를 거쳐 들어온 모습을 가정한다.
function sample(lang: Lang): Incident[] {
  const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
  return [
    { id: "S1", title: t(lang, "incidents.sample1"), status: "triggered", urgency: "high", service: "JENNIFER APM", assignee: "On-call A", createdAt: ago(3) },
    { id: "S2", title: t(lang, "incidents.sample2"), status: "acknowledged", urgency: "high", service: "JENNIFER APM", assignee: "On-call B", createdAt: ago(18) },
    { id: "S3", title: t(lang, "incidents.sample3"), status: "acknowledged", urgency: "low", service: "JENNIFER APM", assignee: "On-call A", createdAt: ago(42) },
  ];
}

export async function fetchIncidents(lang: Lang = "en"): Promise<IncidentList> {
  const key = process.env.PAGERDUTY_API_KEY;
  if (!key) return { source: "sample", incidents: sample(lang) };

  const url = new URL("https://api.pagerduty.com/incidents");
  url.searchParams.append("statuses[]", "triggered");
  url.searchParams.append("statuses[]", "acknowledged");
  url.searchParams.set("limit", "20");
  const serviceId = process.env.PAGERDUTY_SERVICE_ID;
  if (serviceId) url.searchParams.append("service_ids[]", serviceId);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Token token=${key}`, Accept: "application/vnd.pagerduty+json;version=2" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const json: { incidents: PdIncident[] } = await res.json();
    return {
      source: "live",
      incidents: json.incidents.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        urgency: i.urgency,
        service: i.service?.summary ?? "-",
        assignee: i.assignments?.[0]?.assignee?.summary ?? "-",
        createdAt: i.created_at,
        url: i.html_url,
      })),
    };
  } catch {
    return { source: "sample", incidents: sample(lang) };
  }
}
