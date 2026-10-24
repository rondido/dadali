// 달력 아래 공고 현황 칸반 (예시). src/data/sampleNotices.ts의 샘플 공고를 기준으로 검증합니다.
import { expect, test, type Page } from "@playwright/test";

function kanban(page: Page) {
  return page.getByRole("region", { name: /공고 현황/ });
}

function column(page: Page, title: string) {
  return kanban(page).getByRole("region", { name: title, exact: true });
}

function card(page: Page, title: string) {
  return kanban(page).getByRole("button", { name: new RegExp(title) });
}

// "+N건"으로 숨긴 일정을 빼고, 달력에 실제로 보이는 기간 막대만 고릅니다
// (여러 날에 걸친 막대는 FullCalendar가 늘 절대 위치로 그리므로 칩처럼 harness 클래스로 거를 수 없습니다)
function visiblePeriodBars(page: Page) {
  return page.locator(".fc-event.period").filter({ visible: true });
}

// 샘플 공고의 상태가 고르게 나뉘도록 브라우저 시계를 서울 기준 2026년 11월 10일 오전으로 고정합니다
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-10T09:00:00+09:00"));
  await page.goto("/");
});

test.describe("공고 현황 칸반", () => {
  test("달력 아래에 보입니다", async ({ page }) => {
    const calendarTop = (await page.locator(".fc").boundingBox())!.y;
    const kanbanTop = (await kanban(page).boundingBox())!.y;

    expect(kanbanTop).toBeGreaterThan(calendarTop);
  });

  test("진행 예정·진행 중·상시 세 열을 순서대로 보여주고 열마다 공고 수를 표시합니다", async ({ page }) => {
    await expect(kanban(page).getByRole("heading", { level: 3 })).toHaveText([
      /진행 예정\s*2건/,
      /진행 중\s*9건/,
      /상시\s*3건/,
    ]);
  });

  test("마감 7일 안의 공고도 진행 중 열 맨 앞에 D-day와 함께 보여줍니다", async ({ page }) => {
    const first = column(page, "진행 중").getByRole("listitem").first();

    await expect(first).toContainText("샘플 수출 바우처 추가 모집");
    await expect(first).toContainText("D-4");
  });

  test("마감된 공고는 칸반에 보여주지 않습니다", async ({ page }) => {
    await expect(kanban(page).getByText("샘플 지난 창업 교육")).toHaveCount(0);
  });

  test("진행 예정 열은 시작일이 빠른 공고부터 보여줍니다", async ({ page }) => {
    await expect(column(page, "진행 예정").getByRole("listitem")).toHaveText([
      /샘플 하루 접수 사업/,
      /샘플 공공 용역 입찰/,
    ]);
  });

  test.describe("상시", () => {
    test("날짜가 없는 상시 모집 공고를 공고명 순으로 모아 보여줍니다", async ({ page }) => {
      await expect(column(page, "상시").getByRole("listitem")).toHaveText([
        /샘플 상시 정책자금/,
        /샘플 창업 멘토링 상담/,
        /샘플 청년 마음건강 바우처/,
      ]);
    });

    test("상시 카드에는 날짜 대신 상시 아이콘과 상시 모집 표시를 보여줍니다", async ({ page }) => {
      const first = column(page, "상시").getByRole("listitem").first();

      await expect(first.locator('svg[data-icon="always"]')).toBeVisible();
      await expect(first).toContainText("상시 모집");
    });

    test("상시 카드는 달력에 그릴 기간이 없어 누를 수 없습니다", async ({ page }) => {
      await expect(column(page, "상시").getByRole("button")).toHaveCount(0);
    });
  });
});

test.describe("카드를 눌러 달력에 접수 기간 보기", () => {
  test("카드를 누르면 달력에 시작일부터 마감일까지 이어진 막대를 그립니다", async ({ page }) => {
    // 샘플 창업 사업화 지원 모집: 11월 2일 ~ 11월 20일 → 달력의 세 주에 걸쳐 막대 세 토막
    await card(page, "샘플 창업 사업화 지원 모집").click();

    const bars = visiblePeriodBars(page);
    await expect(bars).toHaveCount(3);
    await expect(bars.first()).toContainText("샘플 창업 사업화 지원 모집");

    // 첫 토막은 시작일(11/2) 칸 왼쪽에서, 마지막 토막은 마감일(11/20) 칸 오른쪽에서 끝납니다 (칸 안쪽 여백 몇 px 허용)
    const firstBar = (await bars.first().boundingBox())!;
    const lastBar = (await bars.last().boundingBox())!;
    const startCell = (await page.locator('td[data-date="2026-11-02"]').boundingBox())!;
    const endCell = (await page.locator('td[data-date="2026-11-20"]').boundingBox())!;
    expect(Math.abs(firstBar.x - startCell.x)).toBeLessThan(6);
    expect(Math.abs(lastBar.x + lastBar.width - (endCell.x + endCell.width))).toBeLessThan(6);
  });

  test("누른 카드는 선택 상태로 표시하고, 달력 위에 고른 공고와 기간을 알려줍니다", async ({ page }) => {
    const selected = card(page, "샘플 창업 사업화 지원 모집");
    await selected.click();

    await expect(selected).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status")).toContainText("샘플 창업 사업화 지원 모집");
    await expect(page.getByRole("status")).toContainText("11.02 ~ 11.20");
  });

  test("접수 시작일이 다른 달이면 달력을 그 달로 넘겨 보여줍니다", async ({ page }) => {
    // 샘플 어르신 돌봄 지원: 10월 21일 ~ 11월 27일
    await card(page, "샘플 어르신 돌봄 지원").click();

    await expect(page.locator(".fc-toolbar-title")).toHaveText("2026년 10월");
    await expect(page.locator('td[data-date="2026-10-21"]').locator(".fc-event.period")).toBeVisible();
  });

  test.describe("선택을 풀 때", () => {
    test("같은 카드를 다시 누르면 막대가 사라집니다", async ({ page }) => {
      const selected = card(page, "샘플 창업 사업화 지원 모집");
      await selected.click();
      await selected.click();

      await expect(page.locator(".fc-event.period")).toHaveCount(0);
      await expect(selected).toHaveAttribute("aria-pressed", "false");
    });

    test("선택 해제 버튼을 누르면 막대와 안내가 사라집니다", async ({ page }) => {
      await card(page, "샘플 창업 사업화 지원 모집").click();
      await page.getByRole("button", { name: "선택 해제" }).click();

      await expect(page.locator(".fc-event.period")).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveCount(0);
    });
  });
});
