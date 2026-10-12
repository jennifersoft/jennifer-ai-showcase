"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Point = [number, number]; // [epoch seconds, value]

type Props = {
  points: Point[];
  unit?: string;
  color?: string;
  /** y축 최솟값을 0에 고정할지 (사용률·건수 같은 지표). 기본 true */
  zeroBased?: boolean;
  /** y축 최댓값 고정 (예: 사용률 100) */
  max?: number;
};

const PAD = { top: 8, right: 12, bottom: 22, left: 44 };

/** 1, 2, 2.5, 5 × 10^n 단위로 보기 좋은 눈금을 만든다. */
function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (max === min) max = min + 1;
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Number(v.toFixed(10)));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

function formatValue(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (a >= 1e4) return `${(v / 1e3).toFixed(0)}k`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  if (a >= 100 || Number.isInteger(v)) return v.toFixed(0);
  if (a >= 1) return v.toFixed(1);
  return v.toFixed(2);
}

function formatTime(sec: number, withSeconds = false): string {
  const d = new Date(sec * 1000);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return withSeconds ? `${hh}:${mm}:${String(d.getSeconds()).padStart(2, "0")}` : `${hh}:${mm}`;
}

/** x축 시간 눈금: 화면 폭에 맞춰 1·5·10·15·30분 등 깔끔한 간격을 고른다. */
function timeTicks(from: number, to: number, maxTicks: number): number[] {
  const span = Math.max(to - from, 1);
  const steps = [10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 86400];
  const step = steps.find((s) => span / s <= maxTicks) ?? 86400;
  const ticks: number[] = [];
  for (let t = Math.ceil(from / step) * step; t <= to; t += step) ticks.push(t);
  return ticks;
}

/** 축·격자·마지막 값·마우스 위치 값이 있는 시계열 선 차트. 크기는 부모를 꽉 채운다. */
export default function TimeSeriesChart({ points, unit = "", color = "var(--series-1)", zeroBased = true, max }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const model = useMemo(() => {
    if (points.length < 2 || size.w === 0) return null;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const x0 = xs[0];
    const x1 = xs[xs.length - 1];
    const dataMin = Math.min(...ys);
    const dataMax = Math.max(...ys);
    const yTicks = niceTicks(zeroBased ? Math.min(0, dataMin) : dataMin, max ?? dataMax);
    const y0 = yTicks[0];
    const y1 = max ?? yTicks[yTicks.length - 1];
    const iw = size.w - PAD.left - PAD.right;
    const ih = size.h - PAD.top - PAD.bottom;
    const sx = (t: number) => PAD.left + ((t - x0) / Math.max(x1 - x0, 1)) * iw;
    const sy = (v: number) => PAD.top + ih - ((v - y0) / Math.max(y1 - y0, 1e-9)) * ih;
    const line = points.map(([t, v], i) => `${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(v).toFixed(1)}`).join("");
    const area = `${line}L${sx(x1).toFixed(1)},${sy(y0).toFixed(1)}L${sx(x0).toFixed(1)},${sy(y0).toFixed(1)}Z`;
    const xTicks = timeTicks(x0, x1, Math.max(2, Math.floor(iw / 80)));
    return { sx, sy, line, area, yTicks: yTicks.filter((v) => v <= y1), xTicks, iw, ih, x0, x1, showSeconds: x1 - x0 < 600 };
  }, [points, size, zeroBased, max]);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!model) return;
    const x = e.nativeEvent.offsetX;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(model.sx(points[i][0]) - x) < Math.abs(model.sx(points[best][0]) - x)) best = i;
    }
    setHover(best);
  };

  const hp = hover !== null ? points[hover] : null;
  const gradientId = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <div ref={box} style={{ position: "absolute", inset: 0 }}>
      {model && (
        <svg width={size.w} height={size.h} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {model.yTicks.map((v) => (
            <g key={`y${v}`}>
              <line x1={PAD.left} x2={size.w - PAD.right} y1={model.sy(v)} y2={model.sy(v)} stroke="var(--grid)" />
              <text x={PAD.left - 6} y={model.sy(v)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--text-3)">
                {formatValue(v)}
              </text>
            </g>
          ))}
          {model.xTicks.map((t) => (
            <text key={`x${t}`} x={model.sx(t)} y={size.h - 6} textAnchor="middle" fontSize={10} fill="var(--text-3)">
              {formatTime(t, model.showSeconds)}
            </text>
          ))}
          <line x1={PAD.left} x2={size.w - PAD.right} y1={PAD.top + model.ih} y2={PAD.top + model.ih} stroke="var(--border)" />
          <path d={model.area} fill={`url(#${gradientId})`} />
          <path d={model.line} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
          {hp && (
            <g>
              <line x1={model.sx(hp[0])} x2={model.sx(hp[0])} y1={PAD.top} y2={PAD.top + model.ih} stroke="var(--text-3)" strokeDasharray="3 3" />
              <circle cx={model.sx(hp[0])} cy={model.sy(hp[1])} r={3.5} fill="var(--surface)" stroke={color} strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {hp && model && (
        <div
          style={{
            position: "absolute",
            top: 4,
            left: Math.min(Math.max(model.sx(hp[0]) - 50, PAD.left), size.w - 110),
            width: 100,
            padding: "4px 8px",
            fontSize: 11,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            boxShadow: "var(--shadow)",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <div style={{ color: "var(--text-3)" }}>{formatTime(hp[0], true)}</div>
          <strong>
            {formatValue(hp[1])}
            {unit && <span style={{ fontWeight: 500, color: "var(--text-3)" }}> {unit}</span>}
          </strong>
        </div>
      )}
    </div>
  );
}

export { formatValue };
