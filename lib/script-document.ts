import { readFile } from "node:fs/promises";
import path from "node:path";
import { escapeHtml, SLIDES_DIR, type DeckMeta, type ScriptItem } from "./slides";

export type ScriptDocumentOptions = {
  mode?: "presenter" | "interpreter";
  withNotes?: boolean;
  download?: boolean;
};

type ScriptDocumentData = { meta: DeckMeta; items: ScriptItem[] };

function presenterCopy(value: string): string {
  const chunks = value.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean);
  if (chunks.length === 0) return '<p class="spoken empty-script">(대본 없음)</p>';
  return chunks.map((chunk) => `<div class="spoken-chunk">
<p class="spoken">${escapeHtml(chunk)}</p>
<p class="pause-cue"><span aria-hidden="true">Ⅱ</span> 통역 대기</p>
</div>`).join("\n");
}

function slideNumber(item: ScriptItem, index: number): number {
  return Number.isSafeInteger(item.no) && item.no > 0 ? item.no : index + 1;
}

function renderArticle(item: ScriptItem, index: number, lang: string): string {
  const no = slideNumber(item, index);
  const presenter = item.presenter?.trim() || item.script?.trim() || "";
  const interpreter = item.script?.trim() || "(대본 없음)";
  return `<article class="script-slide" id="s${no}" tabindex="-1" aria-labelledby="s${no}-title">
<header class="chapter-heading">
<a class="slide-number" href="#s${no}" aria-label="${no}번째 장 링크">${String(no).padStart(2, "0")}</a>
<div class="chapter-titles">
<h2 id="s${no}-title" lang="${escapeHtml(lang)}">${escapeHtml(item.title || `${no}번째 슬라이드`)}</h2>
${item.subtitle ? `<p class="chapter-subtitle">${escapeHtml(item.subtitle)}</p>` : ""}
</div>
</header>
<div class="script-copy" data-script-mode="presenter" aria-label="발표자 대본">
${presenterCopy(presenter)}
</div>
<div class="script-copy" data-script-mode="interpreter" aria-label="통역용 원고">
<p class="spoken">${escapeHtml(interpreter)}</p>
</div>
${item.notes?.trim() ? `<aside class="explanatory-notes" aria-label="참고 노트"><h3>참고 노트</h3><p>${escapeHtml(item.notes.trim())}</p></aside>` : ""}
</article>`;
}

