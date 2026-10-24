import { describe, expect, it, test } from "vitest";
import type { NoticeSchedule } from "./noticeMarkers";
import { formatDDay, noticeStatusOf } from "./noticeStatus";

// 테스트마다 달라지는 값만 넘기고, 나머지는 판단에 영향이 없는 기본값으로 채웁니다
function scheduleOf(overrides: Partial<NoticeSchedule>): NoticeSchedule {
  return {
    id: "n1",
    title: "공고",
    categoryId: "C02",
    applyStart: null,
    applyEnd: null,
    isAlways: false,
    ...overrides,
  };
}

const TODAY = "2026-11-10";

describe("noticeStatusOf", () => {
  it("상시 모집 공고는 날짜와 상관없이 always를 반환합니다", () => {
    const notice = scheduleOf({ applyEnd: "2026-11-01", isAlways: true });

    expect(noticeStatusOf(notice, TODAY)).toBe("always");
  });

  it("접수 시작일이 오늘보다 뒤이면 upcoming을 반환합니다", () => {
    const notice = scheduleOf({ applyStart: "2026-11-11", applyEnd: "2026-11-12" });

    expect(noticeStatusOf(notice, TODAY)).toBe("upcoming");
  });

  it("마감일이 오늘보다 앞이면 closed를 반환합니다", () => {
    const notice = scheduleOf({ applyStart: "2026-11-01", applyEnd: "2026-11-09" });

    expect(noticeStatusOf(notice, TODAY)).toBe("closed");
  });

  describe("접수 중인 공고일 때", () => {
    test.each([
      ["2026-11-10", "closing"],
      ["2026-11-17", "closing"],
      ["2026-11-18", "open"],
    ])("마감일이 %s이면 %s를 반환합니다 (마감 7일 전부터 closing)", (applyEnd, expected) => {
      const notice = scheduleOf({ applyStart: "2026-11-01", applyEnd });

      expect(noticeStatusOf(notice, TODAY)).toBe(expected);
    });

    it("마감일이 없으면 open을 반환합니다", () => {
      const notice = scheduleOf({ applyStart: "2026-11-01" });

      expect(noticeStatusOf(notice, TODAY)).toBe("open");
    });
  });
});

describe("formatDDay", () => {
  test.each([
    [0, "D-day"],
    [4, "D-4"],
  ])("남은 날이 %i일이면 %s를 반환합니다", (days, expected) => {
    expect(formatDDay(days)).toBe(expected);
  });
});
