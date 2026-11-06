// 상태 보드 (기획서 5장, F05·F06). src/data/sampleNotices.ts의 샘플 공고를 기준으로 검증합니다.
import { expect, test, type Page } from "@playwright/test";

function column(page: Page, title: string) {
  return page.getByRole("region", { name: title, exact: true });
}

// 샘플 공고의 상태가 고르게 나뉘도록 브라우저 시계를 서울 기준 2026년 11월 10일 오전으로 고정합니다
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-10T09:00:00+09:00"));
  await page.goto("/");
  await page.getByRole("button", { name: "전체 지원사업 보기" }).click();
});

test.describe("전체 보드", () => {
  test("진행 예정·진행 중·상시 세 열을 순서대로 보여주고 열마다 공고 수를 표시합니다", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 3 })).toHaveText([
      /진행 예정\s*3건/,
      /진행 중\s*11건/,
      /상시\s*3건/,
    ]);
  });

  test("보드 위에 이번 주 마감과 7일 안에 시작하는 공고 수를 보여줍니다", async ({ page }) => {
    await expect(page.getByText(/이번 주 마감\s*2건 · 7일 안에 시작\s*2건/)).toBeVisible();
  });

  test("진행 중 열은 마감이 빠른 공고부터 빨간 D-day와 함께 보여줍니다", async ({ page }) => {
    const first = column(page, "진행 중").getByRole("article").first();

    await expect(first).toContainText("샘플 서울 소상공인 점포 환경개선 지원");
    await expect(first).toContainText("D-1");
    await expect(first.getByRole("meter")).toHaveAttribute("aria-valuetext", "15일 중 14일째");
  });

  test("진행 예정 카드에는 며칠 후 시작하는지 보여줍니다", async ({ page }) => {
    await expect(column(page, "진행 예정").getByRole("article").first()).toContainText("2일 후 시작");
  });

  test("마감된 공고는 보여주지 않습니다", async ({ page }) => {
    await expect(page.getByText("샘플 지난 창업 교육")).toHaveCount(0);
  });

  test("열마다 처음 5건만 보여주고 더보기로 나머지를 펼칩니다", async ({ page }) => {
    const ongoing = column(page, "진행 중");
    await expect(ongoing.getByRole("article")).toHaveCount(5);

    await ongoing.getByRole("button", { name: "6건 더보기" }).click();

    await expect(ongoing.getByRole("article")).toHaveCount(11);
  });

  test("화면에 칸반이라는 말을 쓰지 않습니다", async ({ page }) => {
    await expect(page.getByText("칸반")).toHaveCount(0);
  });
});

test.describe("모바일", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("상태 3개를 탭으로 바꾸고 진행 중 탭을 먼저 보여줍니다", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /진행 중/ })).toHaveAttribute("aria-selected", "true");
    await expect(column(page, "진행 중")).toBeVisible();
    await expect(column(page, "진행 예정")).toBeHidden();

    await page.getByRole("tab", { name: /진행 예정/ }).click();

    await expect(column(page, "진행 예정")).toBeVisible();
    await expect(column(page, "진행 중")).toBeHidden();
  });
});
