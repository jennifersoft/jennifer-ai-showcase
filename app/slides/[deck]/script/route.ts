import { isDeckName, readDeckScript } from "@/lib/slides";
import { renderScriptDocument } from "@/lib/script-document";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// HTML 전체가 한 응답에 들어 있어 ?download=1로 저장하면 인터넷 없이 대본을 전환할 수 있다.
export async function GET(request: Request, { params }: { params: Promise<{ deck: string }> }) {
  const { deck } = await params;
  const headers: Record<string, string> = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (!isDeckName(deck) && deck !== "_template") return new Response("deck not found", { status: 404, headers });

  const data = await readDeckScript(deck);
  if (data === null) return new Response("deck not found", { status: 404, headers });

  const query = new URL(request.url).searchParams;
  const download = query.get("download") === "1";
  const html = await renderScriptDocument(deck, data, {
    mode: query.get("mode") === "interpreter" ? "interpreter" : "presenter",
    withNotes: query.get("notes") === "1",
    download,
  });
  if (download) headers["Content-Disposition"] = `attachment; filename="${deck}-script.html"`;
  return new Response(html, { headers });
}
