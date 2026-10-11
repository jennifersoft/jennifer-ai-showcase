import { fetchIncidents } from "@/lib/pagerduty";

export async function GET() {
  return Response.json(await fetchIncidents());
}
