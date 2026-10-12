import { QUERIES, isQueryKey } from "@/lib/prometheus";
import LineChart from "./LineChart";
import PromChart from "./PromChart";

// 레이아웃 없는 차트 단독 페이지. 제니퍼 사용자정의 대시보드 iframe 위젯에 URL로 등록한다.
// node-* 는 Prometheus 데모 지표, tps·response·error·active 와 그 외는 데모 데이터. ?theme=dark 로 다크 테마.
export default async function ChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return isQueryKey(id) ? <PromChart id={id} label={QUERIES[id].label} unit={QUERIES[id].unit} /> : <LineChart metric={id} />;
}
