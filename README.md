# jennifer-ai-showcase

JENNIFER × AI 발표 슬라이드와 데모를 모은 Next.js 서버다.
제니퍼 사용자정의 대시보드에 넣는 차트·위젯, 제니퍼 차트를 바깥에 넣는 통합 대시보드, 웹 슬라이드 덱을 한 앱에서 제공한다.

## 실행

```bash
npm install
cp .env.example .env.local   # 값은 아래 "환경변수" 참고. 비워 두면 데모 데이터로 동작한다
npm run dev                  # http://localhost:3000
```

## 페이지

**슬라이드**

| 경로 | 용도 |
|---|---|
| `/slides` | 발표 덱 목록 (날짜 최신순) |
| `/slides/<덱>` | 웹 슬라이드. 예: `/slides/japan-2026` |

**제니퍼 사용자정의 대시보드 iframe 위젯용** (URL로 등록)

| 경로 | 용도 |
|---|---|
| `/charts/[id]` | 레이아웃 없는 차트 단독 페이지 (예: `/charts/tps`, `/charts/node-cpu`) |
| `/widgets/incidents` | 열린 PagerDuty 인시던트와 담당자. `PAGERDUTY_API_KEY`가 없으면 샘플 데이터 |
| `/widgets/deploy-timeline?hours=24` | 배포·변경 타임라인. 제니퍼 응답시간 차트 옆에 같은 시간 범위로 두면 "배포 직후 느려짐"을 바로 본다 |

**데모 화면**

| 경로 | 용도 |
|---|---|
| `/dashboards/integrated` | 통합 대시보드. 제니퍼 APM 차트와 Prometheus 서버 지표를 한 화면에 |
| `/embed` | 제니퍼 `/popup/chartIframe`과 AI 차트를 나란히 보여준다 |

**API**

| 경로 | 용도 |
|---|---|
| `/api/jennifer/*` | 제니퍼 OpenAPI 프록시. 토큰은 서버에만 둔다 |
| `/api/prometheus/[key]` | 허용한 PromQL만 실행. 응답이 없으면 `lib/prometheus-fallback.json`(녹화 데이터)으로 대체 |
| `/api/incidents` | PagerDuty 열린 인시던트 |
| `/api/deploys` | 배포 이벤트. `GET ?hours=N` 조회, `POST`는 CI가 배포 직후 호출 |

## 슬라이드

### 발표하기

- 주소: `/slides/<덱>?jennifer=<제니퍼 대시보드 주소>`. `?jennifer=`가 없으면 `JENNIFER_DASHBOARD_URL`을 쓰고, 둘 다 없으면 라이브 화면에 "未設定"이 뜬다. 대시보드 주소 끝에 `layout=iframe`을 붙이면 제니퍼 상단 메뉴가 빠진다.
- 조작: `→`/`Space` 다음, `←` 이전, `N` 발표자 노트, `O` 목록, `F` 전체화면, `I` 라이브 화면 조작(여백을 클릭하면 해제), `Home`/`End` 처음/끝. 주소 끝 `#s3`처럼 장 번호로 바로 연다.
- 라이브 화면(iframe) 위에는 보호막이 덮여 있어 클릭·키보드는 슬라이드가 받는다. 화면을 직접 조작할 때만 `I`를 누르고, 끝나면 슬라이드 여백을 클릭해 돌아온다.
- 제니퍼와 이 서버의 도메인이 다르면, 발표할 브라우저에서 제니퍼에 미리 로그인해 둔다(아래 "제니퍼 연동 주의").
- 발표자 노트의 `[확인 필요]` 항목은 아직 확정 전이다.

### 구조

공통 엔진은 한 번 만들고 모든 덱이 같이 쓴다. 엔진을 고치면 모든 덱에 반영된다.

