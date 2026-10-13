// 위젯·대시보드 다국어. 규칙: 화면에 보이는 문구는 코드에 직접 쓰지 않고 여기 키로 추가한다(ko·ja·en 세 언어 모두).
// 언어 결정 순서: ?lang=ko|ja|en → 브라우저 Accept-Language → en
export const LANGS = ["ko", "ja", "en"] as const;
export type Lang = (typeof LANGS)[number];

const DICT = {
  // 공통
  loading: { ko: "불러오는 중", ja: "読み込み中", en: "Loading" },
  demoData: { ko: "데모 데이터", ja: "デモデータ", en: "Demo data" },
  recordedData: { ko: "녹화 데이터", ja: "録画データ", en: "Recorded data" },
  sampleData: { ko: "샘플 데이터", ja: "サンプルデータ", en: "Sample data" },
  count: { ko: "건", ja: "件", en: "" },

  // 데모 차트
  "chart.tps": { ko: "TPS", ja: "TPS", en: "TPS" },
  "chart.response": { ko: "평균 응답시간", ja: "平均応答時間", en: "Avg response time" },
  "chart.error": { ko: "에러 수", ja: "エラー数", en: "Errors" },
  "chart.active": { ko: "액티브 서비스", ja: "アクティブサービス", en: "Active services" },
  "unit.count": { ko: "건", ja: "件", en: "" },
  "unit.services": { ko: "개", ja: "件", en: "" },

  // 서버 지표 (Prometheus)
  "infra.node-cpu": { ko: "CPU 사용률", ja: "CPU使用率", en: "CPU usage" },
  "infra.node-memory": { ko: "메모리 사용률", ja: "メモリ使用率", en: "Memory usage" },
  "infra.node-load": { ko: "Load 1m", ja: "ロードアベレージ 1m", en: "Load 1m" },
  "infra.node-network": { ko: "네트워크 수신", ja: "ネットワーク受信", en: "Network in" },

  // 배포 타임라인
  "deploy.title": { ko: "배포 · 변경", ja: "デプロイ・変更", en: "Deploys & changes" },
  "deploy.range": { ko: "최근 {hours}시간", ja: "直近{hours}時間", en: "last {hours}h" },
  "deploy.empty": { ko: "이 기간에 배포가 없습니다.", ja: "この期間のデプロイはありません。", en: "No deploys in this period." },

  // 인시던트
  "incidents.title": { ko: "PagerDuty · 열린 인시던트", ja: "PagerDuty・未解決インシデント", en: "PagerDuty · Open incidents" },
  "incidents.unacked": { ko: "미확인 {n}", ja: "未確認 {n}", en: "{n} unacked" },
  "incidents.empty": { ko: "열린 인시던트가 없습니다.", ja: "未解決のインシデントはありません。", en: "No open incidents." },
  "incidents.minAgo": { ko: "{n}분 전", ja: "{n}分前", en: "{n}m ago" },
  "incidents.hourAgo": { ko: "{n}시간 전", ja: "{n}時間前", en: "{n}h ago" },
  "incidents.sample1": { ko: "[JENNIFER] 응답시간 임계치 초과 · order-api", ja: "[JENNIFER] 応答時間がしきい値を超過・order-api", en: "[JENNIFER] Response time over threshold · order-api" },
  "incidents.sample2": { ko: "[JENNIFER] 에러율 급증 · payment-api", ja: "[JENNIFER] エラー率が急増・payment-api", en: "[JENNIFER] Error rate spike · payment-api" },
  "incidents.sample3": { ko: "[JENNIFER] Active Service 증가 · batch-01", ja: "[JENNIFER] アクティブサービス増加・batch-01", en: "[JENNIFER] Active services rising · batch-01" },

  // MCP 데모 (ChatGPT·Claude 가 제니퍼 MCP 로 Open API 를 불러 만든 차트)
  "mcp.title": { ko: "MCP로 만든 차트", ja: "MCPで作ったチャート", en: "Chart built with MCP" },
  "mcp.prompt": {
    ko: "최근 1시간 REALTIME, ANALYSIS 도메인의 TPS, 응답시간, 액티브 서비스를 차트로 보여줘",
    ja: "直近1時間の REALTIME, ANALYSIS ドメインの TPS・応答時間・アクティブサービスをチャートで",
    en: "Chart TPS, response time and active services for the REALTIME, ANALYSIS domain over the last hour",
  },
  "mcp.source": {
    ko: "제니퍼 MCP(get_domain_metric_values) → Open API · {time} 기록",
    ja: "JENNIFER MCP（get_domain_metric_values）→ Open API・{time} 記録",
    en: "JENNIFER MCP (get_domain_metric_values) → Open API · recorded {time}",
  },
  "unit.ms": { ko: "ms", ja: "ms", en: "ms" },

  // PagerDuty 차트 위젯
  "pd.title": { ko: "PagerDuty · 인시던트 추이 (24시간)", ja: "PagerDuty・インシデント推移（24時間）", en: "PagerDuty · Incidents (24h)" },
  "pd.open": { ko: "열림", ja: "未解決", en: "Open" },
  "pd.triggered": { ko: "미확인", ja: "未確認", en: "Unacked" },
  "pd.mtta": { ko: "평균 확인 시간", ja: "平均確認時間", en: "MTTA" },
  "pd.mttr": { ko: "평균 해결 시간", ja: "平均解決時間", en: "MTTR" },
  "pd.high": { ko: "High", ja: "High", en: "High" },
  "pd.low": { ko: "Low", ja: "Low", en: "Low" },
  "pd.min": { ko: "분", ja: "分", en: "m" },
  "pd.sample": { ko: "샘플 (PagerDuty API 형식)", ja: "サンプル（PagerDuty API 形式）", en: "Sample (PagerDuty API format)" },
  "pd.total": { ko: "24시간 {n}건", ja: "24時間で{n}件", en: "{n} in 24h" },

  // 대시보드
  "dash.integrated.title": { ko: "통합 대시보드", ja: "統合ダッシュボード", en: "Integrated dashboard" },
  "dash.integrated.desc": {
    ko: "APM은 JENNIFER, 서버 지표는 외부 데이터 소스(Prometheus 데모). 서로 다른 서버의 데이터입니다.",
    ja: "APMはJENNIFER、サーバー指標は外部データソース（Prometheusデモ）。別々のサーバーのデータです。",
    en: "APM from JENNIFER, server metrics from an external source (Prometheus demo). They come from different servers.",
  },
  "dash.infra": { ko: "Infra · Prometheus (외부 데이터 소스)", ja: "インフラ・Prometheus（外部データソース）", en: "Infra · Prometheus (external source)" },
  "dash.noJennifer": {
    ko: "JENNIFER_URL 환경변수 또는 ?src= 로 제니퍼 chartIframe 주소를 지정하세요.",
    ja: "環境変数 JENNIFER_URL または ?src= で JENNIFER の chartIframe アドレスを指定してください。",
    en: "Set JENNIFER_URL or ?src= to the JENNIFER chartIframe address.",
  },
  "dash.embed.title": { ko: "제니퍼 차트 임베드", ja: "JENNIFERチャートの埋め込み", en: "Embedding a JENNIFER chart" },
  "dash.embed.desc": {
    ko: "왼쪽은 제니퍼 차트(/popup/chartIframe), 오른쪽은 이 서버가 만든 차트입니다.",
    ja: "左はJENNIFERのチャート（/popup/chartIframe）、右はこのサーバーで作ったチャートです。",
    en: "Left: a JENNIFER chart (/popup/chartIframe). Right: a chart built by this server.",
  },
} as const satisfies Record<string, Record<Lang, string>>;

export type MessageKey = keyof typeof DICT;

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

/** ?lang= 값, 없으면 Accept-Language 헤더에서 고른다. */
export function resolveLang(param?: string | null, acceptLanguage?: string | null): Lang {
  if (isLang(param)) return param;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLang(code)) return code;
  }
  return "en";
}

export function t(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  let text: string = DICT[key][lang];
  for (const [k, v] of Object.entries(vars ?? {})) text = text.replace(`{${k}}`, String(v));
  return text;
}

/** 위젯 URL에 lang/theme 를 이어 붙인다 (대시보드가 하위 iframe에 그대로 넘길 때). */
export function withParams(path: string, params: Record<string, string | undefined>): string {
  const q = Object.entries(params).filter(([, v]) => v);
  if (q.length === 0) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${q.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join("&")}`;
}
