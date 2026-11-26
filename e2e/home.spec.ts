import { expect, test } from "@playwright/test";

test.describe("첫 화면", () => {
  test("접속하면 검색 노출용 사이트 제목이 설정되어 있습니다", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("혜택모아 - 내게 맞는 정부지원사업");
  });

  test("접속하면 서비스명과 검색창, 예시 검색어만 보이고 공고 목록은 보이지 않습니다", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "혜택모아" })).toBeVisible();
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.getByRole("list", { name: "예시 검색어" }).getByRole("button")).toHaveCount(4);
    await expect(page.getByRole("article")).toHaveCount(0);
  });
});
