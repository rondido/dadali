// 공고 상세 패널 (기획서 P04, F08·F10·F12)과 100vh 화면 배치. src/data/sampleNotices.ts의 샘플 공고를 기준으로 검증합니다.
import { expect, test, type Page } from "@playwright/test";

const SEOUL = "샘플 서울 소상공인 점포 환경개선 지원"; // 10.28 ~ 11.11, 소상공인24 (원문 주소 없음)
const STARTUP = "샘플 창업 사업화 지원 모집"; // 11.02 ~ 11.20, K-Startup (원문 주소 있음)

function panel(page: Page) {
  return page.getByRole("complementary");
}

function openCard(page: Page, title: string) {
  return page.getByRole("button", { name: title, exact: true }).click();
}

// 샘플 공고의 상태가 고르게 나뉘도록 브라우저 시계를 서울 기준 2026년 11월 10일 오전으로 고정합니다
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-10T09:00:00+09:00"));
  await page.goto("/");
  await page.getByRole("button", { name: "전체 지원사업 보기" }).click();
});

test.describe("카드를 누르면", () => {
  test("보드를 떠나지 않고 옆에 상세 패널을 열고 주소에 공고를 남깁니다", async ({ page }) => {
    await openCard(page, SEOUL);

    await expect(panel(page).getByRole("heading", { name: SEOUL })).toBeVisible();
    await expect(page.getByRole("region", { name: "진행 중", exact: true })).toBeVisible();
    await expect(page).toHaveURL(/notice=s25/);
  });

  test("남은 기간을 큰 D-day와 며칠째인지로 보여줍니다", async ({ page }) => {
    await openCard(page, SEOUL);

    await expect(panel(page)).toContainText("D-1");
    await expect(panel(page)).toContainText("15일 중 14일째");
  });

  test("두 달에 걸친 기간은 두 달 달력에 시작일부터 마감일까지 막대로 그립니다", async ({ page }) => {
    await openCard(page, SEOUL);
    const calendar = panel(page).getByRole("figure", { name: "접수 기간 달력" });

    await expect(calendar.getByRole("table")).toHaveCount(2);
    await expect(calendar.locator("[data-period]")).toHaveCount(15);
    await expect(calendar.locator('[data-date="2026-10-28"]')).toHaveAttribute("data-mark", "start");
    await expect(calendar.locator('[data-date="2026-11-11"]')).toHaveAttribute("data-mark", "end");
  });

  test("지난 기간과 남은 기간을 나누고 오늘을 표시합니다", async ({ page }) => {
    await openCard(page, SEOUL);
    const calendar = panel(page).getByRole("figure", { name: "접수 기간 달력" });

    await expect(calendar.locator('[data-date="2026-11-09"]')).toHaveAttribute("data-period", "elapsed");
    await expect(calendar.locator('[data-date="2026-11-10"]')).toHaveAttribute("data-period", "remaining");
    await expect(calendar.getByLabel("11월 10일 오늘")).toBeVisible();
  });

  test("대상, 출처와 최종 갱신 시각을 보여줍니다", async ({ page }) => {
    await openCard(page, SEOUL);
    const targets = panel(page).getByRole("definition");

    await expect(targets).toHaveText(["서울", "전 연령", "도소매·음식", "시설·인테리어"]);
    await expect(panel(page)).toContainText("출처 소상공인24 · 최종 갱신 11월 10일 05:00");
  });
});

test.describe("원문 공고로 이동", () => {
  test("원문 주소가 있으면 새 탭으로 원문 공고를 열고 공식 도메인을 보여줍니다", async ({ page }) => {
    await openCard(page, STARTUP);
    const link = panel(page).getByRole("link", { name: /원문 공고 보기/ });

    await expect(link).toHaveAttribute("href", "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(panel(page)).toContainText("k-startup.go.kr");
  });

  test("원문 주소가 없으면 출처 사이트 첫 화면으로 보낸다고 알려 줍니다", async ({ page }) => {
    await openCard(page, SEOUL);
    const link = panel(page).getByRole("link", { name: /소상공인24에서 공고 찾기/ });

    await expect(link).toHaveAttribute("href", "https://www.sbiz24.kr");
    await expect(panel(page)).toContainText("원문 주소가 없어 사이트 첫 화면으로 이동해요");
  });
});

test("상시 공고는 달력 대신 상시 모집으로 보여줍니다", async ({ page }) => {
  await openCard(page, "샘플 상시 정책자금");

  await expect(panel(page)).toContainText("상시 모집");
  await expect(panel(page).getByRole("figure")).toHaveCount(0);
});

test("패널이 열린 채 다른 카드를 누르면 내용만 바뀝니다", async ({ page }) => {
  await openCard(page, SEOUL);
  await openCard(page, STARTUP);

  await expect(panel(page).getByRole("heading", { name: STARTUP })).toBeVisible();
  await expect(page.getByRole("complementary")).toHaveCount(1);
});

test.describe("패널 닫기", () => {
  test("Esc를 누르면 닫히고 초점이 그 카드로 돌아갑니다", async ({ page }) => {
    await openCard(page, SEOUL);
    await page.keyboard.press("Escape");

    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: SEOUL, exact: true })).toBeFocused();
    await expect(page).not.toHaveURL(/notice=/);
  });

  test("뒤로 가기를 누르면 보드는 그대로 두고 패널만 닫습니다", async ({ page }) => {
    await openCard(page, SEOUL);
    // 패널을 연 주소 이동이 끝난 뒤에 뒤로 갑니다 (그 전에 누르면 첫 화면까지 돌아갑니다)
    await expect(page).toHaveURL(/notice=s25/);
    await page.goBack();

    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "진행 중", exact: true })).toBeVisible();
  });

  test("공고가 담긴 주소로 바로 들어오면 패널이 열린 채로 보입니다", async ({ page }) => {
    await page.goto("/?all=1&notice=s25");

    await expect(panel(page).getByRole("heading", { name: SEOUL })).toBeVisible();
  });
});

test("첫 화면의 이번 주 마감 카드를 누르면 전체 보드와 함께 패널을 엽니다", async ({ page }) => {
  await page.getByRole("button", { name: "처음부터 새로 찾기" }).click();
  await openCard(page, SEOUL);

  await expect(page).toHaveURL(/all=1&notice=s25/);
  await expect(panel(page).getByRole("heading", { name: SEOUL })).toBeVisible();
});

test.describe("화면 높이", () => {
  test("PC에서는 페이지가 화면 높이(100vh)를 넘지 않고 보드와 패널이 각자 스크롤합니다", async ({ page }) => {
    await openCard(page, SEOUL);
    await page.getByRole("button", { name: /건 더보기/ }).first().click();

    const { scrollHeight, innerHeight } = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
    }));
    expect(scrollHeight).toBe(innerHeight);
  });
});

test.describe("모바일", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("아래에서 올라오는 시트로 열고 원문 버튼을 화면 안에 보여줍니다", async ({ page }) => {
    await openCard(page, SEOUL);

    const box = (await panel(page).boundingBox())!;
    expect(box.y + box.height).toBeCloseTo(844, 0);
    await expect(panel(page).getByRole("link", { name: /공고 찾기|원문 공고 보기/ })).toBeInViewport();
  });

  test("뒤 화면을 누르면 시트가 닫힙니다", async ({ page }) => {
    await openCard(page, SEOUL);
    await page.mouse.click(195, 40);

    await expect(panel(page)).toHaveCount(0);
  });
});
