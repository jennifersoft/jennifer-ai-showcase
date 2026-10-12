import { QUERIES, isQueryKey } from "@/lib/prometheus";
import { t } from "@/lib/i18n";
import { requestLang } from "@/lib/requestLang";
import LineChart from "./LineChart";
import PromChart from "./PromChart";

// 레이아웃 없는 차트 단독 페이지. 제니퍼 사용자정의 대시보드 iframe 위젯에 URL로 등록한다.
// node-* 는 Prometheus 데모 지표, tps·response·error·active 와 그 외는 데모 데이터.
// ?theme=dark 로 다크 테마, ?lang=ko|ja|en 으로 언어(없으면 브라우저 언어).
export default async function ChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const lang = await requestLang((await searchParams).lang);
  return isQueryKey(id) ? (
    <PromChart id={id} label={t(lang, `infra.${id}`)} unit={QUERIES[id].unit} lang={lang} />
  ) : (
    <LineChart metric={id} lang={lang} />
  );
}
