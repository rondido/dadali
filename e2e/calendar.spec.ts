// 메인 월간 달력 (F01). src/data/sampleNotices.ts의 샘플 공고를 기준으로 검증합니다.
import { expect, test, type Page } from "@playwright/test";

function dayCell(page: Page, date: string) {
  return page.locator(`td.fc-daygrid-day[data-date="${date}"]`);
}

// FullCalendar는 "+N건"으로 숨긴 공고도 칸 안에 숨김 상태로 남겨 두므로, 보이는 공고만 고릅니다
const VISIBLE_CHIP = ".fc-daygrid-event-harness:not(.fc-daygrid-event-harness-abs) .chip";

// 샘플 공고가 몰린 2026년 11월을 보도록 브라우저 시계를 서울 기준 11월 10일 오전으로 고정합니다
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-10T09:00:00+09:00"));
  await page.goto("/");
});

test.describe("월간 달력", () => {
  test("오늘이 속한 달을 처음 화면으로 보여줍니다", async ({ page }) => {
    await expect(page.locator(".fc-toolbar-title")).toHaveText("2026년 11월");
  });

  test("공고는 접수 시작일과 마감일 칸에만 나타납니다", async ({ page }) => {
    await expect(dayCell(page, "2026-11-02").getByText("샘플 창업 사업화 지원 모집")).toBeVisible();
    await expect(dayCell(page, "2026-11-20").getByText("샘플 창업 사업화 지원 모집")).toBeVisible();
    await expect(dayCell(page, "2026-11-10").getByText("샘플 창업 사업화 지원 모집")).toHaveCount(0);
  });

  test("한 칸에 공고가 3건을 넘으면 3건만 보이고 나머지는 +N건으로 줄여 보여줍니다", async ({ page }) => {
    const cell = dayCell(page, "2026-11-20");

    await expect(cell.locator(VISIBLE_CHIP)).toHaveCount(3);
    await expect(cell.getByText("+2건")).toBeVisible();
  });

  test("같은 날짜에서는 마감 공고를 시작 공고보다 먼저, 같은 종류는 공고명 순으로 보여줍니다", async ({ page }) => {
    const chips = dayCell(page, "2026-11-20").locator(`${VISIBLE_CHIP} .chip-body`);

    await expect(chips).toHaveText([
      "마감샘플 소상공인 경영 바우처",
      "마감샘플 중소기업 수출 지원",
      "마감샘플 창업 사업화 지원 모집",
    ]);
  });

  test("+N건을 누르면 그날의 나머지 공고까지 모두 보여줍니다", async ({ page }) => {
    await dayCell(page, "2026-11-20").getByText("+2건").click();

    const popover = page.locator(".fc-popover");
    await expect(popover.getByText("샘플 청년 주거 지원")).toBeVisible();
    await expect(popover.getByText("샘플 공공 용역 입찰")).toBeVisible();
  });

  test("오늘 이전에 마감된 공고는 흐리게 표시합니다", async ({ page }) => {
    await expect(dayCell(page, "2026-11-05").locator(".chip")).toHaveClass(/chip-closed/);
    await expect(dayCell(page, "2026-11-20").locator(".chip").first()).not.toHaveClass(/chip-closed/);
  });

  test("상시 모집 공고는 달력 칸에 나타나지 않습니다", async ({ page }) => {
    await expect(page.locator(".fc").getByText("샘플 상시 정책자금")).toHaveCount(0);
  });
});