```
slides/
  _engine/      공통 엔진. engine.css(무대·애니메이션·카드·타임라인·숫자 카드·라이브 iframe),
                engine.js(이동·단계·노트·목록·전체화면), chrome.html(HUD)
  _template/    새 덱 시작 템플릿 (목록에 안 보이고, /slides/_template 로 미리보기)
  japan-2026/   덱 하나 = meta.json + slides.html (+ deck.css, deck.js)
```

`/slides/<덱>`은 `lib/slides.ts`가 엔진과 덱 파일을 합쳐 HTML 한 장으로 렌더링한다.

### 새 덱 추가하기

1. `cp -r slides/_template slides/<덱이름>` (덱이름은 소문자·숫자·하이픈)
2. `meta.json`의 `title`, `theme`(`dark`|`light`, 템플릿은 `light`), `lang`, `date`, `description`을 고친다. `?theme=light` 로 테마를 바꿔 미리볼 수 있다.
3. `slides.html`에 `<section class="slide">`를 한 장씩 쓴다. `data-notes`는 발표자 노트, `data-a`는 등장 애니메이션(`style="--d:n"`으로 순서).
4. 실제 화면은 한 줄로 넣는다. `{{live:jennifer}}`는 제니퍼 대시보드, `{{live:/경로}}`는 이 서버 페이지(예: `{{live:/dashboards/integrated}}`).
5. 단계 연출이 필요하면 섹션에 `data-steps="N"`을 주고 `deck.js`에 `hooks['<섹션 id>']=st=>{...}`를 쓴다.
6. 여러 덱에 쓸 만한 스타일·컴포넌트가 생기면 덱 폴더가 아니라 `_engine`으로 올린다.

## 제니퍼 연동 주의

- **제니퍼 대시보드에 이 서버 차트를 넣을 때**: 고객이 `enable_csp`를 켜면 기본값 `frame-src 'self'` 때문에 막힌다. 차트 도메인을 `csp_policy`에 추가해야 한다. 이 서버는 `FRAME_ANCESTORS`로 자신을 넣을 수 있는 origin을 제한한다.
- **sandbox**: 다른 origin 위젯에는 sandbox가 자동으로 붙는다(view-server `DashboardIframePolicy`). 차트가 `/api/jennifer`를 부르려면 위젯 설정에서 `allow-scripts`와 `allow-same-origin`을 켠다.
- **제니퍼 차트를 다른 도메인에서 불러올 때**: HTTPS와 제니퍼의 `x_frame_options`, `enable_csp`, `add_same_site_none_cookie` 설정이 필요하다. Safari·시크릿 창은 로그인 쿠키가 막힐 수 있다.
- **OpenAPI 인증**: 프록시는 `Authorization: Bearer <token>` 헤더를 쓴다. 제니퍼는 `?token=` 쿼리도 받지만(view-server `InterceptorUtil.getTokenKey`) 쿼리 토큰은 로그에 남을 수 있다.
- **허용 경로**: 프록시는 차트용 조회 경로(`domain`, `instance`, `business`, `realtime/*`, `metrics`, `dbmetrics/*`)만 허용한다. 필요한 경로는 `app/api/jennifer/[...path]/route.ts`의 `ALLOWED_PATHS`에 추가한다.

## 서버 지표 데모 주의

- 공개 Prometheus 데모(`prometheus.demo.prometheus.io`)는 제니퍼가 감시하는 서버와 다른 서버다. 같은 서버의 상관 분석처럼 보이지 않게 "외부 데이터 소스 연동 예시"로 소개한다.
- 공개 데모는 가용성 보장이 없다. 응답이 없으면 차트에 "녹화 데이터"로 표시된다. fallback은 2026-10-11에 녹화한 실제 응답(15분)이다.

## 배포 타임라인 연동

CI 배포 잡 마지막에 호출한다. `DEPLOY_WEBHOOK_SECRET`이 없으면 POST는 503으로 막힌다.

```bash
curl -X POST "$SHOWCASE_URL/api/deploys" -H "Authorization: Bearer $DEPLOY_WEBHOOK_SECRET" -H "Content-Type: application/json" -d '{"title":"v1.2.3","service":"order-api"}'
```

