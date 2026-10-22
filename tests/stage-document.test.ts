import assert from "node:assert/strict";
import { test } from "node:test";
import { renderStageDocument } from "../lib/stage-document";
import { GET } from "../app/slides/[deck]/script/route";

const data = {
  meta: { title: "Deck", lang: "ja" },
  items: [
    {
      no: 1,
      title: "First <b>",
      subtitle: "",
      presenter: "첫 문장입니다.\n\n두 번째 문장입니다.",
      script: "첫 문장입니다.\n\n두 번째 문장입니다.",
      notes: "[진행] 클릭하면 다음 단계로 갑니다.\n[화면 설명] 구현 배경입니다.\n[말이 막히면] “핵심만 말합니다.”",
      steps: 2,
    },
    { no: 2, title: "Second", subtitle: "", script: "끝입니다.", notes: "", autoplay: true, live: true },
  ],
};

test("the stage view shows one card per slide with only stage cues from the notes", async () => {
  const html = await renderStageDocument("test-deck", data, "presenter");
  assert.equal((html.match(/<article class="card"/g) || []).length, 2);
  assert.match(html, /<article class="card" id="s2"[^>]* hidden>/);
  assert.match(html, /클릭 2번/);
  assert.match(html, /자동 진행/);
  assert.match(html, /라이브 화면/);
  assert.match(html, /클릭하면 다음 단계로 갑니다\./);
  assert.match(html, /\[말이 막히면\]/);
  const cue = /<aside class="cue">([\s\S]*?)<\/aside>/.exec(html)?.[1] ?? "";
  assert.doesNotMatch(cue, /구현 배경입니다/);
  // 전체 노트는 접고 펼칠 수 있는 칸에 따로 담는다(통역은 펼침, 발표자는 접힘)
  assert.match(html, /<details class="notes"><summary>참고 노트<\/summary><p>[^<]*구현 배경입니다/);
  assert.match(html, /First &lt;b&gt;/);
  assert.equal((html.match(/class="pause"/g) || []).length, 3);
});

test("the script route serves the stage view for ?view=stage", async () => {
  const res = await GET(new Request("http://localhost/slides/japan-2026/script?view=stage&mode=interpreter"), {
    params: Promise.resolve({ deck: "japan-2026" }),
  });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<html lang="ko" data-mode="interpreter">/);
  assert.match(html, /발표 중 대본/);
});