test.describe("색 표기와 안내", () => {
  function backgroundOf(page: Page, date: string) {
    return dayCell(page, date)
      .locator(VISIBLE_CHIP)
      .filter({ hasText: "샘플 창업 사업화 지원 모집" })
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  }

  test("마감일 칩은 분야의 진한 색, 시작일 칩은 같은 분야의 연한 색으로 구분합니다", async ({ page }) => {
    // 샘플 창업 사업화 지원 모집: 창업(C02), 11월 2일 시작 · 11월 20일 마감
    expect(await backgroundOf(page, "2026-11-20")).toBe("rgb(154, 66, 16)"); // --cat-2-fg
    expect(await backgroundOf(page, "2026-11-02")).toBe("rgb(252, 237, 227)"); // --cat-2-tint
  });

  test("마감일 칩에는 깃발 아이콘, 시작일 칩에는 시작 아이콘을 함께 보여줍니다", async ({ page }) => {
    const chipOf = (date: string) =>
      dayCell(page, date).locator(VISIBLE_CHIP).filter({ hasText: "샘플 창업 사업화 지원 모집" });

    await expect(chipOf("2026-11-20").locator('svg[data-icon="end"]')).toBeVisible();
    await expect(chipOf("2026-11-02").locator('svg[data-icon="start"]')).toBeVisible();
  });

  test("칩에는 시작·마감 글자 없이 아이콘과 공고명만 보입니다", async ({ page }) => {
    const chip = dayCell(page, "2026-11-20").locator(VISIBLE_CHIP).first();

    // 화면 낭독기용 글자는 남기되 화면에서는 차지하는 자리가 없어야 합니다
    const labelBox = await chip.locator(".chip-kind").boundingBox();
    expect(labelBox?.width ?? 0).toBeLessThanOrEqual(1);
  });

  test("달력 위에 분야별 색 안내와 진한 색·연한 색의 뜻을 보여줍니다", async ({ page }) => {
    const legend = page.getByRole("region", { name: "색 안내" });

    await expect(legend.getByRole("list", { name: "분야" }).getByRole("listitem")).toHaveText([
      "개인 혜택",
      "창업",
      "기업·소상공인",
      "공공사업",
    ]);
    await expect(legend.getByText("진한 색 마감일")).toBeVisible();
    await expect(legend.getByText("연한 색 시작일")).toBeVisible();

    const legendTop = (await legend.boundingBox())!.y;
    const calendarTop = (await page.locator(".fc").boundingBox())!.y;
    expect(legendTop).toBeLessThan(calendarTop);
  });
});

test.describe("공고가 많이 몰린 날 (2026-10-30, 12건)", () => {
  const BUSY_DAY = "2026-10-30";

  // 공고가 몰린 날이 있는 10월로 이동합니다
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: "이전달" }).click();
    await expect(page.locator(".fc-toolbar-title")).toHaveText("2026년 10월");
  });

  test("칸에는 3건만 보이고 나머지 9건은 +9건으로 줄여 보여줍니다", async ({ page }) => {
    const cell = dayCell(page, BUSY_DAY);

    await expect(cell.locator(VISIBLE_CHIP)).toHaveCount(3);
    await expect(cell.getByText("+9건")).toBeVisible();
  });

  test("공고가 많아도 칸 높이가 다른 칸과 크게 달라지지 않도록 3건까지만 쌓입니다", async ({ page }) => {
    const busyHeight = (await dayCell(page, BUSY_DAY).boundingBox())?.height ?? 0;
    const quietHeight = (await dayCell(page, "2026-10-28").boundingBox())?.height ?? 0;

    // 같은 주의 칸은 높이가 같다 (FullCalendar가 주 단위로 높이를 맞춤). 칸이 12건만큼 늘어나지 않았는지 확인합니다
    expect(busyHeight).toBe(quietHeight);
    expect(busyHeight).toBeLessThan(160);
  });

  test("+9건을 누르면 12건 모두를 마감 → 시작, 같은 종류는 공고명 순으로 보여줍니다", async ({ page }) => {
    await dayCell(page, BUSY_DAY).getByText("+9건").click();

    await expect(page.locator(".fc-popover .chip-body")).toHaveText([
      "마감샘플 관광 벤처 공모",
      "마감샘플 농식품 창업 지원",
      "마감샘플 디자인 바우처",
      "마감샘플 문화 콘텐츠 제작 지원",
      "마감샘플 스마트공장 지원",
      "마감샘플 신혼부부 전세 지원",
      "마감샘플 연구개발 과제 공모",
      "마감샘플 청년 창업 사관학교",
      "마감샘플 학교 급식 납품 입찰",
      "시작샘플 경력단절 재취업 지원",
      "시작샘플 물품 구매 입찰",
      "시작샘플 재창업 패키지",
    ]);
  });
});
