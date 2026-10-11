import type { NextConfig } from "next";

const frameAncestors = process.env.FRAME_ANCESTORS || "'self'";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/slides", destination: "/slides/index.html" }];
  },
  async headers() {
    return [
      {
        // 제니퍼 사용자정의 대시보드 iframe 위젯에 넣는 차트 페이지
        source: "/charts/:path*",
        headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` }],
      },
      {
        // 인프라 지표 차트도 제니퍼 대시보드 iframe 위젯에 넣을 수 있다
        source: "/infra/:path*",
        headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` }],
      },
    ];
  },
};

export default nextConfig;
