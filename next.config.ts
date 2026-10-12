import type { NextConfig } from "next";

const frameAncestors = process.env.FRAME_ANCESTORS || "'self'";

const nextConfig: NextConfig = {
  // /slides 는 app/slides/route.ts 가 slides/deck.html 을 읽어 렌더링한다. 배포 산출물에 포함시킨다.
  outputFileTracingIncludes: { "/slides": ["./slides/**/*"], "/slides/[deck]": ["./slides/**/*"] },
  async headers() {
    return [
      {
        // 제니퍼 사용자정의 대시보드 iframe 위젯에 넣는 차트 페이지
        source: "/charts/:path*",
        headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` }],
      },
      {
        // 배포 타임라인 같은 위젯도 제니퍼 대시보드 iframe 위젯에 넣는다
        source: "/widgets/:path*",
        headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` }],
      },
    ];
  },
};

export default nextConfig;
