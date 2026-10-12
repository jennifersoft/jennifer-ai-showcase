import type { ReactNode } from "react";
import TimeSeriesChart, { type Point } from "./TimeSeriesChart";
import { formatValue } from "./format";
import { t, type Lang } from "@/lib/i18n";

type Props = {
  title: string;
  unit?: string;
  points: Point[];
  color?: string;
  max?: number;
  badge?: ReactNode;
  lang: Lang;
};

/** iframe 위젯용 차트 패널: 제목 · 현재 값 · 축이 있는 시계열 차트. */
export default function ChartWidget({ title, unit = "", points, color, max, badge, lang }: Props) {
  const last = points.length ? points[points.length - 1][1] : null;
  return (
    <div className="widget">
      <div className="widget-head">
        <div>
          <div className="widget-title">{title}</div>
          <div className="widget-value">
            {last === null ? "–" : formatValue(last)}
            {unit && last !== null && <span className="widget-unit">{unit}</span>}
          </div>
        </div>
        {badge}
      </div>
      <div className="widget-body">
        {points.length < 2 ? <div className="empty" style={{ height: "100%" }}>{t(lang, "loading")}</div> : <TimeSeriesChart points={points} unit={unit} color={color} max={max} />}
      </div>
    </div>
  );
}
