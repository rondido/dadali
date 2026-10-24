import { expect, test } from "@playwright/test";

test.describe("첫 화면", () => {
  test("접속하면 검색 노출용 사이트 제목이 설정되어 있습니다", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("다달이 - 정부지원 달력");
  });

  test("접속하면 서비스명과 슬로건이 보입니다", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("다달이", { exact: true })).toBeVisible();
    await expect(page.getByText("이번 달 정부지원, 한눈에")).toBeVisible();
  });
});
