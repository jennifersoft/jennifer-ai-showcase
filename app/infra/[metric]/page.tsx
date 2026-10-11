import { notFound } from "next/navigation";
import { INFRA_METRICS, isInfraMetricId } from "../../lib/infraMetrics";
import InfraChart from "./InfraChart";

// 인프라 지표 단독 차트. 제니퍼 사용자정의 대시보드 iframe 위젯에 URL로 등록할 수 있다.
export default async function InfraPage({ params }: { params: Promise<{ metric: string }> }) {
  const { metric } = await params;
  if (!isInfraMetricId(metric)) notFound();
  const { label, unit } = INFRA_METRICS[metric];
  return (
    <div style={{ width: "100vw", height: "100vh", boxSizing: "border-box", padding: 8 }}>
      <InfraChart metric={metric} label={label} unit={unit} />
    </div>
  );
}
