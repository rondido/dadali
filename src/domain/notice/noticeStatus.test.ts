import { describe, expect, it, test } from "vitest";
import type { NoticeSchedule } from "./notice";
import {
  closingThisWeek,
  formatDDay,
  formatStartsIn,
  noticeStatusOf,
  periodProgressOf,
  summarizeNotices,
} from "./noticeStatus";

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
    [0, "오늘 마감"],
    [4, "D-4"],
  ])("남은 날이 %i일이면 %s를 반환합니다", (days, expected) => {
    expect(formatDDay(days)).toBe(expected);
  });
});

describe("formatStartsIn", () => {
  test.each([
    [1, "내일 시작"],
    [3, "3일 후 시작"],
  ])("시작까지 %i일 남았으면 %s를 반환합니다", (days, expected) => {
    expect(formatStartsIn(days)).toBe(expected);
  });
});

describe("periodProgressOf", () => {
  test.each([
    ["2026-11-07", { day: 4, total: 15 }],
    ["2026-11-10", { day: 1, total: 12 }],
  ])("시작일이 %s이고 마감일이 2026-11-21이면 %o를 반환합니다", (applyStart, expected) => {
    const notice = scheduleOf({ applyStart, applyEnd: "2026-11-21" });

    expect(periodProgressOf(notice, TODAY)).toEqual(expected);
  });

  it("접수 시작 전인 공고는 null을 반환합니다", () => {
    const notice = scheduleOf({ applyStart: "2026-11-11", applyEnd: "2026-11-21" });

    expect(periodProgressOf(notice, TODAY)).toBeNull();
  });

  it("시작일이나 마감일이 없으면 null을 반환합니다", () => {
    expect(periodProgressOf(scheduleOf({ applyEnd: "2026-11-21" }), TODAY)).toBeNull();
  });
});

describe("summarizeNotices", () => {
  it("진행 중, 7일 안 마감, 7일 안 시작 공고 수를 셉니다", () => {
    const notices = [
      scheduleOf({ applyStart: "2026-11-01", applyEnd: "2026-11-30" }),
      scheduleOf({ applyStart: "2026-11-01", applyEnd: "2026-11-14" }),
      scheduleOf({ applyStart: "2026-11-17", applyEnd: "2026-11-30" }),
      scheduleOf({ applyStart: "2026-11-18", applyEnd: "2026-11-30" }),
      scheduleOf({ applyStart: "2026-11-01", applyEnd: "2026-11-05" }),
      scheduleOf({ isAlways: true }),
    ];

    expect(summarizeNotices(notices, TODAY)).toEqual({ ongoing: 2, closingThisWeek: 1, startingSoon: 1 });
  });
});

describe("closingThisWeek", () => {
  it("7일 안에 마감하는 공고만 마감 빠른 순으로 반환합니다", () => {
    const notices = [
      scheduleOf({ id: "later", applyStart: "2026-11-01", applyEnd: "2026-11-16" }),
      scheduleOf({ id: "open", applyStart: "2026-11-01", applyEnd: "2026-11-30" }),
      scheduleOf({ id: "sooner", applyStart: "2026-11-01", applyEnd: "2026-11-12" }),
    ];

    expect(closingThisWeek(notices, TODAY).map((n) => n.id)).toEqual(["sooner", "later"]);
  });
});
