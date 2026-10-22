import { readFile } from "node:fs/promises";
import path from "node:path";
import { escapeHtml, SLIDES_DIR, type DeckMeta, type ScriptItem } from "./slides";

type StageDocumentData = { meta: DeckMeta; items: ScriptItem[] };

function chunksOf(value: string): string[] {
  return value.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean);
}

/** 노트에서 발표 중에 필요한 줄([진행], 연결·영상·화면이 안 될 때)만 뽑는다. 화면 설명 같은 배경은 뺀다. */
const STAGE_LABELS = /^\[(진행|연결이 되지 않으면|영상이 나오지 않으면|화면이 나오지 않으면)\]/;

function progressCues(notes: string): string[] {
  const cues: string[] = [];
  let keep = false;
  for (const raw of notes.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) { keep = false; continue; }
    if (line.startsWith("[")) keep = STAGE_LABELS.test(line);
    if (!keep) continue;
    if (line.startsWith("[")) cues.push(line.replace(/^\[진행\]\s*/, ""));
    else cues[cues.length - 1] += "\n" + line;
  }
  return cues;
}

function badges(item: ScriptItem): string {
  const list: string[] = [];
  const steps = item.steps ?? 0;
  if (steps > 0 && !item.autoplay) list.push(`<span class="badge click">클릭 ${steps}번</span>`);
  if (item.autoplay) list.push('<span class="badge auto">자동 진행</span>');
  if (item.live) list.push('<span class="badge live">라이브 화면</span>');
  return list.join("");
}

function renderCard(item: ScriptItem, index: number, items: ScriptItem[], lang: string): string {
  const no = index + 1;
  const total = items.length;
  const presenter = chunksOf(item.presenter?.trim() || item.script?.trim() || "");
  const interpreter = chunksOf(item.script?.trim() || "");
  const pause = '<p class="pause" data-only="presenter"><span aria-hidden="true">Ⅱ</span> 통역 대기</p>';
  const cues = progressCues(item.notes ?? "");
  const next = items[index + 1];
  return `<article class="card" id="s${no}" data-index="${index}" aria-label="${no}번째 장"${index === 0 ? "" : " hidden"}>
<header class="card-head">
<p class="count"><b>${no}</b><span>/ ${total}</span></p>
<div class="head-text">
<h2 lang="${escapeHtml(lang)}">${escapeHtml(item.title || `${no}번째 슬라이드`)}</h2>
<p class="badges">${badges(item)}</p>
</div>
</header>
<div class="lines" data-only="presenter">
${presenter.map((chunk) => `<p class="spoken">${escapeHtml(chunk)}</p>`).join(`\n${pause}\n`) || '<p class="spoken empty">(대본 없음)</p>'}
${presenter.length ? pause : ""}
</div>
<div class="lines" data-only="interpreter">
${interpreter.map((chunk) => `<p class="spoken">${escapeHtml(chunk)}</p>`).join("\n") || '<p class="spoken empty">(대본 없음)</p>'}
</div>
${cues.length ? `<aside class="cue">${cues.map((cue) => `<p>${escapeHtml(cue)}</p>`).join("")}</aside>` : ""}
<p class="next">${next ? `다음 ▸ <b>${String(no + 1).padStart(2, "0")}</b> <span lang="${escapeHtml(lang)}">${escapeHtml(next.title)}</span>` : "마지막 장입니다"}</p>
</article>`;
}

/** 발표 중에 휴대폰·폴드·태블릿으로 한 장씩 보는 대본. 어두운 화면에 큰 글씨로 보여 준다. */
export async function renderStageDocument(
  name: string,
  data: StageDocumentData,
  mode: "presenter" | "interpreter",
): Promise<string> {
  const engineDir = path.join(SLIDES_DIR, "_engine");
  const [css, js] = await Promise.all([
    readFile(path.join(engineDir, "stage.css"), "utf8"),
    readFile(path.join(engineDir, "stage.js"), "utf8"),
  ]);
  const lang = data.meta.lang ?? "ja";
  const total = data.items.length;
  const jumpList = data.items
    .map((item, index) => `<li><button type="button" data-go="${index}"><b>${String(index + 1).padStart(2, "0")}</b><span lang="${escapeHtml(lang)}">${escapeHtml(item.title)}</span></button></li>`)
    .join("\n");

  return `<!doctype html>
<html lang="ko" data-mode="${mode}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0E0F12">
<link rel="manifest" href="/slides/${encodeURIComponent(name)}/script/manifest?mode=${mode}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${mode === "interpreter" ? "통역 대본" : "발표 대본"}">
<link rel="apple-touch-icon" href="/slides-script/icon-192.png">
<title>${escapeHtml(data.meta.title)} — 발표 중 대본</title>
<link rel="icon" href="data:,">
<style>
${css}
</style>
</head>
<body>
<div class="bar">
<div class="mode" role="group" aria-label="대본 종류">
<button type="button" data-mode-button="presenter" aria-pressed="${mode === "presenter"}">발표자</button>
<button type="button" data-mode-button="interpreter" aria-pressed="${mode === "interpreter"}">통역</button>
</div>
<div class="tools">
<button type="button" data-size="-1" aria-label="글자 작게">가−</button>
<button type="button" data-size="1" aria-label="글자 크게">가+</button>
<button type="button" id="install" hidden>설치</button>
<button type="button" id="open-list" aria-haspopup="dialog">목록</button>
</div>
</div>
<main id="cards">
${data.items.map((item, index) => renderCard(item, index, data.items, lang)).join("\n") || '<p class="spoken empty">표시할 대본이 없습니다.</p>'}
</main>
<nav class="pager" aria-label="장 이동">
<button type="button" id="prev" aria-label="이전 장">◀ 이전</button>
<span id="pos" aria-live="polite">1 / ${total}</span>
<button type="button" id="next" aria-label="다음 장">다음 ▶</button>
</nav>
<dialog id="list" aria-label="장 목록">
<form method="dialog"><button class="close" aria-label="닫기">닫기</button></form>
<ol>${jumpList}</ol>
</dialog>
<script data-sw="/slides/${encodeURIComponent(name)}/script/sw.js" data-sw-scope="/slides/${encodeURIComponent(name)}/">
${js}
</script>
</body>
</html>`;
}
