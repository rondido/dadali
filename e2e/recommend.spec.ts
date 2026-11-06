// 첫 화면 선택형 찾기와 "먼저 볼 공고". src/data/sampleNotices.ts를 기준으로 검증합니다.
import { expect, test, type Page } from "@playwright/test";

function picker(page: Page) {
  return page.getByRole("region", { name: "문장 대신 골라서 찾기" });
}

function recommended(page: Page) {
  return page.getByRole("region", { name: /먼저 볼 공고/ });
}

async function pick(page: Page, ...labels: string[]) {
  for (const label of labels) {
    await picker(page).getByRole("button", { name: label, exact: true }).click();
  }
}

// 샘플 공고의 상태가 고르게 나뉘도록 브라우저 시계를 서울 기준 2026년 11월 10일 오전으로 고정합니다
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-10T09:00:00+09:00"));
  await page.goto("/");
});

test.describe("첫 화면 선택형 찾기", () => {
  test("아무것도 고르지 않으면 찾기 버튼을 누를 수 없습니다", async ({ page }) => {
    await expect(picker(page).getByRole("button", { name: "조건을 하나 이상 골라 주세요" })).toBeDisabled();
  });

  test("조건을 고르면 눌림 표시와 함께 맞을 수 있는 건수를 보여줍니다", async ({ page }) => {
    await pick(page, "서울", "도소매·음식");

    await expect(picker(page).getByRole("button", { name: "서울", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(picker(page).getByRole("button", { name: "맞을 수 있는 지원사업 15건 보기" })).toBeEnabled();
  });

  test("지역은 하나만 고를 수 있어 다른 지역을 누르면 바뀝니다", async ({ page }) => {
    await pick(page, "서울", "부산");

    await expect(picker(page).getByRole("button", { name: "서울", exact: true })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(picker(page).getByRole("button", { name: "부산", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("찾기를 누르면 고른 조건이 칩과 주소에 담긴 결과 화면으로 갑니다", async ({ page }) => {
    await pick(page, "서울", "도소매·음식");
    await picker(page).getByRole("button", { name: /건 보기/ }).click();

    await expect(page.getByRole("list", { name: "검색 조건", exact: true }).getByRole("listitem")).toHaveText([
      /지역\s*서울/,
      /하는 일\s*도소매·음식/,
    ]);
    await expect(page).toHaveURL(/\?region=11&biz=retail$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("조건에 맞을 수 있는 지원사업 15건");
  });
});

test.describe("모바일", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("첫 화면 아래쪽에서 찾기를 눌러도 결과 화면은 맨 위부터 보여줍니다", async ({ page }) => {
    await pick(page, "서울", "도소매·음식");
    await picker(page).getByRole("button", { name: /건 보기/ }).click();

    await expect(page.getByRole("searchbox", { name: "내 상황" })).toBeInViewport();
    await expect(recommended(page).getByRole("heading")).toBeInViewport();
  });
});

test.describe("먼저 볼 공고", () => {
  test("조건과 많이 맞은 공고부터 지금 낼 수 있는 순서로 3건 보여줍니다", async ({ page }) => {
    await page.goto("/?region=11&biz=retail");

    const items = recommended(page).getByRole("listitem");
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText("샘플 서울 소상공인 점포 환경개선 지원");
    await expect(items.nth(0)).toContainText("서울 · 도소매·음식");
    await expect(items.nth(1)).toContainText("샘플 소상공인 경영 바우처");
    await expect(items.nth(2)).toContainText("샘플 스마트상점 기술 보급");
  });

  test("누르면 상세 패널을 열고, 닫으면 초점을 보드의 같은 공고로 돌려줍니다", async ({ page }) => {
    await page.goto("/?region=11&biz=retail");

    await recommended(page).getByRole("button", { name: /샘플 서울 소상공인 점포 환경개선 지원/ }).click();
    const panel = page.getByRole("complementary");
    await expect(panel.getByRole("heading", { name: "샘플 서울 소상공인 점포 환경개선 지원" })).toBeVisible();

    await panel.getByRole("button", { name: /닫기/ }).click();
    await expect(
      page.getByRole("article").getByRole("button", { name: "샘플 서울 소상공인 점포 환경개선 지원", exact: true }),
    ).toBeFocused();
  });

  test("조건 없이 전체를 보면 고를 근거가 없어 보여주지 않습니다", async ({ page }) => {
    await page.getByRole("button", { name: "전체 지원사업 보기" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("전체 지원사업");
    await expect(recommended(page)).toHaveCount(0);
  });

  test("분명히 맞은 공고가 없으면 보여주지 않습니다", async ({ page }) => {
    await page.goto("/?region=36");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("지원사업");
    await expect(recommended(page)).toHaveCount(0);
  });
});