/** 모든 대본·노트와 CSS·JS를 한 HTML에 담아 온라인·기내에서 같은 방식으로 읽는다. */
export async function renderScriptDocument(
  name: string,
  data: ScriptDocumentData,
  options: ScriptDocumentOptions = {},
): Promise<string> {
  const mode = options.mode === "interpreter" ? "interpreter" : "presenter";
  const withNotes = options.withNotes === true;
  const downloaded = options.download === true;
  const engineDir = path.join(SLIDES_DIR, "_engine");
  const [css, js] = await Promise.all([
    readFile(path.join(engineDir, "script.css"), "utf8"),
    readFile(path.join(engineDir, "script.js"), "utf8"),
  ]);
  const deckPath = `/slides/${encodeURIComponent(name)}`;
  const scriptPath = `${deckPath}/script`;
  const downloadQuery = new URLSearchParams({ download: "1", mode });
  if (withNotes) downloadQuery.set("notes", "1");
  const chapterOptions = data.items.map((item, index) => {
    const no = slideNumber(item, index);
    return `<option value="s${no}">${escapeHtml(`${String(no).padStart(2, "0")} · ${item.title || `${no}번째 슬라이드`}`)}</option>`;
  }).join("\n");

  return `<!doctype html>
<html lang="ko" data-mode="${mode}" data-notes="${withNotes}" data-saved="${downloaded}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light">
<title>${escapeHtml(data.meta.title)} — 리허설 대본</title>
<link rel="icon" href="data:,">
<style>
${css}
</style>
</head>
<body>
<a class="skip-link no-print" href="#script-content">대본으로 바로 가기</a>
<header class="reader-header page-width">
${downloaded ? "" : `<nav class="top-links online-only no-print" aria-label="슬라이드 탐색"><a href="/slides">← 슬라이드 목록</a><a href="${escapeHtml(deckPath)}">슬라이드 열기 ↗</a></nav>`}
<p class="eyebrow">REHEARSAL SCRIPT <span class="saved-only saved-badge no-print">저장된 대본</span></p>
<h1>${escapeHtml(data.meta.title)}</h1>
<p class="reader-meta"><span>${data.items.length}장</span><span aria-hidden="true">·</span><span data-script-mode="presenter">발표자 대본</span><span data-script-mode="interpreter">통역용 원고</span></p>
<div class="document-actions no-print">
${downloaded ? "" : `<a class="action-button primary online-only" data-download data-download-path="${escapeHtml(scriptPath)}" href="${escapeHtml(`${scriptPath}?${downloadQuery}`)}" download>오프라인 저장</a>`}
<button class="action-button print-button js-only" type="button" id="print-script">인쇄 / PDF</button>
</div>
${downloaded ? "" : `<p class="save-help online-only no-print"><strong>탑승 전에 저장해 주세요.</strong> ‘오프라인 저장’으로 HTML 파일을 기기에 저장한 뒤, 비행기 모드에서 열어 확인하세요. 파일 열기가 어려운 기기에서는 ‘인쇄 / PDF’로 저장할 수 있습니다.</p>`}
<p class="save-help saved-only no-print"><strong>인터넷 없이 읽는 저장된 대본입니다.</strong> 모든 장의 발표자 대본, 통역용 원고와 참고 노트가 이 파일에 들어 있습니다. 아래에서 대본 종류와 글자 크기를 바꿀 수 있습니다.</p>
<noscript><p class="save-help no-print">현재 선택된 대본을 읽을 수 있습니다. 대본 전환과 글자 크기 조절은 JavaScript를 지원하는 브라우저에서 사용할 수 있습니다.</p></noscript>
</header>
<div class="reader-toolbar js-only no-print" id="reader-toolbar">
<div class="toolbar-inner page-width">
<div class="mode-switch" role="group" aria-label="대본 종류">
<button type="button" data-mode-button="presenter" aria-pressed="${mode === "presenter"}">발표자 대본</button>
<button type="button" data-mode-button="interpreter" aria-pressed="${mode === "interpreter"}">통역용 원고</button>
</div>
<div class="reader-controls">
<label class="control chapter-control" for="chapter-select"><span>장 이동</span><select id="chapter-select"${data.items.length ? "" : " disabled"}>${chapterOptions || '<option value="">대본 없음</option>'}</select></label>
<label class="control size-control" for="text-size"><span>글자 크기</span><select id="text-size"><option value="18">작게 · 18px</option><option value="20" selected>기본 · 20px</option><option value="22">크게 · 22px</option><option value="26">아주 크게 · 26px</option></select></label>
<label class="notes-toggle" for="notes-toggle"><input type="checkbox" id="notes-toggle"${withNotes ? " checked" : ""}><span>참고 노트</span></label>
</div>
</div>
</div>
<main class="script-page page-width" id="script-content" tabindex="-1">
<p class="reading-hint no-print" data-script-mode="presenter">한 문단씩 말하고, <span class="inline-cue">통역 대기</span> 표시에서 잠시 멈추세요. 대기 표시는 읽는 문장이 아닙니다.</p>
<p class="reading-hint no-print" data-script-mode="interpreter">통역 준비용 상세 참고 자료입니다. 현장에서는 ‘발표자 대본’의 구간에 맞춰 통역하세요. 필요하면 참고 노트도 함께 확인하세요.</p>
${data.items.map((item, index) => renderArticle(item, index, data.meta.lang ?? "ja")).join("\n") || '<p class="empty-state">표시할 대본이 없습니다.</p>'}
</main>
<footer class="reader-footer page-width no-print"><a href="#script-content">대본 처음으로 ↑</a><span>${data.items.length}장 전체 수록</span></footer>
<script>
${js}
</script>
</body>
</html>`;
}
