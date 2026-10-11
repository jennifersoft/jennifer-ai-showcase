# jennifer-ai-showcase

JENNIFER × AI 발표와 데모 모음 (Next.js).

## 실행

```bash
npm install
cp .env.example .env.local   # JENNIFER_URL, JENNIFER_API_TOKEN, FRAME_ANCESTORS
npm run dev
```

## 페이지

| 경로 | 용도 |
|---|---|
| `/slides` | 일본 행사 발표용 인터랙티브 웹 슬라이드 (일본어 메인, 한국어 서브) |
| `/charts/[id]` | 레이아웃 없는 차트 단독 페이지. 제니퍼 사용자정의 대시보드 iframe 위젯에 URL로 등록 |
| `/dashboards/integrated` | 통합 대시보드 데모. 제니퍼 APM 차트와 Prometheus 데모 서버 지표(`/charts/node-cpu` 등)를 한 화면에 |
| `/api/prometheus/[key]` | 허용한 PromQL만 실행하는 프록시. 응답이 없으면 `lib/prometheus-fallback.json`(녹화 데이터)으로 대체 |
| `/widgets/incidents` | 열린 PagerDuty 인시던트와 담당자. 제니퍼 사용자정의 대시보드 iframe 위젯용. `PAGERDUTY_API_KEY`가 없으면 샘플 데이터 |
| `/embed` | 제니퍼 `/popup/chartIframe`과 AI 차트를 나란히 보여주는 데모 |
| `/widgets/deploy-timeline?hours=24` | 배포·변경 타임라인 위젯. 제니퍼 응답시간 차트 옆에 같은 시간 범위로 두면 "배포 직후 느려짐"을 바로 본다 |
| `/api/deploys` | 배포 이벤트. `GET ?hours=N` 조회, `POST` 는 CI가 배포 직후 호출 |
| `/api/jennifer/*` | 제니퍼 OpenAPI 프록시. 토큰은 서버에만 둔다 |

## 슬라이드 조작

`→` / `Space` 다음, `←` 이전, `N` 발표자 노트, `O` 슬라이드 목록, `F` 전체화면. 발표자 노트의 `[확인 필요]` 항목은 아직 확정 전.

## iframe 연동 주의

- 제니퍼 대시보드에 외부 차트를 넣을 때: 고객이 `enable_csp`를 켜면 기본 `frame-src 'self'`라서 막힌다. 차트 도메인을 `csp_policy`에 추가해야 한다. 이 서버는 `FRAME_ANCESTORS`로 자신을 넣을 수 있는 origin을 제한한다.
- 제니퍼 차트를 다른 도메인에서 불러올 때: HTTPS와 제니퍼의 `x_frame_options`, `enable_csp`, `add_same_site_none_cookie` 설정이 필요하다.
- 차트 페이지가 `/api/jennifer` 를 부르려면 제니퍼 iframe 위젯의 sandbox 에서 `allow-scripts` 와 `allow-same-origin` 을 켜야 한다. 다른 origin 위젯은 기본으로 sandbox 가 붙는다(view-server `DashboardIframePolicy`).
- OpenAPI 프록시는 `Authorization: Bearer <token>` 헤더로 인증한다. 제니퍼는 `?token=` 쿼리와 헤더를 모두 받지만(view-server `InterceptorUtil.getTokenKey`), 쿼리 토큰은 로그에 남을 수 있다.
- 프록시는 차트용 조회 경로(`domain`, `instance`, `business`, `realtime/*`, `metrics`, `dbmetrics/*`)만 허용한다. 필요한 경로는 `app/api/jennifer/[...path]/route.ts` 의 `ALLOWED_PATHS` 에 추가한다.

## 서버 지표 데모 주의

- 공개 Prometheus 데모(`prometheus.demo.prometheus.io`)는 제니퍼가 감시하는 서버와 다른 서버다. 같은 서버의 상관 분석처럼 보이지 않게 "외부 데이터 소스 연동 예시"로 소개한다.
- 공개 데모는 가용성 보장이 없다. 응답이 없으면 차트에 "녹화 데이터"로 표시된다. fallback은 2026-10-11에 녹화한 실제 응답(15분)이다.

## 배포 타임라인 연동

- CI 배포 잡 마지막에 호출한다. `DEPLOY_WEBHOOK_SECRET` 이 없으면 POST는 503으로 막힌다.

```bash
curl -X POST "$SHOWCASE_URL/api/deploys" -H "Authorization: Bearer $DEPLOY_WEBHOOK_SECRET" -H "Content-Type: application/json" -d '{"title":"v1.2.3","service":"order-api"}'
```

- 데모용으로 `DEPLOY_GITHUB_REPO`(예: `prometheus/prometheus`)를 넣으면 그 저장소의 GitHub 릴리즈도 함께 찍힌다. 긴 범위(`?hours=720`)로 보면 된다.
- POST로 받은 이벤트는 서버 메모리에만 있어 재시작하면 사라진다. 실제 운영에는 저장소(DB)가 필요하다.
