import assert from "node:assert/strict";
import { test } from "node:test";
import { renderScriptDocument } from "../lib/script-document";
import { GET } from "../app/slides/[deck]/script/route";

const data = {
  meta: { title: 'Deck <test> & "demo"', lang: "ja" },
  items: [{
    no: 1,
    title: 'Title <img src=x onerror="alert(1)">',
    subtitle: "보조 설명",
    presenter: "첫 문장입니다.\n\n두 번째 문장입니다.",
    script: "상세한 통역용 원고입니다.",
    notes: "</script><script>alert(1)</script>",
  }],
};

test("the reader keeps both manuscripts and escapes text instead of executing markup", async () => {
  const html = await renderScriptDocument("test-deck", data);
  assert.match(html, /data-mode="presenter"/);
  assert.match(html, /첫 문장입니다\./);
  assert.match(html, /두 번째 문장입니다\./);
  assert.match(html, /상세한 통역용 원고입니다\./);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  // 참고 노트는 대본 화면에 싣지 않는다
  assert.doesNotMatch(html, /alert\(1\)<\/script>|&lt;\/script&gt;&lt;script&gt;/);
  assert.doesNotMatch(html, /<img src=x|<script>alert\(1\)/);
  assert.equal((html.match(/class="pause-cue"/g) || []).length, 2);
});

test("saved documents contain both scripts and controls without network resources", async () => {
  const html = await renderScriptDocument("test-deck", data, { download: true, mode: "interpreter", withNotes: true });
  assert.match(html, /<html[^>]*data-mode="interpreter"[^>]*data-notes="true"[^>]*data-saved="true"/);
  assert.match(html, /첫 문장입니다\./);
  assert.match(html, /상세한 통역용 원고입니다\./);
  assert.match(html, /<style>[\s\S]+<\/style>/);
  assert.match(html, /<script>[\s\S]+<\/script>/);
  assert.doesNotMatch(html, /<(?:script|img|iframe|video|audio|source)[^>]+\bsrc\s*=/i);
  assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"|@import\s|url\(https?:/i);
  assert.doesNotMatch(html, /<a[^>]+href="\/slides|<a[^>]+data-download/);
});

test("legacy and empty scripts still produce readable fallback content", async () => {
  const html = await renderScriptDocument("legacy", {
    meta: { title: "Legacy" },
    items: [
      { no: 1, title: "One", subtitle: "", script: "기존 원고", notes: "" },
      { no: 2, title: "Two", subtitle: "", script: "", notes: "" },
    ],
  });
  assert.equal((html.match(/기존 원고/g) || []).length, 2);
  assert.equal((html.match(/\(대본 없음\)/g) || []).length, 2);
  assert.match(html, /id="s1"/);
  assert.match(html, /id="s2"/);
});

test("download route returns an HTML attachment with the selected manuscript and notes", async () => {
  const response = await GET(
    new Request("https://showcase.test/slides/japan-2026/script?download=1&mode=interpreter&notes=1"),
    { params: Promise.resolve({ deck: "japan-2026" }) },
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("Content-Disposition"), 'attachment; filename="japan-2026-script.html"');
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  const html = await response.text();
  assert.match(html, /data-mode="interpreter" data-notes="true" data-saved="true"/);
});

test("the reader route preserves template access and returns 404 for invalid or missing decks", async () => {
  for (const [deck, status] of [["_template", 200], ["../package.json", 404], ["missing-script-test-deck", 404]] as const) {
    const response = await GET(new Request("https://showcase.test/slides/test/script"), { params: Promise.resolve({ deck }) });
    assert.equal(response.status, status);
  }
});
