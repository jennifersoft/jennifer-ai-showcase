import LineChart from "./LineChart";

// 레이아웃 없는 차트 단독 페이지. 제니퍼 사용자정의 대시보드 iframe 위젯에 URL로 등록한다.
export default async function ChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div style={{ width: "100vw", height: "100vh", boxSizing: "border-box", padding: 8 }}>
      <LineChart metric={id} />
    </div>
  );
}
