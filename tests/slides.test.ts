import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { test } from "node:test";
import { readDeckScript, SLIDES_DIR } from "../lib/slides";

test("presenter chunks are separate from the interpreter manuscript and keep pauses", async () => {
  const dir = path.join(SLIDES_DIR, `script-test-${randomUUID()}`);
  await mkdir(dir);
  try {
    await writeFile(path.join(dir, "meta.json"), JSON.stringify({ title: "Test" }));
    await writeFile(path.join(dir, "slides.html"), `<section class="slide" data-script="통역용 &quot;원고&quot;입니다." data-presenter="짧게 말합니다.\n다음 문장입니다.\n\nR&amp;D를 소개합니다." data-notes="화면 확인"><h2>제목</h2></section>`);
    const result = await readDeckScript(path.basename(dir));
    assert.ok(result);
    assert.equal(result.items[0].presenter, "짧게 말합니다.\n다음 문장입니다.\n\nR&D를 소개합니다.");
    assert.equal(result.items[0].script, '통역용 "원고"입니다.');
    assert.equal(result.items[0].notes, "화면 확인");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("decks without a presenter script retain their existing manuscript", async () => {
  const dir = path.join(SLIDES_DIR, `script-test-${randomUUID()}`);
  await mkdir(dir);
  try {
    await writeFile(path.join(dir, "meta.json"), JSON.stringify({ title: "Legacy" }));
    await writeFile(path.join(dir, "slides.html"), '<section class="slide" data-script="기존 대본"><h2>제목</h2></section>');
    const result = await readDeckScript(path.basename(dir));
    assert.ok(result);
    assert.equal(result.items[0].script, "기존 대본");
    assert.equal(result.items[0].presenter, "");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("invalid and missing decks do not read outside the deck directory", async () => {
  assert.equal(await readDeckScript("../package.json"), null);
  assert.equal(await readDeckScript("missing-script-test-deck"), null);
});
