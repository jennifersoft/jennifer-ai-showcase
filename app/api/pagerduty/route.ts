import { sampleIncidents, summarize, type PdApiIncident } from "@/lib/pagerduty-sample";

// 최근 24시간 PagerDuty 인시던트 요약. PAGERDUTY_API_KEY 가 있으면 REST API v2, 없으면 같은 모양의 샘플.
export async function GET() {
  const key = process.env.PAGERDUTY_API_KEY;
  const now = Date.now();
  if (key) {
    try {
      const url = new URL("https://api.pagerduty.com/incidents");
      url.searchParams.set("since", new Date(now - 24 * 3_600_000).toISOString());
      url.searchParams.set("until", new Date(now).toISOString());
      url.searchParams.set("limit", "100");
      for (const s of ["triggered", "acknowledged", "resolved"]) url.searchParams.append("statuses[]", s);
      const serviceId = process.env.PAGERDUTY_SERVICE_ID;
      if (serviceId) url.searchParams.append("service_ids[]", serviceId);
      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
        headers: { Authorization: `Token token=${key}`, Accept: "application/vnd.pagerduty+json;version=2" },
      });
      if (!res.ok) throw new Error(String(res.status));
      const json: { incidents: PdApiIncident[] } = await res.json();
      return Response.json({ source: "live", ...summarize(json.incidents, now) });
    } catch {
      // 실패하면 샘플로
    }
  }
  return Response.json({ source: "sample", ...summarize(sampleIncidents(now), now) });
}
