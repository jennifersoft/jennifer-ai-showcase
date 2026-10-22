(function () {
  "use strict";

  const root = document.documentElement;
  const cards = Array.from(document.querySelectorAll(".card"));
  const main = document.getElementById("cards");
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  const pos = document.getElementById("pos");
  const list = document.getElementById("list");
  const jumps = Array.from(document.querySelectorAll("[data-go]"));
  let index = 0;

  // 글자 크기·대본 종류는 기기마다 기억한다. 저장소를 못 쓰는 브라우저에서도 화면은 그대로 동작한다.
  function load(key) { try { return localStorage.getItem("stage:" + key); } catch { return null; } }
  function save(key, value) { try { localStorage.setItem("stage:" + key, value); } catch { /* 기억만 못 한다 */ } }

  function show(i) {
    if (!cards.length) return;
    index = Math.max(0, Math.min(cards.length - 1, i));
    cards.forEach(function (card, k) { card.hidden = k !== index; });
    main.scrollTop = 0;
    pos.textContent = index + 1 + " / " + cards.length;
    prev.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    jumps.forEach(function (b) { b.setAttribute("aria-current", String(+b.dataset.go === index)); });
    try { history.replaceState(null, "", "#s" + (index + 1)); } catch { /* 주소만 안 바뀐다 */ }
  }

  function setMode(mode) {
    root.dataset.mode = mode;
    document.querySelectorAll("[data-mode-button]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.modeButton === mode));
    });
    save("mode", mode);
    try {
      const url = new URL(location.href);
      url.searchParams.set("mode", mode);
      history.replaceState(null, "", url);
    } catch { /* 주소만 안 바뀐다 */ }
  }

  let scale = parseFloat(load("scale") || "1") || 1;
  function setScale(value) {
    scale = Math.max(0.7, Math.min(1.8, Math.round(value * 10) / 10));
    root.style.setProperty("--scale", String(scale));
    save("scale", String(scale));
  }

  prev.addEventListener("click", function () { show(index - 1); });
  next.addEventListener("click", function () { show(index + 1); });
  document.querySelectorAll("[data-mode-button]").forEach(function (b) {
    b.addEventListener("click", function () { setMode(b.dataset.modeButton); });
  });
  document.querySelectorAll("[data-size]").forEach(function (b) {
    b.addEventListener("click", function () { setScale(scale + 0.1 * +b.dataset.size); });
  });
  document.getElementById("open-list").addEventListener("click", function () {
    if (typeof list.showModal === "function") list.showModal();
  });
  jumps.forEach(function (b) {
    b.addEventListener("click", function () { show(+b.dataset.go); list.close(); });
  });

  // 좌우로 밀어서 넘긴다. 세로 스크롤과 헷갈리지 않게 가로 이동이 충분할 때만 넘긴다.
  let sx = 0, sy = 0;
  main.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  main.addEventListener("touchend", function (e) {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener("keydown", function (e) {
    if (list.open) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(index + 1); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); show(index - 1); }
  });

  // 발표 중에 화면이 꺼지지 않게 한다. 지원하지 않는 브라우저는 기기 설정을 따른다.
  let lock = null;
  async function keepAwake() {
    if (lock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    try {
      lock = await navigator.wakeLock.request("screen");
      lock.addEventListener("release", function () { lock = null; });
    } catch { lock = null; }
  }
  document.addEventListener("visibilitychange", keepAwake);
  document.addEventListener("click", keepAwake);
  keepAwake();

  const params = new URLSearchParams(location.search);
  setMode(params.get("mode") || load("mode") || root.dataset.mode);
  setScale(scale);
  const m = /^#s(\d+)$/.exec(location.hash);
  show(m ? +m[1] - 1 : 0);
})();
