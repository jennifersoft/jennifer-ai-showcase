import { NextRequest } from "next/server";
import { fetchIncidents } from "@/lib/pagerduty";
import { resolveLang } from "@/lib/i18n";

// ?lang= 은 샘플 데이터 문구에만 쓴다(실제 PagerDuty 제목은 그대로).
export async function GET(req: NextRequest) {
  const lang = resolveLang(req.nextUrl.searchParams.get("lang"), req.headers.get("accept-language"));
  return Response.json(await fetchIncidents(lang));
}
