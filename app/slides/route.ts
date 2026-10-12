import { escapeHtml, listDecks } from "@/lib/slides";

// /slides : 덱 목록. 새 덱은 slides/_template 을 복사해 slides/<덱이름>/ 으로 만든다.
export async function GET() {
  const decks = await listDecks();
  const items = decks
    .map(
      (d) =>
        `<li><a href="/slides/${escapeHtml(d.name)}">${escapeHtml(d.title)}</a> <small>${escapeHtml(d.date ?? "")} · ${escapeHtml(d.name)}</small>${d.description ? `<p>${escapeHtml(d.description)}</p>` : ""}</li>`
    )
    .join("\n");
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Slides</title>
<style>body{font-family:system-ui,sans-serif;background:#070B14;color:#EEF1F6;margin:0;padding:48px;line-height:1.6}a{color:#FF6B35;font-size:22px;font-weight:700;text-decoration:none}small{color:#8E9CB3;margin-left:8px}p{margin:4px 0 0;color:#8E9CB3}ul{list-style:none;padding:0;display:grid;gap:24px}</style>
</head><body><h1>JENNIFER Slides</h1><ul>${items}</ul></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
