"use client";

import { useEffect, useState } from "react";
import type { IncidentList as Data } from "@/lib/pagerduty";

const STATUS = {
  triggered: { label: "Triggered", color: "#d93025" },
  acknowledged: { label: "Acknowledged", color: "#e8a200" },
  resolved: { label: "Resolved", color: "#188038" },
} as const;

function elapsed(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  return min < 60 ? `${min}분 전` : `${Math.floor(min / 60)}시간 전`;
}

export default function IncidentList() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const load = () => fetch("/api/incidents").then((r) => r.json()).then(setData).catch(() => {});
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const incidents = data?.incidents ?? [];

  return (
    <section style={{ fontSize: 13 }}>
      <header style={{ display: "flex", justifyContent: "space-between", color: "#555", marginBottom: 6 }}>
        <strong>PagerDuty · 열린 인시던트 {incidents.length}건</strong>
        {data?.source === "sample" && <span style={{ color: "#c60" }}>샘플 데이터</span>}
      </header>
      {incidents.length === 0 ? (
        <p style={{ color: "#188038" }}>{data ? "열린 인시던트가 없습니다." : "불러오는 중"}</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {incidents.map((i) => (
            <li key={i.id} style={{ borderLeft: `4px solid ${STATUS[i.status].color}`, padding: "6px 8px", marginBottom: 6, background: "#fafafa" }}>
              <div style={{ fontWeight: 600 }}>
                {i.url ? <a href={i.url} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>{i.title}</a> : i.title}
              </div>
              <div style={{ color: "#666", marginTop: 2 }}>
                <span style={{ color: STATUS[i.status].color }}>{STATUS[i.status].label}</span>
                {i.urgency === "high" && " · High"} · {i.assignee} · {elapsed(i.createdAt)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
