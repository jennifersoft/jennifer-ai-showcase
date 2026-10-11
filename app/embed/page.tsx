// 제니퍼 /popup/chartIframe 를 불러오는 데모. 로그아웃 상태면 제니퍼의 작은 로그인 화면이 뜬다.
// 다른 도메인이면 제니퍼 쪽 x_frame_options, enable_csp, add_same_site_none_cookie 설정이 필요하다.
export default async function EmbedPage({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const { src } = await searchParams;
  const base = process.env.JENNIFER_URL;
  const chartSrc = src ?? (base ? new URL("/popup/chartIframe", base).toString() : "");

  return (
    <main style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: "100vh", boxSizing: "border-box" }}>
      <section>
        <h2>JENNIFER chart</h2>
        {chartSrc ? (
          <iframe src={chartSrc} style={{ width: "100%", height: "80%", border: "1px solid #ddd" }} />
        ) : (
          <p>JENNIFER_URL 환경변수 또는 ?src= 로 chartIframe 주소를 지정하세요.</p>
        )}
      </section>
      <section>
        <h2>AI chart</h2>
        <iframe src="/charts/tps" style={{ width: "100%", height: "80%", border: "1px solid #ddd" }} />
      </section>
    </main>
  );
}
