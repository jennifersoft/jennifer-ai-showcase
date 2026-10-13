import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// 재사용 슬라이드 구조
// slides/_engine/   모든 덱이 같이 쓰는 엔진(engine.css, engine.js)과 HUD(chrome.html)
// slides/_template/ 새 덱을 만들 때 복사하는 시작 템플릿 (목록에는 안 보임)
// slides/<덱>/      meta.json, slides.html(<section class="slide"> 목록), deck.css, deck.js(선택)
//
// slides.html 안의 라이브 자리표시자
// {{live:jennifer}}        제니퍼 사용자정의 대시보드 (JENNIFER_DASHBOARD_URL 또는 ?jennifer=)
// {{live:/경로}}            이 서버의 페이지 (예: {{live:/dashboards/integrated}})
export const SLIDES_DIR = path.join(process.cwd(), "slides");
const DECK_NAME = /^[a-z0-9][a-z0-9-]*$/;

export type DeckMeta = {
  title: string;
  /** dark(기본) | light. ?theme= 로 미리보기 때 바꿀 수 있다 */
  theme?: "dark" | "light";
  lang?: string;
  date?: string;
  description?: string;
  fonts?: string;
};

export function isDeckName(name: string): boolean {
  return DECK_NAME.test(name);
}

async function readOptional(file: string): Promise<string> {
  try {
    return await readFile(file, "utf8");
  } catch {
    return "";
  }
}

export async function readDeckMeta(name: string): Promise<DeckMeta | null> {
  if (!isDeckName(name) && name !== "_template") return null;
  const raw = await readOptional(path.join(SLIDES_DIR, name, "meta.json"));
  if (raw === "") return null;
  return JSON.parse(raw) as DeckMeta;
}

/** 목록에 보일 덱. 이름이 _ 로 시작하는 폴더(엔진, 템플릿)는 뺀다. 날짜 최신순. */
export type DeckSummary = DeckMeta & { name: string; slideCount: number };

async function countSlides(name: string): Promise<number> {
  const html = await readOptional(path.join(SLIDES_DIR, name, "slides.html"));
  return (html.match(/<section\s+class="slide[\s"]/g) ?? []).length;
}

