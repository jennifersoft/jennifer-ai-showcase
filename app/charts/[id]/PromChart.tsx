"use client";

import { useEffect, useState } from "react";
import ChartWidget from "@/components/ChartWidget";
import type { Series } from "@/lib/prometheus";

export default function PromChart({ id, label, unit }: { id: string; label: string; unit: string }) {
  const [series, setSeries] = useState<Series | null>(null);

  useEffect(() => {
    const load = () => fetch(`/api/prometheus/${id}`).then((r) => r.json()).then(setSeries).catch(() => {});
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [id]);

  return (
    <ChartWidget
      title={label}
      unit={unit}
      points={series?.points ?? []}
      max={unit === "%" ? 100 : undefined}
      badge={series?.source === "fallback" ? <span className="badge">녹화 데이터</span> : <span className="chip">Prometheus</span>}
    />
  );
}
