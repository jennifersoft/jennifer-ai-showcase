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
| `/embed` | 제니퍼 `/popup/chartIframe`과 AI 차트를 나란히 보여주는 데모 |
| `/widgets/deploy-timeline?hours=24` | 배포·변경 타임라인 위젯. 제니퍼 응답시간 차트 옆에 같은 시간 범위로 두면 "배포 직후 느려짐"을 바로 본다 |
| `/api/deploys` | 배포 이벤트. `GET ?hours=N` 조회, `POST` 는 CI가 배포 직후 호출 |
| `/api/jennifer/*` | 제니퍼 OpenAPI 프록시. 토큰은 서버에만 둔다 |

## 슬라이드 조작

`→` / `Space` 다음, `←` 이전, `N` 발표자 노트, `O` 슬라이드 목록, `F` 전체화면. 발표자 노트의 `[확인 필요]` 항목은 아직 확정 전.

## iframe 연동 주의

- 제니퍼 대시보드에 외부 차트를 넣을 때: 고객이 `enable_csp`를 켜면 기본 `frame-src 'self'`라서 막힌다. 차트 도메인을 `csp_policy`에 추가해야 한다. 이 서버는 `FRAME_ANCESTORS`로 자신을 넣을 수 있는 origin을 제한한다.
- 제니퍼 차트를 다른 도메인에서 불러올 때: HTTPS와 제니퍼의 `x_frame_options`, `enable_csp`, `add_same_site_none_cookie` 설정이 필요하다.
- OpenAPI 프록시의 인증 방식(`token` 쿼리)은 실제 제니퍼 환경에서 확인 필요.

## 배포 타임라인 연동

- CI 배포 잡 마지막에 호출한다. `DEPLOY_WEBHOOK_SECRET` 이 없으면 POST는 503으로 막힌다.

```bash
curl -X POST "$SHOWCASE_URL/api/deploys" -H "Authorization: Bearer $DEPLOY_WEBHOOK_SECRET" -H "Content-Type: application/json" -d '{"title":"v1.2.3","service":"order-api"}'
```

- 데모용으로 `DEPLOY_GITHUB_REPO`(예: `prometheus/prometheus`)를 넣으면 그 저장소의 GitHub 릴리즈도 함께 찍힌다. 긴 범위(`?hours=720`)로 보면 된다.
- POST로 받은 이벤트는 서버 메모리에만 있어 재시작하면 사라진다. 실제 운영에는 저장소(DB)가 필요하다.
