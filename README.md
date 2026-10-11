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
| `/dashboards/integrated` | 통합 대시보드 데모. 왼쪽 제니퍼 APM 차트, 오른쪽 공개 Prometheus 데모의 인프라 지표 |
| `/infra/[metric]` | 인프라 지표 단독 차트(cpu, memory, load, network). 제니퍼 대시보드 iframe 위젯에 등록 가능 |
| `/api/prometheus/[metric]` | Prometheus 프록시. 허용한 지표만 조회하고, 데모 서버가 안 되면 녹화 데이터(`app/data/infra-fallback.json`)를 돌려준다 |
| `/api/jennifer/*` | 제니퍼 OpenAPI 프록시. 토큰은 서버에만 둔다 |

## 슬라이드 조작

`→` / `Space` 다음, `←` 이전, `N` 발표자 노트, `O` 슬라이드 목록, `F` 전체화면. 발표자 노트의 `[확인 필요]` 항목은 아직 확정 전.

## iframe 연동 주의

- 제니퍼 대시보드에 외부 차트를 넣을 때: 고객이 `enable_csp`를 켜면 기본 `frame-src 'self'`라서 막힌다. 차트 도메인을 `csp_policy`에 추가해야 한다. 이 서버는 `FRAME_ANCESTORS`로 자신을 넣을 수 있는 origin을 제한한다.
- 제니퍼 차트를 다른 도메인에서 불러올 때: HTTPS와 제니퍼의 `x_frame_options`, `enable_csp`, `add_same_site_none_cookie` 설정이 필요하다.
- OpenAPI 프록시의 인증 방식(`token` 쿼리)은 실제 제니퍼 환경에서 확인 필요.

## 통합 대시보드 데모 주의

- 인프라 데이터는 공개 데모 `https://prometheus.demo.prometheus.io`(node_exporter)에서 온다. `PROMETHEUS_URL` 로 바꿀 수 있다.
- 제니퍼가 감시하는 서버와 **다른 서버**다. 발표에서는 "외부 데이터 소스 연동 예시"로 소개하고, 같은 서버의 상관 분석처럼 보이게 하지 않는다.
- 공개 데모는 가용성 보장이 없다. 응답이 없으면 화면에 "(녹화 데이터)"가 붙는다.
