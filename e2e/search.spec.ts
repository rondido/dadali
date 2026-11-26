// 자유 입력 검색 (기획서 P01·P02, F01~F04, F07, F09). src/data/sampleNotices.ts와 dictionary.ts를 기준으로 검증합니다.
import { expect, test, type Page } from "@playwright/test";

const SCENARIO = "서울에서 카페 하는 32살인데 가게 인테리어 지원 있나요?";

async function searchFor(page: Page, text: string) {
  await page.getByRole("searchbox", { name: "내 상황" }).fill(text);
  await page.getByRole("button", { name: /지원사업 찾기|다시 찾기/ }).click();
}

function chips(page: Page) {
  return page.getByRole("list", { name: "검색 조건", exact: true }).getByRole("listitem");
}

function resultTitle(page: Page) {
  return page.getByRole("heading", { level: 1 });
}

// 샘플 공고의 상태가 고르게 나뉘도록 브라우저 시계를 서울 기준 2026년 11월 10일 오전으로 고정합니다
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-10T09:00:00+09:00"));
  await page.goto("/");
});

test.describe("입력 전 첫 화면", () => {
  test("입력창과 개인정보 안내, 예시 검색어만 보여줍니다", async ({ page }) => {
    await expect(page.getByRole("searchbox", { name: "내 상황" })).toBeVisible();
    await expect(page.getByText(/검색어는 저장하지 않아요/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
  });

  test("예시 검색어를 누르면 그 문장으로 찾고 검색창에 조건 칩과 목록이 붙습니다", async ({ page }) => {
    await page.getByRole("list", { name: "예시 검색어" }).getByRole("button", { name: "창업 지원금" }).click();

    await expect(chips(page)).toHaveText([/주제\s*창업/]);
    await expect(page.getByRole("region", { name: /^접수 중/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "혜택모아 첫 화면으로" })).toBeVisible();
  });

  test("입력 지우기 버튼은 글자를 적었을 때만 나타나고, 누르면 비운 뒤 입력창에 초점을 둡니다", async ({ page }) => {
    const box = page.getByRole("searchbox", { name: "내 상황" });
    await expect(page.getByRole("button", { name: "입력 지우기" })).toHaveCount(0);

    await box.fill("창업");
    await page.getByRole("button", { name: "입력 지우기" }).click();

    await expect(box).toHaveValue("");
    await expect(box).toBeFocused();
  });

  test("전체 지원사업 보기를 누르면 조건 없이 전체 목록을 엽니다", async ({ page }) => {
    await page.getByRole("button", { name: "전체 지원사업 보기" }).click();

    await expect(page).toHaveURL(/all=1/);
    await expect(resultTitle(page)).toContainText("전체 지원사업");
    await expect(page.getByRole("region", { name: /^접수 중/ }).getByRole("heading", { level: 2 })).toContainText("11");
  });
});

test.describe("대표 시나리오 검색", () => {
  test.beforeEach(async ({ page }) => {
    await searchFor(page, SCENARIO);
  });

  test("문장에서 찾은 조건을 칩으로 보여주고 주소에 조건만 담습니다", async ({ page }) => {
    await expect(chips(page)).toHaveText([/지역\s*서울/, /나이대\s*청년/, /하는 일\s*도소매·음식/, /주제\s*시설·인테리어/]);
    await expect(page).toHaveURL(/\?region=11&age=youth&biz=retail&topic=facility$/);
  });

  test("조건에 맞을 수 있는 공고 수와 대상 조건 레이블을 보여주고, 내 조건과 맞은 레이블을 표시합니다", async ({ page }) => {
    await expect(resultTitle(page)).toHaveText("조건에 맞을 수 있는 지원사업 2건");

    const card = page.getByRole("article").filter({ hasText: "샘플 서울 소상공인 점포 환경개선 지원" });
    await expect(card).toContainText("D-1");
    const matched = card.getByRole("list", { name: "대상 조건" }).locator("[data-matched]");
    await expect(matched.filter({ hasText: "서울" })).toHaveCount(1);
    await expect(matched.filter({ hasText: "시설·인테리어" })).toHaveCount(1);
  });

  test("대상을 정하지 않아 통과한 전국 레이블은 맞음으로 표시하지 않습니다", async ({ page }) => {
    const card = page.getByRole("article").filter({ hasText: "샘플 스마트상점 기술 보급" });
    const labels = card.getByRole("list", { name: "대상 조건" });

    await expect(labels).toContainText("전국");
    await expect(labels.locator("[data-matched]").filter({ hasText: "도소매·음식" })).toHaveCount(1);
    await expect(labels.locator("[data-matched]").filter({ hasText: "전국" })).toHaveCount(0);
  });

  test("칩의 ×를 누르면 그 조건을 빼고 바로 다시 거릅니다", async ({ page }) => {
    await page.getByRole("button", { name: "시설·인테리어 조건 빼기" }).click();

    await expect(chips(page)).toHaveCount(3);
    await expect(page).not.toHaveURL(/topic=/);
    await expect(resultTitle(page)).toHaveText("조건에 맞을 수 있는 지원사업 12건");
  });

  test("칩을 빼면 토스트로 알리고, 되돌리기를 누르면 그 조건을 다시 넣습니다", async ({ page }) => {
    await page.getByRole("button", { name: "시설·인테리어 조건 빼기" }).click();

    const toast = page.getByRole("status").filter({ hasText: "시설·인테리어 조건을 뺐어요" });
    await expect(toast).toBeVisible();
    await toast.getByRole("button", { name: "되돌리기" }).click();

    await expect(chips(page)).toHaveCount(4);
    await expect(page).toHaveURL(/topic=facility/);
  });

  test("다시 방문하면 첫 화면을 건너뛰고 저장된 조건으로 보드를 엽니다", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/region=11/);
    await expect(chips(page)).toHaveCount(4);
  });

  test("혜택모아를 누르면 저장된 조건을 지우고 첫 화면으로 돌아갑니다", async ({ page }) => {
    await page.getByRole("link", { name: "혜택모아 첫 화면으로" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "지원사업 찾기" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("저장된 조건을 지웠어요");

    // 다시 들어와도 저장된 조건으로 보드가 열리지 않습니다
    await page.goto("/");
    await expect(page.getByRole("button", { name: "지원사업 찾기" })).toBeVisible();
  });

});

test("전체 지원사업 보기에서 혜택모아를 누르면 첫 화면으로 돌아갑니다", async ({ page }) => {
  await page.getByRole("button", { name: "전체 지원사업 보기" }).click();
  await expect(resultTitle(page)).toContainText("전체 지원사업");

  await page.getByRole("link", { name: "혜택모아 첫 화면으로" }).click();

  await expect(page.getByRole("button", { name: "지원사업 찾기" })).toBeVisible();
});

test("창업 지원금을 검색하면 관심 주제로 거릅니다", async ({ page }) => {
  await searchFor(page, "창업 지원금");

  await expect(chips(page)).toHaveText([/주제\s*창업/]);
});

test("뜻이 둘인 지명은 다른 후보를 골라 바꿀 수 있습니다", async ({ page }) => {
  await searchFor(page, "광주에서 창업");

  await expect(chips(page).first()).toHaveText(/지역\s*광주/);
  await page.getByRole("button", { name: "경기", exact: true }).click();

  await expect(chips(page).first()).toHaveText(/지역\s*경기/);
});

test("+ 조건 추가로 지역을 직접 고를 수 있습니다", async ({ page }) => {
  await searchFor(page, "창업 지원금");
  await page.getByRole("button", { name: "+ 조건 추가" }).click();
  const dialog = page.getByRole("dialog", { name: "조건 추가" });
  await dialog.getByRole("button", { name: "부산", exact: true }).click();

  // 창을 닫지 않고 바로 칩이 바뀌고, 고른 값은 눌린 상태로 보인다
  await expect(chips(page).first()).toHaveText(/지역\s*부산/);
  await expect(dialog.getByRole("button", { name: "부산", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "+ 조건 추가" })).toBeFocused();
});

test("+ 조건 추가에서 시·도를 고르면 그 시·군·구도 고를 수 있습니다", async ({ page }) => {
  await searchFor(page, "창업 지원금");
  await page.getByRole("button", { name: "+ 조건 추가" }).click();
  const dialog = page.getByRole("dialog", { name: "조건 추가" });

  // 시·도를 고르기 전에는 시·군·구 줄이 없습니다
  await expect(dialog.getByRole("list", { name: "서울 시·군·구" })).toHaveCount(0);
  await dialog.getByRole("button", { name: "서울", exact: true }).click();
  const districts = dialog.getByRole("list", { name: "서울 시·군·구" });
  await districts.getByRole("button", { name: "마포구" }).click();

  await expect(chips(page).first()).toHaveText(/지역\s*서울 마포구/);

  // 다시 누르면 시·군·구만 빼고 시·도는 남깁니다
  await districts.getByRole("button", { name: "마포구" }).click();
  await expect(chips(page).first()).not.toHaveText(/마포구/);
  await expect(chips(page).first()).toHaveText(/지역\s*서울/);

  // 창을 닫으면 주소에 시·군·구가 담깁니다 (창이 열려 있는 동안은 요청을 모아 둡니다)
  await districts.getByRole("button", { name: "마포구" }).click();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/gu=%EB%A7%88%ED%8F%AC%EA%B5%AC/);
});

test.describe("조건으로 바꾸지 못한 단어", () => {
  test("공고명이나 지원 내용에 있으면 그 단어로 찾아 줍니다", async ({ page }) => {
    await searchFor(page, "복직 준비");

    await expect(page.getByText("'복직'이 들어간 공고만 보여요")).toBeVisible();
    await expect(resultTitle(page)).toHaveText("조건에 맞을 수 있는 지원사업 1건");
  });

  test("어디에도 없으면 이해하지 못했다고 알려 줍니다", async ({ page }) => {
    await searchFor(page, "고양이 카페");

    await expect(page.getByText(/'고양이'는 조건으로 찾지 못했어요/)).toBeVisible();
  });
});
