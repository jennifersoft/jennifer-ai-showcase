// 배포·변경 타임라인 데모의 이벤트. 두 곳에서 모은다.
// 1) CI가 POST /api/deploys 로 보낸 배포 이벤트 (서버 메모리, 재시작하면 사라짐)
// 2) DEPLOY_GITHUB_REPO 의 GitHub 릴리즈 (설정했을 때만)
export type DeployEvent = {
  id: string;
  time: string; // ISO 8601
  title: string;
  service?: string;
  url?: string;
  source: "webhook" | "github";
};

const MAX_EVENTS = 200;
const webhookEvents: DeployEvent[] = [];

export function addWebhookEvent(event: Omit<DeployEvent, "id" | "source">): DeployEvent {
  const saved: DeployEvent = { ...event, id: `wh-${Date.now()}-${webhookEvents.length}`, source: "webhook" };
  webhookEvents.unshift(saved);
  webhookEvents.length = Math.min(webhookEvents.length, MAX_EVENTS);
  return saved;
}

export function getWebhookEvents(): DeployEvent[] {
  return [...webhookEvents];
}

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/** 시간 범위 안의 이벤트만 시간순으로 남긴다. */
export function inRange(events: DeployEvent[], fromMs: number, toMs: number): DeployEvent[] {
  return events
    .filter((e) => {
      const t = Date.parse(e.time);
      return t >= fromMs && t <= toMs;
    })
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
}

export async function fetchGithubReleases(repo: string, token?: string): Promise<DeployEvent[]> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=50`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return [];
  const releases: { id: number; tag_name: string; name?: string; published_at?: string; html_url?: string }[] =
    await res.json();
  return releases
    .filter((r) => isValidTime(r.published_at))
    .map((r) => ({
      id: `gh-${r.id}`,
      time: r.published_at as string,
      title: r.name || r.tag_name,
      service: repo,
      url: r.html_url,
      source: "github" as const,
    }));
}
