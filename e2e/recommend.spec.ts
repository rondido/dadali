// 결과 화면의 선택형 찾기와 "먼저 보기" 표시. src/data/sampleNotices.ts를 기준으로 검증합니다.
import { expect, test, type Page } from "@playwright/test";

function picker(page: Page) {
  return page.getByRole("region", { name: "직접 골라서 찾기" });
}

function recommendedCards(page: Page) {
  return page.getByRole("article").filter({ hasText: "먼저 보기" });
}

async function pick(page: Page, ...labels: string[]) {
  for (const label of labels) {
    await picker(page).getByRole("button", { name: label, exact: true }).click();
  }
}

async function searchFor(page: Page, text: string) {
  await page.getByRole("searchbox", { name: "내 상황" }).fill(text);
  await page.getByRole("button", { name: /지원사업 찾기|다시 찾기/ }).click();
}

// 샘플 공고의 상태가 고르게 나뉘도록 브라우저 시계를 서울 기준 2026년 11월 10일 오전으로 고정합니다
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-10T09:00:00+09:00"));
  await page.goto("/");
});

test.describe("문장에서 조건을 하나도 찾지 못했을 때", () => {
  test.beforeEach(async ({ page }) => {
    await searchFor(page, "고양이 좋아요");
  });

  test("직접 골라서 찾는 선택지를 펼치고, 고르기 전에는 찾기 버튼을 누를 수 없습니다", async ({ page }) => {
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

  test("찾기를 누르면 고른 조건이 칩과 주소에 담기고 선택지는 닫힙니다", async ({ page }) => {
    await pick(page, "서울", "도소매·음식");
    await picker(page).getByRole("button", { name: /건 보기/ }).click();

    await expect(page.getByRole("list", { name: "검색 조건", exact: true }).getByRole("listitem")).toHaveText([
      /지역\s*서울/,
      /하는 일\s*도소매·음식/,
    ]);
    await expect(page).toHaveURL(/\?region=11&biz=retail$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("조건에 맞을 수 있는 지원사업 15건");
    await expect(picker(page)).toHaveCount(0);
  });
});

test("문장에서 조건을 찾으면 선택지를 펼치지 않습니다", async ({ page }) => {
  await searchFor(page, "서울 카페 인테리어");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("조건에 맞을 수 있는");
  await expect(picker(page)).toHaveCount(0);
});

test.describe("먼저 보기", () => {
  test("조건과 분명히 맞은 공고 3건의 보드 카드에 표시합니다", async ({ page }) => {
    await page.goto("/?region=11&biz=retail");

    await expect(recommendedCards(page)).toHaveCount(3);
    await expect(recommendedCards(page).filter({ hasText: "샘플 서울 소상공인 점포 환경개선 지원" })).toHaveCount(1);
    await expect(recommendedCards(page).filter({ hasText: "샘플 소상공인 경영 바우처" })).toHaveCount(1);
    await expect(recommendedCards(page).filter({ hasText: "샘플 스마트상점 기술 보급" })).toHaveCount(1);
  });

  test("조건 없이 전체를 보면 고를 근거가 없어 표시하지 않습니다", async ({ page }) => {
    await page.getByRole("button", { name: "전체 지원사업 보기" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("전체 지원사업");
    await expect(recommendedCards(page)).toHaveCount(0);
  });

  test("분명히 맞은 공고가 없으면 표시하지 않습니다", async ({ page }) => {
    await page.goto("/?region=36");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("지원사업");
    await expect(recommendedCards(page)).toHaveCount(0);
  });
});

test.describe("보드 공간", () => {
  test("PC에서는 검색·칩·건수를 줄여 보드가 화면의 위쪽 3분의 1 안에서 시작합니다", async ({ page }) => {
    await page.goto("/?region=11&biz=retail");

    const board = (await page.getByRole("region", { name: "진행 중", exact: true }).boundingBox())!;
    expect(board.y).toBeLessThan(page.viewportSize()!.height / 3);
  });

  test.describe("모바일", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("첫 공고 카드가 화면 위쪽 절반 안에서 시작합니다", async ({ page }) => {
      await page.goto("/?region=11&biz=retail");

      const card = (await page.getByRole("article").first().boundingBox())!;
      expect(card.y).toBeLessThan(844 / 2);
    });
  });

  test.describe("태블릿", () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test("패널을 보드 위에 겹쳐 열어 보드 열이 좁아지지 않습니다", async ({ page }) => {
      await page.goto("/?all=1");
      const column = page.getByRole("region", { name: "진행 중", exact: true });
      const before = (await column.boundingBox())!.width;

      await page.goto("/?all=1&notice=s25");
      await expect(page.getByRole("complementary")).toBeVisible();

      expect((await column.boundingBox())!.width).toBeCloseTo(before, 0);
    });
  });
});
