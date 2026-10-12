import { t, withParams } from "@/lib/i18n";
import { requestLang } from "@/lib/requestLang";

// 제니퍼 /popup/chartIframe 을 불러오는 데모. 로그아웃 상태면 제니퍼의 작은 로그인 화면이 뜬다.
// 다른 도메인이면 제니퍼 쪽 x_frame_options, enable_csp, add_same_site_none_cookie 설정이 필요하다.
export default async function EmbedPage({ searchParams }: { searchParams: Promise<{ src?: string; lang?: string }> }) {
  const { src, lang: langParam } = await searchParams;
  const lang = await requestLang(langParam);
  const base = process.env.JENNIFER_URL;
  const chartSrc = src ?? (base ? new URL("/popup/chartIframe", base).toString() : "");

  return (
    <main className="dash-page">
      <header className="dash-head">
        <h1>{t(lang, "dash.embed.title")}</h1>
        <p>{t(lang, "dash.embed.desc")}</p>
      </header>
      <div className="dash-grid">
        <section className="panel">
          <div className="panel-title">JENNIFER chart</div>
          {chartSrc ? (
            <iframe src={chartSrc} className="frame" style={{ flex: 1 }} title="JENNIFER chart" />
          ) : (
            <div className="empty" style={{ flex: 1 }}>{t(lang, "dash.noJennifer")}</div>
          )}
        </section>
        <section className="panel">
          <div className="panel-title">AI chart</div>
          <iframe src={withParams("/charts/tps", { lang })} className="frame" style={{ flex: 1 }} title="AI chart" />
        </section>
      </div>
    </main>
  );
}
