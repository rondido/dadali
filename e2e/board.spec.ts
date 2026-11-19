// 상태별 공고 목록 (기획서 5장, F05·F06). src/data/sampleNotices.ts의 샘플 공고를 기준으로 검증합니다.
import { expect, test, type Page } from "@playwright/test";

function column(page: Page, title: string) {
  return page.getByRole("region", { name: new RegExp(`^${title}`) });
}

// 샘플 공고의 상태가 고르게 나뉘도록 브라우저 시계를 서울 기준 2026년 11월 10일 오전으로 고정합니다
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-10T09:00:00+09:00"));
  await page.goto("/?all=1");
});

test.describe("전체 보드", () => {
  test("공고를 한 줄씩 쌓아 D-day가 같은 세로선에 놓입니다", async ({ page }) => {
    const rows = column(page, "접수 중").getByRole("article");
    const first = (await rows.nth(0).boundingBox())!;
    const second = (await rows.nth(1).boundingBox())!;
    expect(second.x).toBeCloseTo(first.x, 0);
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  });

  test("탭 없이 접수 중·접수 예정·상시 구역을 차례로 보여줍니다", async ({ page }) => {
    await expect(page.getByRole("tab")).toHaveCount(0);
    const ongoing = (await column(page, "접수 중").boundingBox())!;
    const upcoming = (await column(page, "접수 예정").boundingBox())!;
    const always = (await column(page, "상시").boundingBox())!;
    expect(upcoming.y).toBeGreaterThan(ongoing.y);
    expect(always.y).toBeGreaterThan(upcoming.y);
  });

  test("구역 제목에 공고 수를 표시합니다", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toHaveText([/접수 중\s*11/, /접수 예정\s*3/, /상시\s*3/]);
  });

  test("접수 중 구역은 7일 안에 마감하는 공고를 따로 묶어 맨 위에 둡니다", async ({ page }) => {
    const groups = column(page, "접수 중").getByRole("list");
    await expect(groups.first()).toHaveAccessibleName("7일 안에 마감");
    await expect(groups.first().getByRole("article").first()).toContainText("D-1");
  });

  test("접수 중 구역은 마감이 빠른 공고부터 빨간 D-day와 함께 보여줍니다", async ({ page }) => {
    const first = column(page, "접수 중").getByRole("article").first();

    await expect(first).toContainText("샘플 서울 소상공인 점포 환경개선 지원");
    await expect(first).toContainText("D-1");
    await expect(first).toContainText("11.11");
  });

  test("접수 예정 공고에는 며칠 후 시작하는지 보여줍니다", async ({ page }) => {
    await expect(column(page, "접수 예정").getByRole("article").first()).toContainText("2일 후 시작");
  });

  test("마감된 공고는 보여주지 않습니다", async ({ page }) => {
    await expect(page.getByText("샘플 지난 창업 교육")).toHaveCount(0);
  });

  test("구역마다 처음 5건만 보여주고 더보기로 나머지를 펼칩니다", async ({ page }) => {
    const ongoing = column(page, "접수 중");
    await expect(ongoing.getByRole("article")).toHaveCount(5);

    await ongoing.getByRole("button", { name: "접수 중 6건 더보기" }).click();

    await expect(ongoing.getByRole("article")).toHaveCount(11);
  });

  test("화면에 칸반이라는 말을 쓰지 않습니다", async ({ page }) => {
    await expect(page.getByText("칸반")).toHaveCount(0);
  });
});

test.describe("모바일", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("한 열로 쌓고 접수 중 공고를 먼저 보여줍니다", async ({ page }) => {
    const first = column(page, "접수 중").getByRole("article").first();
    await expect(first).toBeInViewport();
    const box = (await first.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});
