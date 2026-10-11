"use client";

import { useEffect, useState } from "react";
import type { Series } from "@/lib/prometheus";

export default function PromChart({ id, label, unit }: { id: string; label: string; unit: string }) {
  const [series, setSeries] = useState<Series | null>(null);

  useEffect(() => {
    const load = () => fetch(`/api/prometheus/${id}`).then((r) => r.json()).then(setSeries).catch(() => {});
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [id]);

  const values = series?.points.map(([, v]) => v) ?? [];
  const max = Math.max(...values, 1);
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i / Math.max(values.length - 1, 1)) * 100},${100 - (v / max) * 90}`)
    .join(" ");
  const last = values[values.length - 1];

  return (
    <figure style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column" }}>
      <figcaption style={{ fontSize: 13, color: "#555", display: "flex", justifyContent: "space-between" }}>
        <span>{label} · {last === undefined ? "-" : `${last.toFixed(1)}${unit}`}</span>
        {series?.source === "fallback" && <span style={{ color: "#c60" }}>녹화 데이터</span>}
      </figcaption>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ flex: 1, width: "100%" }}>
        <path d={d} fill="none" stroke="#2b7bff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  );
}
