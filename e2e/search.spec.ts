// 자유 입력 검색 (기획서 P01·P02, F01~F04, F07, F09). src/data/sampleNotices.ts와 sampleDictionary.ts를 기준으로 검증합니다.
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
  test("입력창과 저장하지 않는다는 고지, 예시 문장 4개를 보여줍니다", async ({ page }) => {
    await expect(page.getByRole("searchbox", { name: "내 상황" })).toBeVisible();
    await expect(page.getByText("입력한 문장은 조건을 찾는 데만 쓰고 저장하지 않아요.")).toBeVisible();
    await expect(page.getByRole("button", { name: SCENARIO })).toBeVisible();
    await expect(page.getByRole("button", { name: "창업 지원금" })).toBeVisible();
  });

  test("진행 중·이번 주 마감 건수와 마감이 가까운 카드를 보여줍니다", async ({ page }) => {
    const closing = page.getByRole("region", { name: /이번 주 마감/ });

    await expect(closing).toContainText("지금 전국에서 진행 중 11건 · 이번 주 마감 2건");
    await expect(closing.getByRole("article")).toHaveCount(2);
    await expect(closing.getByRole("article").first()).toContainText("샘플 서울 소상공인 점포 환경개선 지원");
  });
});

test.describe("대표 시나리오 검색", () => {
  test.beforeEach(async ({ page }) => {
    await searchFor(page, SCENARIO);
  });

  test("문장에서 찾은 조건을 칩으로 보여주고 주소에 조건만 담습니다", async ({ page }) => {
    await expect(chips(page)).toHaveText([/지역\s*서울/, /나이대\s*청년/, /하는 일\s*도소매·음식/, /관심\s*시설·인테리어/]);
    await expect(page).toHaveURL(/\?region=11&age=youth&biz=retail&topic=facility$/);
  });

  test("조건에 맞을 수 있는 공고 수와 왜 걸렸는지 태그를 보여줍니다", async ({ page }) => {
    await expect(resultTitle(page)).toHaveText("조건에 맞을 수 있는 지원사업 2건");

    const card = page.getByRole("article").filter({ hasText: "샘플 서울 소상공인 점포 환경개선 지원" });
    await expect(card).toContainText("D-1");
    await expect(card.getByRole("list", { name: "검색 조건과 맞은 부분" })).toHaveText(/서울.*시설·인테리어/);
  });

  test("칩의 ×를 누르면 그 조건을 빼고 바로 다시 거릅니다", async ({ page }) => {
    await page.getByRole("button", { name: "시설·인테리어 조건 빼기" }).click();

    await expect(chips(page)).toHaveCount(3);
    await expect(page).not.toHaveURL(/topic=/);
    await expect(resultTitle(page)).toHaveText("조건에 맞을 수 있는 지원사업 12건");
  });

  test("다시 방문하면 첫 화면을 건너뛰고 저장된 조건으로 보드를 엽니다", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/region=11/);
    await expect(chips(page)).toHaveCount(4);
  });

  test("처음부터 새로 찾으면 저장된 조건을 지우고 첫 화면으로 돌아갑니다", async ({ page }) => {
    await page.getByRole("button", { name: "처음부터 새로 찾기" }).click();
    await page.goto("/");

    await expect(page.getByRole("button", { name: "지원사업 찾기" })).toBeVisible();
  });
});

test("예시 문장을 누르면 바로 검색합니다", async ({ page }) => {
  await page.getByRole("button", { name: "창업 지원금" }).click();

  await expect(chips(page)).toHaveText([/관심\s*창업/]);
});

test("뜻이 둘인 지명은 다른 후보를 골라 바꿀 수 있습니다", async ({ page }) => {
  await searchFor(page, "광주에서 창업");

  await expect(chips(page).first()).toHaveText(/지역\s*광주/);
  await page.getByRole("button", { name: "경기", exact: true }).click();

  await expect(chips(page).first()).toHaveText(/지역\s*경기/);
});

test("+ 조건 추가로 지역을 직접 고를 수 있습니다", async ({ page }) => {
  await page.getByRole("button", { name: "창업 지원금" }).click();
  await page.getByRole("button", { name: "+ 조건 추가" }).click();
  await page.getByRole("combobox", { name: /지역/ }).selectOption({ label: "부산" });

  await expect(chips(page).first()).toHaveText(/지역\s*부산/);
});

test.describe("조건으로 바꾸지 못한 단어", () => {
  test("공고명이나 지원 내용에 있으면 그 단어로 찾아 줍니다", async ({ page }) => {
    await searchFor(page, "복직 준비");

    await expect(page.getByText("'복직'는 공고명과 지원 내용에서 찾았어요.")).toBeVisible();
    await expect(resultTitle(page)).toHaveText("조건에 맞을 수 있는 지원사업 1건");
  });

  test("어디에도 없으면 이해하지 못했다고 알려 줍니다", async ({ page }) => {
    await searchFor(page, "고양이 카페");

    await expect(page.getByText(/'고양이'는 이해하지 못했어요/)).toBeVisible();
  });
});