export async function listDecks(): Promise<DeckSummary[]> {
  const entries = await readdir(SLIDES_DIR, { withFileTypes: true });
  const decks = await Promise.all(
    entries
      .filter((e) => e.isDirectory() && isDeckName(e.name))
      .map(async (e) => {
        const meta = await readDeckMeta(e.name);
        return meta ? { name: e.name, ...meta, slideCount: await countSlides(e.name) } : null;
      })
  );
  return decks
    .filter((d): d is DeckSummary => d !== null)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function httpUrlOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function liveFrame(src: string | null, title: string): string {
  if (src === null) {
    return `<div class="empty">${escapeHtml(title)} 未設定 / 주소 미설정</div>`;
  }
  // 보호막(shield)이 덮여 있어 클릭·키보드는 슬라이드가 받는다. I 키로 iframe을 직접 조작하는 모드로 바꾼다.
  return `<div class="frame"><iframe src="${escapeHtml(src)}" title="${escapeHtml(title)}" loading="lazy" allow="fullscreen"></iframe><div class="shield"></div></div><p class="hint"><kbd>I</kbd><span class="off">画面を直接操作 / 조작 모드 켜기 (마우스로 차트 값 보기·클릭)</span><span class="on">● 操作中 · 余白クリックで戻る / 조작 중 · 슬라이드 여백을 클릭하면 돌아옵니다</span></p>`;
}

/** {{live:...}} 자리표시자를 iframe으로 바꾼다. 이 서버 페이지에는 덱의 언어(lang)를 넘겨 위젯 문구를 맞춘다. */
export function renderLive(html: string, jenniferUrl: string | null, lang?: string, theme?: string): string {
  return html.replace(/\{\{live:([^}]+)\}\}/g, (_m, key: string) => {
    const k = key.trim();
    if (k === "jennifer") return liveFrame(jenniferUrl, "JENNIFER dashboard (JENNIFER_DASHBOARD_URL / ?jennifer=)");
    if (/^\/(?!\/)[^\s"<>]*$/.test(k)) {
      // 덱의 언어·테마를 이 서버 페이지에 넘겨 위젯 문구와 색을 슬라이드에 맞춘다
      let src = k;
      if (lang && !/[?&]lang=/.test(src)) src += `${src.includes("?") ? "&" : "?"}lang=${encodeURIComponent(lang)}`;
      if (theme === "dark" && !/[?&]theme=/.test(src)) src += `${src.includes("?") ? "&" : "?"}theme=dark`;
      return liveFrame(src, k);
    }
    return liveFrame(null, k);
  });
}

/** 엔진 + 덱 파일을 합쳐 한 장의 HTML로 만든다. 덱이 없으면 null. */
export async function renderDeck(
  name: string,
  jenniferUrl: string | null,
  themeOverride?: string | null
): Promise<string | null> {
  const meta = await readDeckMeta(name);
  if (meta === null) return null;
  const dir = path.join(SLIDES_DIR, name);
  const engine = path.join(SLIDES_DIR, "_engine");
  const [engineCss, engineJs, chrome, slides, deckCss, deckJs] = await Promise.all([
    readOptional(path.join(engine, "engine.css")),
    readOptional(path.join(engine, "engine.js")),
    readOptional(path.join(engine, "chrome.html")),
    readOptional(path.join(dir, "slides.html")),
    readOptional(path.join(dir, "deck.css")),
    readOptional(path.join(dir, "deck.js")),
  ]);
  const theme = themeOverride === "light" || themeOverride === "dark" ? themeOverride : meta.theme ?? "dark";
  const fonts = meta.fonts
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" href="${escapeHtml(meta.fonts)}">`
    : "";

  return `<!doctype html>
<html lang="${escapeHtml(meta.lang ?? "ja")}" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(meta.title)}</title>
<link rel="icon" href="data:,">
${fonts}
<style>
${engineCss}
${deckCss}
</style>
</head>
<body>
<div id="viewport"><div id="stage">
${renderLive(slides, jenniferUrl, meta.lang, theme)}
</div></div>
${chrome}
<script>
${engineJs}
${deckJs}
// deep link: #s3 이면 3번째 장부터
{const m=/^#s(\\d+)$/.exec(location.hash);go(m?+m[1]-1:0);}
</script>
</body>
</html>`;
}

export type ScriptItem = { no: number; title: string; subtitle: string; script: string; notes: string };

function decodeEntities(v: string): string {
  return v
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function textOf(fragment: string): string {
  return decodeEntities(fragment.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

/** 덱의 장마다 제목(일본어)·보조 줄(한국어)·대본(data-script)·노트(data-notes)를 뽑는다. 인쇄용 대본 페이지에서 쓴다. */
export async function readDeckScript(name: string): Promise<{ meta: DeckMeta; items: ScriptItem[] } | null> {
  const meta = await readDeckMeta(name);
  if (meta === null) return null;
  const html = await readOptional(path.join(SLIDES_DIR, name, "slides.html"));
  const sections = html.match(/<section class="slide[^"]*"[\s\S]*?<\/section>/g) ?? [];
  const items = sections.map((sec, i) => {
    const open = sec.slice(0, sec.indexOf(">") + 1);
    const attr = (k: string) => decodeEntities(new RegExp(`${k}="([^"]*)"`).exec(open)?.[1] ?? "");
    const heading = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/.exec(sec)?.[1] ?? "";
    const sub = /<p class="kr[^"]*"[^>]*>([\s\S]*?)<\/p>/.exec(sec)?.[1] ?? "";
    return { no: i + 1, title: textOf(heading), subtitle: textOf(sub), script: attr("data-script"), notes: attr("data-notes") };
  });
  return { meta, items };
}
