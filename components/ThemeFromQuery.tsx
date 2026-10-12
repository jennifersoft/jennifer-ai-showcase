"use client";

import { useEffect } from "react";

// ?theme=dark | light 를 html[data-theme] 에 반영한다.
// 제니퍼 대시보드 iframe 위젯에서 제니퍼 테마(classic/dark)에 맞추려고 쓴다. classic 은 light 로 본다.
export default function ThemeFromQuery() {
  useEffect(() => {
    const theme = new URLSearchParams(window.location.search).get("theme");
    if (theme === "dark") document.documentElement.dataset.theme = "dark";
    else if (theme === "light" || theme === "classic") document.documentElement.dataset.theme = "light";
  }, []);
  return null;
}
