import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 32, lineHeight: 1.8 }}>
      <h1>JENNIFER × AI showcase</h1>
      <ul>
        <li><a href="/slides">발표 슬라이드</a></li>
        <li><Link href="/charts/tps">AI 차트 예시</Link> (제니퍼 사용자정의 대시보드 iframe 위젯용)</li>
        <li><Link href="/dashboards/integrated">통합 대시보드</Link> (제니퍼 APM + Prometheus 서버 지표)</li>
        <li><Link href="/embed">제니퍼 차트 임베드 데모</Link></li>
      </ul>
    </main>
  );
}
