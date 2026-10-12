"use client";

import { useEffect, useState } from "react";
import ChartWidget from "@/components/ChartWidget";
import type { Point } from "@/components/TimeSeriesChart";

const POINTS = 120;

// 데모용 지표. 실제 데이터는 /api/jennifer 프록시로 바꾼다.
const DEMO: Record<string, { title: string; unit: string; base: number; jitter: number; color?: string }> = {
  tps: { title: "TPS", unit: "tps", base: 320, jitter: 40 },
  response: { title: "평균 응답시간", unit: "ms", base: 180, jitter: 35, color: "var(--series-2)" },
  error: { title: "에러 수", unit: "건", base: 3, jitter: 2, color: "var(--danger)" },
  active: { title: "액티브 서비스", unit: "개", base: 24, jitter: 6 },
};

function next(prev: number, base: number, jitter: number) {
  const pull = (base - prev) * 0.1;
  return Math.max(0, prev + pull + (Math.random() - 0.5) * jitter);
}

export default function LineChart({ metric }: { metric: string }) {
  const conf = DEMO[metric] ?? { title: metric.toUpperCase(), unit: "", base: 100, jitter: 20 };
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    let v = conf.base;
    const init: Point[] = [];
    for (let i = POINTS - 1; i >= 0; i--) {
      v = next(v, conf.base, conf.jitter);
      init.push([now - i * 5, v]);
    }
    setPoints(init);
    const timer = setInterval(() => {
      setPoints((p) => {
        const [t, last] = p[p.length - 1];
        return [...p.slice(1), [t + 5, next(last, conf.base, conf.jitter)]];
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [conf.base, conf.jitter]);

  return <ChartWidget title={conf.title} unit={conf.unit} points={points} color={conf.color} badge={<span className="chip">데모 데이터</span>} />;
}
