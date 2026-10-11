import { NextRequest } from "next/server";
import { addWebhookEvent, fetchGithubReleases, getWebhookEvents, inRange, isValidTime } from "../../lib/deploys";

const DEFAULT_HOURS = 24;
const MAX_HOURS = 24 * 90;

// GET /api/deploys?hours=24 : 최근 N시간의 배포 이벤트
export async function GET(req: NextRequest) {
  const hoursParam = Number(req.nextUrl.searchParams.get("hours") ?? DEFAULT_HOURS);
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? Math.min(hoursParam, MAX_HOURS) : DEFAULT_HOURS;
  const to = Date.now();
  const from = to - hours * 3600 * 1000;

  const repo = process.env.DEPLOY_GITHUB_REPO;
  const github = repo ? await fetchGithubReleases(repo, process.env.GITHUB_TOKEN).catch(() => []) : [];

  return Response.json({ from, to, events: inRange([...getWebhookEvents(), ...github], from, to) });
}

// POST /api/deploys : CI 파이프라인이 배포 직후 호출한다.
// 헤더 Authorization: Bearer <DEPLOY_WEBHOOK_SECRET>, 본문 {"title":"v1.2.3","service":"order-api","time":"2026-10-11T12:00:00Z"}
export async function POST(req: NextRequest) {
  const secret = process.env.DEPLOY_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "DEPLOY_WEBHOOK_SECRET not set" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 120) : "";
  if (title === "") {
    return Response.json({ error: "title is required" }, { status: 400 });
  }
  const time = isValidTime(body?.time) ? new Date(body.time).toISOString() : new Date().toISOString();
  const service = typeof body?.service === "string" ? body.service.slice(0, 60) : undefined;
  const url = typeof body?.url === "string" && /^https?:\/\//.test(body.url) ? body.url : undefined;

  return Response.json(addWebhookEvent({ title, time, service, url }), { status: 201 });
}
