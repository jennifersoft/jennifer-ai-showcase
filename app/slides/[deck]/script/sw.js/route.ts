export const dynamic = "force-dynamic";

// 설치한 대본 앱용 서비스 워커. 먼저 네트워크에서 받아 최신 대본을 보여 주고, 연결이 끊기면 마지막으로 받은 대본을 연다.
const SW = `
const CACHE = "stage-script-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (!url.pathname.includes("/script") && !url.pathname.startsWith("/slides-script/")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: false }).then((hit) => hit || caches.match(req, { ignoreSearch: true })).then((hit) => hit || Response.error()))
  );
});
`;

export async function GET(_request: Request, { params }: { params: Promise<{ deck: string }> }) {
  const { deck } = await params;
  // 대본 주소(/slides/<덱>/script)는 이 파일 폴더 밖이라 범위를 덱 폴더까지 넓혀 준다
  return new Response(SW, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": `/slides/${encodeURIComponent(deck)}/`,
    },
  });
}