- 데모용으로 `DEPLOY_GITHUB_REPO`(예: `prometheus/prometheus`)를 넣으면 그 저장소의 GitHub 릴리즈도 함께 찍힌다. 긴 범위(`?hours=720`)로 보면 된다.
- POST로 받은 이벤트는 서버 메모리에만 있어 재시작하면 사라진다. 운영에는 외부 저장소(DB, Vercel KV, Upstash 등)가 필요하다.

## 환경변수

`.env.example`에 같은 목록이 있다. 모두 비워도 데모 데이터로 동작한다.

| 이름 | 용도 | 필요할 때 |
|---|---|---|
| `JENNIFER_URL` | 제니퍼 뷰서버 주소 (OpenAPI 프록시, chartIframe) | 제니퍼 연동 |
| `JENNIFER_API_TOKEN` | 제니퍼 OPEN_API 토큰. 서버에서만 쓴다 | 제니퍼 연동 |
| `FRAME_ANCESTORS` | 이 서버 페이지를 iframe으로 넣을 수 있는 origin(공백 구분). 제니퍼 도메인을 넣는다 | 대시보드 위젯 |
| `JENNIFER_DASHBOARD_URL` | 슬라이드 라이브 화면의 제니퍼 대시보드 기본 주소 (`?jennifer=`로 덮어쓰기) | 선택 |
| `PROMETHEUS_URL` | 서버 지표 소스 (기본: 공개 데모) | 선택 |
| `PAGERDUTY_API_KEY`, `PAGERDUTY_SERVICE_ID` | 인시던트 위젯 (읽기 전용 키 권장) | 선택 |
| `DEPLOY_WEBHOOK_SECRET`, `DEPLOY_GITHUB_REPO`, `GITHUB_TOKEN` | 배포 타임라인 | 선택 |

## Vercel 배포

- GitHub 저장소를 Vercel 프로젝트에 연결하면 `main` 푸시마다 배포된다. 환경변수는 Vercel 프로젝트 설정 → Environment Variables에 넣는다.
- **커밋 작성자**: Vercel은 배포하는 커밋의 작성자가 팀 멤버여야 배포한다. 이 저장소의 커밋은 `alvin-hh` / `alvin@jennifersoft.com`으로 한다.

```bash
git config user.name alvin-hh
git config user.email alvin@jennifersoft.com
```

- **Root Directory**: 저장소 루트(`./`). Framework는 Next.js(자동 감지).
- **도메인**: https://jennifer.alvin.ing. Cloudflare DNS에서 Vercel로 CNAME을 걸고, Cloudflare 프록시는 끈다(DNS only).
- **Next.js 버전**: 취약 버전이면 빌드가 성공해도 배포가 Error로 막힌다. 15.5 최신 패치(현재 15.5.27)를 유지한다.
- **슬라이드 파일**: `/slides`, `/slides/<덱>`은 `slides/` 폴더를 파일로 읽는다. `next.config.ts`의 `outputFileTracingIncludes`로 배포물에 포함된다.
- **서버리스 주의**: `POST /api/deploys` 이벤트는 인스턴스가 바뀌면 사라진다. 데모는 `DEPLOY_GITHUB_REPO`의 GitHub 릴리즈로 보여준다.

## 디자인

- 공통 토큰은 `app/globals.css`(기본 라이트). 위젯·차트는 `?theme=dark` 로 다크 테마가 된다. 제니퍼 대시보드 테마(classic/dark)에 맞춰 넘긴다.
- 차트는 `components/TimeSeriesChart.tsx` 하나를 쓴다. y축 눈금·격자, x축 시간, 현재 값, 마우스 위치 값이 있다. 패널은 `components/ChartWidget.tsx`.
- 슬라이드 테마는 엔진(`slides/_engine/engine.css`)의 `:root[data-theme="light"]` 토큰으로 바뀐다. 덱 CSS에서는 색을 직접 쓰지 말고 `var(--fg)`, `var(--panel)` 같은 토큰을 쓴다.

