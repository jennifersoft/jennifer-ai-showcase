import { fetchSeries, isQueryKey } from "@/lib/prometheus";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isQueryKey(key)) return Response.json({ error: "unknown query" }, { status: 404 });
  return Response.json(await fetchSeries(key));
}
