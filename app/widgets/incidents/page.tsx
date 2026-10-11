import IncidentList from "./IncidentList";

// 제니퍼 사용자정의 대시보드 iframe 위젯용. 열린 PagerDuty 인시던트와 담당자를 보여준다.
export default function IncidentsWidget() {
  return (
    <div style={{ width: "100vw", height: "100vh", boxSizing: "border-box", padding: 8, overflow: "auto" }}>
      <IncidentList />
    </div>
  );
}
