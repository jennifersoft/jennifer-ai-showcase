"use client";

import { useEffect, useState } from "react";
import ChartWidget from "@/components/ChartWidget";
import type { Point } from "@/components/TimeSeriesChart";
import { t, type Lang, type MessageKey } from "@/lib/i18n";

const POINTS = 120;

// 데모용 지표. 실제 데이터는 /api/jennifer 프록시로 바꾼다.
const DEMO: Record<string, { title: MessageKey; unit: string | MessageKey; base: number; jitter: number; color?: string }> = {
  tps: { title: "chart.tps", unit: "tps", base: 320, jitter: 40 },
  response: { title: "chart.response", unit: "ms", base: 180, jitter: 35, color: "var(--series-2)" },
  error: { title: "chart.error", unit: "unit.count", base: 3, jitter: 2, color: "var(--danger)" },
  active: { title: "chart.active", unit: "unit.services", base: 24, jitter: 6 },
};

function next(prev: number, base: number, jitter: number) {
  const pull = (base - prev) * 0.1;
  return Math.max(0, prev + pull + (Math.random() - 0.5) * jitter);
}

export default function LineChart({ metric, lang }: { metric: string; lang: Lang }) {
  const conf = DEMO[metric];
  const base = conf?.base ?? 100;
  const jitter = conf?.jitter ?? 20;
  const title = conf ? t(lang, conf.title) : metric.toUpperCase();
  const unit = conf ? (conf.unit.startsWith("unit.") ? t(lang, conf.unit as MessageKey) : conf.unit) : "";
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    let v = base;
    const init: Point[] = [];
    for (let i = POINTS - 1; i >= 0; i--) {
      v = next(v, base, jitter);
      init.push([now - i * 5, v]);
    }
    setPoints(init);
    const timer = setInterval(() => {
      setPoints((p) => {
        const [t, last] = p[p.length - 1];
        return [...p.slice(1), [t + 5, next(last, base, jitter)]];
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [base, jitter]);

  return <ChartWidget lang={lang} title={title} unit={unit} points={points} color={conf?.color} badge={<span className="chip">{t(lang, "demoData")}</span>} />;
}
