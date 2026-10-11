"use client";

import { useEffect, useState } from "react";
import type { InfraPoint } from "../../lib/infraMetrics";

const REFRESH_MS = 15000;

export default function InfraChart({ metric, label, unit }: { metric: string; label: string; unit: string }) {
  const [points, setPoints] = useState<InfraPoint[]>([]);
  const [source, setSource] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch(`/api/prometheus/${metric}`, { cache: "no-store" });
      const body = await res.json();
      if (alive) {
        setPoints(body.points ?? []);
        setSource(body.source ?? "");
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [metric]);

  const values = points.map(([, v]) => v);
  const max = Math.max(...values, 1);
  const n = Math.max(values.length - 1, 1);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${(i / n) * 100},${100 - (v / max) * 90}`).join(" ");
  const last = values.length ? values[values.length - 1] : null;

  return (
    <figure style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column" }}>
      <figcaption style={{ fontSize: 13, color: "#555" }}>
        {label} · {last === null ? "-" : `${last.toFixed(1)}${unit}`}
        {source === "fallback" ? " (녹화 데이터)" : ""}
      </figcaption>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ flex: 1, width: "100%" }}>
        <path d={d} fill="none" stroke="#2b7bff" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  );
}
