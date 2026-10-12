import { requestLang } from "@/lib/requestLang";
import DeployTimeline from "./DeployTimeline";

const DEFAULT_HOURS = 24;

// 배포·변경 타임라인 위젯. 제니퍼 사용자정의 대시보드 iframe 위젯에 URL로 등록하고,
// 제니퍼 응답시간 차트와 같은 시간 범위(?hours=)로 나란히 둔다.
export default async function DeployTimelinePage({ searchParams }: { searchParams: Promise<{ hours?: string; lang?: string }> }) {
  const { hours, lang } = await searchParams;
  const parsed = Number(hours);
  const range = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_HOURS;
  return <DeployTimeline hours={range} lang={await requestLang(lang)} />;
}
