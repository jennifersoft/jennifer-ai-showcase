import type { ReactNode } from "react";
import TimeSeriesChart, { formatValue, type Point } from "./TimeSeriesChart";

type Props = {
  title: string;
  unit?: string;
  points: Point[];
  color?: string;
  max?: number;
  badge?: ReactNode;
};

/** iframe 위젯용 차트 패널: 제목 · 현재 값 · 축이 있는 시계열 차트. */
export default function ChartWidget({ title, unit = "", points, color, max, badge }: Props) {
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
        {points.length < 2 ? <div className="empty" style={{ height: "100%" }}>불러오는 중</div> : <TimeSeriesChart points={points} unit={unit} color={color} max={max} />}
      </div>
    </div>
  );
}
