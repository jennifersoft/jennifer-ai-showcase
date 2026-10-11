import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";

// 발표 슬라이드를 서버에서 렌더링한다. 라이브 슬라이드의 iframe 주소를 환경변수(또는 쿼리)로 채운다.
// - JENNIFER_DASHBOARD_URL: 제니퍼 사용자정의 대시보드 주소 (예: https://jennifer.example.com/userdefine/dashboard?key=...&layout=iframe)
// - 통합 대시보드는 이 서버의 /dashboards/integrated
// 쿼리 ?jennifer=<url> 로 발표 직전에 덮어쓸 수 있다(http/https만 허용).
const DECK_PATH = path.join(process.cwd(), "slides", "deck.html");

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function httpUrlOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function frame(src: string | null, title: string, missing: string): string {
  if (src === null) return `<div class="empty">${escapeAttr(missing)}</div>`;
  // 보호막(shield)이 덮여 있어 클릭·키보드는 슬라이드가 받는다. I 키로 iframe을 직접 조작하는 모드로 바꾼다.
  return `<div class="frame"><iframe src="${escapeAttr(src)}" title="${escapeAttr(title)}" loading="lazy" allow="fullscreen"></iframe><div class="shield"></div></div><p class="hint">I : 画面操作 / 조작 모드 전환</p>`;
}

export async function GET(req: NextRequest) {
  const deck = await readFile(DECK_PATH, "utf8");
  const jennifer =
    httpUrlOrNull(req.nextUrl.searchParams.get("jennifer")) ?? httpUrlOrNull(process.env.JENNIFER_DASHBOARD_URL);

  const html = deck
    .replace("{{LIVE_JENNIFER}}", frame(jennifer, "JENNIFER dashboard", "JENNIFER_DASHBOARD_URL 未設定 / ?jennifer= で指定"))
    .replace("{{LIVE_INTEGRATED}}", frame("/dashboards/integrated", "Integrated dashboard", ""));

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
