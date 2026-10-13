import Link from "next/link";

const GROUPS = [
  {
    title: "발표",
    items: [{ href: "/slides", title: "슬라이드", desc: "발표 덱 목록. 공통 엔진 위에 덱을 추가해 재사용한다.", tag: "/slides" }],
  },
  {
    title: "제니퍼 대시보드 iframe 위젯",
    items: [
      { href: "/charts/tps", title: "AI 차트", desc: "축·격자·마우스 값이 있는 시계열 차트. tps · response · error · active", tag: "/charts/[id]" },
      { href: "/charts/node-cpu", title: "서버 지표 차트", desc: "Prometheus 데모의 CPU · 메모리 · Load · 네트워크", tag: "/charts/node-*" },
      { href: "/widgets/deploy-timeline", title: "배포 타임라인", desc: "응답시간 차트 옆에 두면 '배포 직후 느려짐'이 보인다.", tag: "/widgets/deploy-timeline" },
      { href: "/widgets/incidents", title: "PagerDuty 인시던트", desc: "열린 인시던트와 담당자.", tag: "/widgets/incidents" },
      { href: "/widgets/pagerduty", title: "PagerDuty 인시던트 추이", desc: "24시간 긴급도별 건수와 MTTA·MTTR. 키가 없으면 API 형식 샘플.", tag: "/widgets/pagerduty" },
    ],
  },
  {
    title: "데모",
    items: [
      { href: "/dashboards/integrated", title: "통합 대시보드", desc: "제니퍼 APM + 외부 서버 지표를 한 화면에.", tag: "/dashboards/integrated" },
      { href: "/embed", title: "제니퍼 차트 임베드", desc: "제니퍼 chartIframe과 AI 차트를 나란히.", tag: "/embed" },
    ],
  },
];

export default function Home() {
  return (
    <main className="page">
      <header className="page-head">
        <h1>JENNIFER × AI showcase</h1>
        <p>제니퍼 안에 외부 화면을, 외부 화면 안에 제니퍼를. 위젯은 ?theme=dark 로 다크 테마.</p>
      </header>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="section-title">{g.title}</h2>
          <div className="cards">
            {g.items.map((i) => (
              <Link key={i.href} href={i.href} className="card">
                <span className="card-title">{i.title}</span>
                <span className="card-desc">{i.desc}</span>
                <span className="card-meta">{i.tag}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
