// e2e 테스트 설정 (단위 테스트는 vitest.config.ts)
import { defineConfig, devices } from "@playwright/test";

// 평소 개발 서버(3000, .next)와 겹치지 않도록 e2e 전용 포트와 빌드 폴더를 쓴다.
// 두 개발 서버가 같은 .next 폴더를 쓰면 서로 파일을 덮어써 500·404 오류가 난다
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const E2E_DIST_DIR = ".next-e2e";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    // 테스트 전체 시간(30초)보다 짧게 잡아, 멈추면 어느 단계(이동·클릭)에서 멈췄는지 오류에 드러나게 한다
    navigationTimeout: 15_000,
    actionTimeout: 10_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 테스트 전에 e2e 전용 개발 서버를 띄운다. 이미 떠 있으면 그 서버를 쓴다 (CI 제외)
  webServer: {
    command: `npx next dev --port ${PORT}`,
    env: { NEXT_DIST_DIR: E2E_DIST_DIR },
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
