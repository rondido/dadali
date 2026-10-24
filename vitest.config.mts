// 단위·컴포넌트 테스트 설정 (e2e는 playwright.config.ts)
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // tsconfig.json의 경로 별칭(@/*)을 그대로 쓴다
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // 테스트 파일은 구현 파일 옆에 둔다 (예: page.tsx ↔ page.test.tsx)
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}"],
    },
  },
});
