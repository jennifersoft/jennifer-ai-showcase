import { requestLang } from "@/lib/requestLang";
import PagerDutyChart from "./PagerDutyChart";

// 제니퍼 사용자정의 대시보드 iframe 위젯: PagerDuty 최근 24시간 인시던트 추이(긴급도별 막대) + MTTA·MTTR.
// PAGERDUTY_API_KEY 가 없으면 실제 API 응답 모양의 샘플 데이터로 그린다. ?lang=ko|ja|en, ?theme=dark
export default async function PagerDutyWidget({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  return <PagerDutyChart lang={await requestLang((await searchParams).lang)} />;
}
