import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // e2e 테스트 서버는 NEXT_DIST_DIR=.next-e2e로 따로 빌드한다 (playwright.config.ts)
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
