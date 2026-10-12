"use client";

import { useEffect, useState } from "react";
import type { DeployEvent } from "../../lib/deploys";

const REFRESH_MS = 30000;

type Payload = { from: number; to: number; events: DeployEvent[] };

const pad = (n: number) => String(n).padStart(2, "0");
function formatTime(ms: number, withDate: boolean) {
  const d = new Date(ms);
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return withDate ? `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${hm}` : hm;
}

/** 시간축 눈금: 범위에 맞춰 1·3·6·12시간, 1·7일 간격 */
function ticks(from: number, to: number): number[] {
  const h = 3600_000;
  const span = to - from;
  const step = [h, 3 * h, 6 * h, 12 * h, 24 * h, 7 * 24 * h].find((s) => span / s <= 8) ?? 7 * 24 * h;
  const offset = new Date().getTimezoneOffset() * 60_000;
  const out: number[] = [];
  for (let t = Math.ceil((from - offset) / step) * step + offset; t <= to; t += step) out.push(t);
  return out;
}

export default function DeployTimeline({ hours }: { hours: number }) {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch(`/api/deploys?hours=${hours}`, { cache: "no-store" });
      const body = (await res.json()) as Payload;
      if (alive) setData(body);
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [hours]);

  const withDate = hours > 24;
  const span = data ? Math.max(data.to - data.from, 1) : 1;
  const pos = (ms: number) => (data ? ((ms - data.from) / span) * 100 : 0);

  return (
    <div className="widget">
      <div className="widget-head">
        <div>
          <div className="widget-title">배포 · 변경</div>
          <div className="widget-value">
            {data ? data.events.length : "–"}
            <span className="widget-unit">건 · 최근 {hours}시간</span>
          </div>
        </div>
      </div>

      {/* 시간축: 눈금선 + 배포 마커 */}
      <div style={{ position: "relative", height: 64, flex: "none", margin: "4px 4px 0" }}>
        {data &&
          ticks(data.from, data.to).map((t) => (
            <div key={t} style={{ position: "absolute", left: `${pos(t)}%`, top: 0, bottom: 18, borderLeft: "1px solid var(--grid)" }}>
              <span style={{ position: "absolute", top: 50, transform: "translateX(-50%)", fontSize: 10, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                {formatTime(t, withDate)}
              </span>
            </div>
          ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 22, height: 2, background: "var(--border)", borderRadius: 1 }} />
        {data?.events.map((e) => {
          const t = Date.parse(e.time);
          return (
            <a
              key={e.id}
              href={e.url}
              target="_blank"
              rel="noreferrer"
              title={`${formatTime(t, true)} ${e.service ? `[${e.service}] ` : ""}${e.title}`}
              style={{
                position: "absolute",
                left: `${pos(t)}%`,
                top: 15,
                width: 16,
                height: 16,
                marginLeft: -8,
                borderRadius: "50%",
                background: "var(--accent)",
                border: "3px solid var(--surface)",
                boxShadow: "0 0 0 1px var(--accent)",
              }}
            />
          );
        })}
      </div>

      {/* 최신순 목록 */}
      <ol style={{ margin: "8px 0 0", padding: 0, listStyle: "none", overflow: "auto", flex: 1, fontSize: 12 }}>
        {data && data.events.length === 0 && <li className="empty">이 기간에 배포가 없습니다.</li>}
        {[...(data?.events ?? [])].reverse().map((e) => (
          <li key={e.id} style={{ display: "flex", gap: 10, padding: "6px 2px", borderTop: "1px solid var(--grid)" }}>
            <span style={{ color: "var(--text-3)", fontFamily: "var(--mono)", flex: "none" }}>{formatTime(Date.parse(e.time), true)}</span>
            {e.service && <span className="chip" style={{ flex: "none" }}>{e.service}</span>}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {e.url ? (
                <a href={e.url} target="_blank" rel="noreferrer">
                  {e.title}
                </a>
              ) : (
                e.title
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
