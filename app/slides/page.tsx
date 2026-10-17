import Link from "next/link";
import { listDecks } from "@/lib/slides";

export const dynamic = "force-dynamic";

const LANG: Record<string, string> = { ja: "日本語", ko: "한국어", en: "English" };

// 덱 목록. 새 덱은 slides/_template 을 복사해 slides/<덱이름>/ 으로 만든다(README "새 덱 추가하기").
export default async function SlidesIndex() {
  const decks = await listDecks();
  return (
    <main className="page">
      <header className="page-head">
        <h1>Slides</h1>
        <p>발표 슬라이드와 대본을 확인하세요. 휴대폰·태블릿에서 대본을 읽고, 저장해서 오프라인으로 연습할 수 있습니다.</p>
      </header>
      <div className="cards">
        {decks.map((d) => (
          <article key={d.name} className="card deck-card" style={{ padding: 0, overflow: "hidden" }}>
            <Link
              href={`/slides/${d.name}`}
              aria-label={`${d.title} 슬라이드 보기`}
              style={{
                aspectRatio: "16 / 9",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: 6,
                background: d.theme === "light" ? "#f6f7fa" : "#070b14",
                color: d.theme === "light" ? "#0f1624" : "#eef1f6",
                borderBottom: "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              <span style={{ font: "700 11px var(--mono)", letterSpacing: "0.2em", color: "#7c73c2" }}>JENNIFER</span>
              <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>{d.title}</span>
            </Link>
            <div style={{ padding: "14px 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {d.description && <span className="card-desc">{d.description}</span>}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="chip">{d.slideCount}장</span>
                {d.lang && <span className="chip">{LANG[d.lang] ?? d.lang}</span>}
                <span className="chip">{d.theme === "light" ? "Light" : "Dark"}</span>
                {d.date && <span className="chip">{d.date}</span>}
              </div>
              <div className="deck-actions">
                <Link href={`/slides/${d.name}`} className="deck-action">슬라이드 보기</Link>
                <a href={`/slides/${d.name}/script`} className="deck-action primary">대본 연습</a>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p style={{ marginTop: 28, color: "var(--text-3)", fontSize: 13 }}>
        새 덱: <code>cp -r slides/_template slides/&lt;덱이름&gt;</code> · 템플릿 미리보기 <Link href="/slides/_template">/slides/_template</Link>
      </p>
    </main>
  );
}
