# ChatGPT용 프롬프트 — 제니퍼 MCP로 대시보드 만들기

ChatGPT에 제니퍼 MCP(`https://insight-dev.jennifersoft.com/mcp`)를 연결한 뒤 아래를 그대로 붙여 넣는다.
도구 이름·메트릭 이름은 MCP `tools/list` 응답(2026-10-13 확인) 그대로다.

---

너는 JENNIFER5 APM 데이터로 운영 대시보드를 만드는 엔지니어야.
연결된 JENNIFER MCP 도구만 써서 실제 데이터를 가져오고, 가져온 값으로만 차트를 그려. 값을 지어내지 마.

## 1. 대상 찾기
1. `get_domain_list`로 도메인 목록을 가져와. 도메인 ID 7000 ("REALTIME, ANALYSIS")을 쓰고, 없으면 살아 있는 인스턴스가 가장 많은 도메인을 골라.
2. `get_instance_list`로 그 도메인의 인스턴스 목록을 가져와.
3. 지금 시각(한국/일본 시간, UTC+9) 기준 최근 1시간을 조회 구간으로 해. 시각은 `YYYY-MM-DDThh:mm:ss` 형식이야.

## 2. 데이터 가져오기
- `get_domain_metric_values`: metrics = `service_rate`(TPS), `service_time`(평균 응답시간 ms), `active_service`, `error_count`, `concurrent_user`. intervalMinute = 2 (포인트 31개 이하).
- `get_instance_metric_values`: 인스턴스 전체, metrics = `max_sys_cpu`, `heap_usage`, `service_rate`. intervalMinute = 2.
- `get_event_list`: 같은 1시간, level = `warning,fatal`.
- `get_error_list`: 같은 1시간. 에러 타입별 건수를 세.
- 도구가 오류를 내면 조건을 바꿔 한 번 더 시도하고, 그래도 안 되면 그 칸은 "데이터 없음"으로 둬.

## 3. 대시보드 만들기
하나의 HTML 파일(인라인 CSS/JS, 차트는 Chart.js CDN)로 만들어. 가져온 데이터는 파일 안에 JSON으로 넣어.
- 다크 테마. 배경 #070B14, 카드 #101A2C, 강조색 #9A91E6, 경고 #F6A621, 위험 #E5484D.
- 화면 문구는 일본어. 제목: 「JENNIFER ダッシュボード(MCP・Open API)」, 부제에 도메인 이름과 조회 구간.
- 맨 위 KPI 카드 4개: 현재 TPS, 평균 응답시간, 액티브 서비스, 1시간 에러 수 (마지막 포인트 값, 단위 포함).
- 차트: ① TPS 선 ② 응답시간 선 ③ 액티브 서비스 막대 ④ 인스턴스별 CPU 선(인스턴스마다 한 줄) ⑤ 에러 타입별 가로 막대.
- 아래에 이벤트 표: 시각, 레벨(FATAL 빨강 / WARNING 주황), 인스턴스, 에러 타입, 메시지. 최근 10건.
- 오른쪽 위에 작은 글씨로 "Data: JENNIFER MCP → Open API · 조회 시각".

## 4. 마지막에 알려 줘
- 호출한 도구와 인자 목록 (토큰 같은 비밀 값은 빼고).
- 데이터에서 눈에 띄는 점 3줄 (예: 응답시간이 튄 시각, 에러가 몰린 인스턴스).
