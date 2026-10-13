import { notFound } from "next/navigation";
import { readDeckScript } from "@/lib/slides";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

// 인쇄용 대본: 장마다 번호 · 일본어 제목 · 한국어 보조 줄 · 대본(data-script). 통역사에게 넘기는 용도.
// ?notes=1 이면 발표자 노트(data-notes)도 함께 보여 준다.
export default async function DeckScript({
  params,
  searchParams,
}: {
  params: Promise<{ deck: string }>;
  searchParams: Promise<{ notes?: string }>;
}) {
  const { deck } = await params;
  const withNotes = (await searchParams).notes === "1";
  const data = await readDeckScript(deck);
  if (data === null) notFound();

  return (
    <main className="script-page">
      <style>{`
        .script-page{max-width:880px;margin:0 auto;padding:40px 28px 80px;font-family:var(--font);color:#111;background:#fff}
        .script-page h1{font-size:24px;margin:0 0 4px}
        .script-page .meta{color:#666;font-size:13px;margin:0 0 24px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
        .script-page article{border-top:1px solid #ddd;padding:16px 0;break-inside:avoid;page-break-inside:avoid}
        .script-page .no{font:700 12px var(--mono);color:#7c73c2}
        .script-page h2{font-size:17px;margin:2px 0 2px}
        .script-page .sub{color:#666;font-size:13px;margin:0 0 8px}
        .script-page .script{font-size:15.5px;line-height:1.75;margin:0;white-space:pre-wrap}
        .script-page .notes{margin:8px 0 0;padding:8px 10px;background:#f5f5f7;border-radius:6px;font-size:12.5px;color:#555;line-height:1.6}
        @media print{.no-print{display:none!important}.script-page{padding:0}@page{size:A4;margin:16mm 14mm}}
        html,body{background:#fff}
      `}</style>
      <h1>{data.meta.title} — 대본</h1>
      <div className="meta">
        <span>{data.items.length}장</span>
        <span>통역사·발표자용 한국어 대본</span>
        <span className="no-print">
          <PrintButton /> · <a href={withNotes ? "?" : "?notes=1"}>{withNotes ? "노트 숨기기" : "발표자 노트도 보기"}</a> ·{" "}
          <a href={`/slides/${deck}`}>슬라이드로</a>
        </span>
      </div>
      {data.items.map((it) => (
        <article key={it.no}>
          <div className="no">{String(it.no).padStart(2, "0")}</div>
          <h2>{it.title}</h2>
          {it.subtitle && <p className="sub">{it.subtitle}</p>}
          <p className="script">{it.script || "(대본 없음)"}</p>
          {withNotes && it.notes && <p className="notes">노트: {it.notes}</p>}
        </article>
      ))}
    </main>
  );
}
