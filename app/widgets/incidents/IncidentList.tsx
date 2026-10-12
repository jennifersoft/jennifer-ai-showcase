"use client";

import { useEffect, useState } from "react";
import type { IncidentList as Data } from "@/lib/pagerduty";
import { t, type Lang } from "@/lib/i18n";

const STATUS = {
  triggered: { label: "Triggered", color: "var(--danger)" },
  acknowledged: { label: "Acknowledged", color: "var(--warn)" },
  resolved: { label: "Resolved", color: "var(--ok)" },
} as const;

function elapsed(iso: string, lang: Lang) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  return min < 60 ? t(lang, "incidents.minAgo", { n: min }) : t(lang, "incidents.hourAgo", { n: Math.floor(min / 60) });
}

export default function IncidentList({ lang }: { lang: Lang }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const load = () => fetch(`/api/incidents?lang=${lang}`).then((r) => r.json()).then(setData).catch(() => {});
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [lang]);

  const incidents = data?.incidents ?? [];
  const triggered = incidents.filter((i) => i.status === "triggered").length;

  return (
    <div className="widget">
      <div className="widget-head">
        <div>
          <div className="widget-title">{t(lang, "incidents.title")}</div>
          <div className="widget-value">
            {data ? incidents.length : "–"}
            <span className="widget-unit">
              {t(lang, "count")}
              {triggered ? ` · ${t(lang, "incidents.unacked", { n: triggered })}` : ""}
            </span>
          </div>
        </div>
        {data?.source === "sample" ? <span className="badge">{t(lang, "sampleData")}</span> : <span className="chip">PagerDuty</span>}
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {data && incidents.length === 0 && <div className="empty" style={{ color: "var(--ok)" }}>{t(lang, "incidents.empty")}</div>}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
          {incidents.map((i) => (
            <li
              key={i.id}
              style={{ borderLeft: `3px solid ${STATUS[i.status].color}`, padding: "8px 10px", background: "var(--surface-2)", borderRadius: 6, fontSize: 13 }}
            >
              <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i.url ? (
                  <a href={i.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                    {i.title}
                  </a>
                ) : (
                  i.title
                )}
              </div>
              <div style={{ color: "var(--text-2)", marginTop: 3, fontSize: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ color: STATUS[i.status].color, fontWeight: 600 }}>{STATUS[i.status].label}</span>
                {i.urgency === "high" && <span>· High</span>}
                <span>· {i.assignee}</span>
                <span>· {elapsed(i.createdAt, lang)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
