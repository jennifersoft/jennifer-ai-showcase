"use client";

import { useEffect, useState } from "react";

const POINTS = 60;

// 데모용 시계열. 실제 데이터는 /api/jennifer 프록시로 교체한다.
function mockNext(prev: number) {
  return Math.max(0, prev + (Math.random() - 0.5) * 20);
}

export default function LineChart({ metric }: { metric: string }) {
  const [values, setValues] = useState<number[]>(() => Array.from({ length: POINTS }, () => 100));

  useEffect(() => {
    const timer = setInterval(() => {
      setValues((v) => [...v.slice(1), mockNext(v[v.length - 1])]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const max = Math.max(...values, 1);
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i / (POINTS - 1)) * 100},${100 - (v / max) * 90}`)
    .join(" ");

  return (
    <figure style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column" }}>
      <figcaption style={{ fontSize: 13, color: "#555" }}>
        {metric.toUpperCase()} · {values[values.length - 1].toFixed(0)}
      </figcaption>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ flex: 1, width: "100%" }}>
        <path d={d} fill="none" stroke="#ff6a2b" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  );
}
