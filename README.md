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
| `/api/jennifer/*` | 제니퍼 OpenAPI 프록시. 토큰은 서버에만 둔다 |

## 슬라이드 조작

`→` / `Space` 다음, `←` 이전, `N` 발표자 노트, `O` 슬라이드 목록, `F` 전체화면. 발표자 노트의 `[확인 필요]` 항목은 아직 확정 전.

## iframe 연동 주의

- 제니퍼 대시보드에 외부 차트를 넣을 때: 고객이 `enable_csp`를 켜면 기본 `frame-src 'self'`라서 막힌다. 차트 도메인을 `csp_policy`에 추가해야 한다. 이 서버는 `FRAME_ANCESTORS`로 자신을 넣을 수 있는 origin을 제한한다.
- 제니퍼 차트를 다른 도메인에서 불러올 때: HTTPS와 제니퍼의 `x_frame_options`, `enable_csp`, `add_same_site_none_cookie` 설정이 필요하다.
- 제니퍼 iframe 위젯은 다른 origin이면 sandbox를 붙인다. 차트가 자기 서버(`/api/jennifer`)를 호출하려면 위젯 설정에서 `allow-scripts`와 `allow-same-origin`을 켜야 한다.
- OpenAPI 프록시는 `Authorization: Bearer` 헤더로 토큰을 보내고, `ALLOWED_PATHS`에 등록한 경로만 넘긴다. 허용 경로는 실제로 쓰는 API에 맞춰 조정한다.
