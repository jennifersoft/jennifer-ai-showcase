(function () {
  "use strict";

  const root = document.documentElement;
  const toolbar = document.getElementById("reader-toolbar");
  const scriptContent = document.getElementById("script-content");
  const articles = Array.from(document.querySelectorAll(".script-slide"));
  const modeButtons = Array.from(document.querySelectorAll("[data-mode-button]"));
  const notesToggle = document.getElementById("notes-toggle");
  const chapterSelect = document.getElementById("chapter-select");
  const textSize = document.getElementById("text-size");
  const downloadLink = document.querySelector("[data-download]");
  const saved = root.dataset.saved === "true" || location.protocol === "file:";

  root.dataset.saved = String(saved);
  root.classList.add("js");

  function currentChapter() {
    return /^#s[1-9]\d*$/.test(location.hash) ? location.hash : "";
  }

  function updateDownload() {
    if (!downloadLink || saved) return;
    const url = new URL(downloadLink.dataset.downloadPath, location.href);
    url.searchParams.set("download", "1");
    url.searchParams.set("mode", root.dataset.mode);
    if (root.dataset.notes === "true") url.searchParams.set("notes", "1");
    url.hash = currentChapter();
    downloadLink.href = url.toString();
  }

  function updateAddress() {
    updateDownload();
    if (saved) return;
    const url = new URL(location.href);
    url.searchParams.set("mode", root.dataset.mode);
    if (root.dataset.notes === "true") url.searchParams.set("notes", "1");
    else url.searchParams.delete("notes");
    // Some file viewers and embedded browsers restrict history changes.
    try { history.replaceState(null, "", url); } catch { /* Reading remains available. */ }
  }

  function keepVisibleChapter(update) {
    // A few pixels beyond the anchor offset avoid choosing the previous
    // article when a browser rounds the scroll position to a whole pixel.
    const edge = parseFloat(root.style.getPropertyValue("--toolbar-height")) + 24;
    const article = scriptContent.getBoundingClientRect().top <= edge
      ? articles.find(function (item) { return item.getBoundingClientRect().bottom > edge; })
      : null;
    update();
    if (article) {
      article.scrollIntoView({ block: "start" });
      chapterSelect.value = article.id;
    }
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (root.dataset.mode === button.dataset.modeButton) return;
      keepVisibleChapter(function () {
        root.dataset.mode = button.dataset.modeButton;
        modeButtons.forEach(function (item) {
          item.setAttribute("aria-pressed", String(item === button));
        });
      });
      updateAddress();
    });
  });

  notesToggle.addEventListener("change", function () {
    keepVisibleChapter(function () { root.dataset.notes = String(notesToggle.checked); });
    updateAddress();
  });

  textSize.addEventListener("change", function () {
    if (["18", "20", "22", "26"].includes(textSize.value)) {
      keepVisibleChapter(function () { root.style.setProperty("--script-size", textSize.value + "px"); });
    }
  });

  function syncChapter() {
    const id = currentChapter().slice(1);
    if (id && document.getElementById(id)) chapterSelect.value = id;
    updateDownload();
  }

  chapterSelect.addEventListener("change", function () {
    const article = document.getElementById(chapterSelect.value);
    if (!article) return;
    if (location.hash === "#" + article.id) article.scrollIntoView({ block: "start" });
    else location.hash = article.id;
    article.focus({ preventScroll: true });
  });
  window.addEventListener("hashchange", syncChapter);

  function measureToolbar() {
    const height = getComputedStyle(toolbar).position === "sticky" ? toolbar.getBoundingClientRect().height : 0;
    root.style.setProperty("--toolbar-height", Math.ceil(height) + "px");
  }
  measureToolbar();
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(measureToolbar).observe(toolbar);
  window.addEventListener("resize", measureToolbar);

  document.getElementById("print-script").addEventListener("click", function () { window.print(); });

  // Native #sN links and ?slide=N links share the same chapter destinations.
  const queryChapter = new URLSearchParams(location.search).get("slide");
  if (!location.hash && /^[1-9]\d*$/.test(queryChapter || "") && document.getElementById("s" + queryChapter)) {
    location.hash = "s" + queryChapter;
  }
  syncChapter();
  if (currentChapter()) {
    requestAnimationFrame(function () {
      const article = document.getElementById(currentChapter().slice(1));
      if (article) article.scrollIntoView({ block: "start" });
    });
  }
})();
