"use client";

import { useEffect, useState } from "react";
import type { DeployEvent } from "../../lib/deploys";

const REFRESH_MS = 30000;

type Payload = { from: number; to: number; events: DeployEvent[] };

function formatTime(ms: number) {
  const d = new Date(ms);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(
    d.getHours()
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

  if (!data) return null;
  const span = Math.max(data.to - data.from, 1);

  return (
    <figure style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column", fontSize: 12 }}>
      <figcaption style={{ fontSize: 13, color: "#555" }}>
        배포·변경 · 최근 {hours}시간 · {data.events.length}건
      </figcaption>
      <div style={{ position: "relative", flex: 1, minHeight: 40, borderBottom: "1px solid #ccc" }}>
        {data.events.map((e) => {
          const left = ((Date.parse(e.time) - data.from) / span) * 100;
          const label = `${formatTime(Date.parse(e.time))} ${e.service ? `[${e.service}] ` : ""}${e.title}`;
          return (
            <a
              key={e.id}
              href={e.url}
              target="_blank"
              rel="noreferrer"
              title={label}
              style={{ position: "absolute", left: `${left}%`, top: 0, bottom: 0, width: 2, background: "#ff6a2b" }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#888" }}>
        <span>{formatTime(data.from)}</span>
        <span>{formatTime(data.to)}</span>
      </div>
      <ol style={{ margin: "4px 0 0", padding: 0, listStyle: "none", overflow: "auto", maxHeight: "40%" }}>
        {[...data.events].reverse().map((e) => (
          <li key={e.id}>
            {formatTime(Date.parse(e.time))} {e.service ? `[${e.service}] ` : ""}
            {e.url ? (
              <a href={e.url} target="_blank" rel="noreferrer">
                {e.title}
              </a>
            ) : (
              e.title
            )}
          </li>
        ))}
      </ol>
    </figure>
  );
}
