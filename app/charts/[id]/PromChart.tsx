"use client";

import { useEffect, useState } from "react";
import ChartWidget from "@/components/ChartWidget";
import type { Series } from "@/lib/prometheus";
import { t, type Lang } from "@/lib/i18n";

export default function PromChart({ id, label, unit, lang }: { id: string; label: string; unit: string; lang: Lang }) {
  const [series, setSeries] = useState<Series | null>(null);

  useEffect(() => {
    const load = () => fetch(`/api/prometheus/${id}`).then((r) => r.json()).then(setSeries).catch(() => {});
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [id]);

  return (
    <ChartWidget
      lang={lang}
      title={label}
      unit={unit}
      points={series?.points ?? []}
      max={unit === "%" ? 100 : undefined}
      badge={series?.source === "fallback" ? <span className="badge">{t(lang, "recordedData")}</span> : <span className="chip">Prometheus</span>}
    />
  );
}
