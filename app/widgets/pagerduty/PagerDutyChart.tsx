"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import type { PdSummary } from "@/lib/pagerduty-sample";

type Data = PdSummary & { source: "live" | "sample" };
const PAD = { top: 8, right: 8, bottom: 20, left: 28 };

export default function PagerDutyChart({ lang }: { lang: Lang }) {
  const [data, setData] = useState<Data | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const load = () => fetch("/api/pagerduty", { cache: "no-store" }).then((r) => r.json()).then(setData).catch(() => {});
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fmtMin = (v: number | null) => (v === null ? "–" : `${Math.round(v)}${t(lang, "pd.min")}`);
  const max = Math.max(4, ...(data?.hours.map((h) => h.high + h.low) ?? [0]));
  const step = max <= 6 ? 2 : max <= 12 ? 4 : 5;
  const ticks = Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
  const top = ticks[ticks.length - 1] || 1;
  const iw = Math.max(0, size.w - PAD.left - PAD.right);
  const ih = Math.max(0, size.h - PAD.top - PAD.bottom);
  const bw = data ? iw / data.hours.length : 0;
  const y = (v: number) => PAD.top + ih - (v / top) * ih;
  const hh = (sec: number) => String(new Date(sec * 1000).getHours()).padStart(2, "0") + ":00";

  return (
    <div className="widget">
      <div className="widget-head">
        <div className="widget-title">{t(lang, "pd.title")}</div>
        {data?.source === "sample" ? <span className="badge">{t(lang, "pd.sample")}</span> : <span className="chip">PagerDuty</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 8 }}>
        {[
          [t(lang, "pd.open"), data ? String(data.open) : "–", "var(--text)"],
          [t(lang, "pd.triggered"), data ? String(data.triggered) : "–", "var(--danger)"],
          [t(lang, "pd.mtta"), data ? fmtMin(data.mttaMin) : "–", "var(--text)"],
          [t(lang, "pd.mttr"), data ? fmtMin(data.mttrMin) : "–", "var(--text)"],
        ].map(([k, v, c]) => (
          <div key={k} style={{ background: "var(--surface-2)", borderRadius: 8, padding: "6px 10px" }}>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{k}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-2)", marginBottom: 2 }}>
        <span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--danger)", marginRight: 4 }} />{t(lang, "pd.high")}</span>
        <span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--warn)", marginRight: 4 }} />{t(lang, "pd.low")}</span>
        {data && <span style={{ marginLeft: "auto", color: "var(--text-3)" }}>{t(lang, "pd.total", { n: data.total })}</span>}
      </div>
      <div ref={box} className="widget-body">
        {data && size.w > 0 && (
          <svg width={size.w} height={size.h} style={{ position: "absolute", inset: 0 }}>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={size.w - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--grid)" />
                <text x={PAD.left - 6} y={y(v)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--text-3)">{v}</text>
              </g>
            ))}
            {data.hours.map((h, i) => {
              const x = PAD.left + i * bw + bw * 0.15;
              const w = bw * 0.7;
              return (
                <g key={h.t}>
                  <rect x={x} y={y(h.low)} width={w} height={y(0) - y(h.low)} rx={2} fill="var(--warn)" opacity={0.85} />
                  <rect x={x} y={y(h.low + h.high)} width={w} height={y(h.low) - y(h.low + h.high)} rx={2} fill="var(--danger)" />
                  {i % 6 === 0 && <text x={x + w / 2} y={size.h - 5} textAnchor="middle" fontSize={10} fill="var(--text-3)">{hh(h.t)}</text>}
                </g>
              );
            })}
          </svg>
        )}
      </div>
      {data && data.recent.length > 0 && (
        <div style={{ marginTop: 6, borderTop: "1px solid var(--grid)", paddingTop: 4 }}>
          {data.recent.map((r) => (
            <div key={r.no} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, lineHeight: "18px", minWidth: 0 }}>
              <i style={{ flex: "none", width: 7, height: 7, borderRadius: 4, background: r.urgency === "high" ? "var(--danger)" : "var(--warn)" }} />
              <span style={{ flex: "none", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{new Date(r.at).toTimeString().slice(0, 5)}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-2)" }}>
                #{r.no} {r.title}
              </span>
              {r.alerts > 1 && <span style={{ flex: "none", color: "var(--text-3)" }}>×{r.alerts}</span>}
              <span style={{ flex: "none", color: r.status === "triggered" ? "var(--danger)" : "var(--text-3)" }}>{t(lang, `pd.st.${r.status}`)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
