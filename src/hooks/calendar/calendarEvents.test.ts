import { describe, expect, it } from "vitest";
import type { NoticeSchedule } from "@/domain/notice/noticeMarkers";
import { toCalendarEvents, toPeriodEvent } from "./calendarEvents";

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

describe("toCalendarEvents", () => {
  it("공고 하나를 시작일과 마감일의 하루짜리 일정 두 개로 바꿉니다", () => {
    const notice = scheduleOf({ id: "n1", applyStart: "2026-11-06", applyEnd: "2026-11-20" });

    const events = toCalendarEvents([notice], TODAY);

    expect(events.map((e) => [e.id, e.start, e.allDay])).toEqual([
      ["n1:start", "2026-11-06", true],
      ["n1:end", "2026-11-20", true],
    ]);
  });

  it("상시 모집 공고는 일정으로 만들지 않습니다", () => {
    const notice = scheduleOf({ applyEnd: "2026-11-20", isAlways: true });

    expect(toCalendarEvents([notice], TODAY)).toEqual([]);
  });

  it("분류 ID를 분야 색 클래스로 바꿔 붙입니다", () => {
    const notice = scheduleOf({ categoryId: "C03", applyEnd: "2026-11-20" });

    const [event] = toCalendarEvents([notice], TODAY);

    expect(event.classNames).toContain("chip-cat-3");
  });

  describe("마감 여부에 따라", () => {
    it("오늘 이전에 마감된 공고는 시작·마감 일정 모두 흐리게 표시합니다", () => {
      const notice = scheduleOf({ applyStart: "2026-11-01", applyEnd: "2026-11-09" });

      const events = toCalendarEvents([notice], TODAY);

      expect(events.map((e) => e.classNames)).toEqual([
        expect.arrayContaining(["chip-closed"]),
        expect.arrayContaining(["chip-closed"]),
      ]);
    });

    it("오늘 마감되는 공고는 흐리게 표시하지 않습니다", () => {
      const notice = scheduleOf({ applyEnd: TODAY });

      const [event] = toCalendarEvents([notice], TODAY);

      expect(event.classNames).not.toContain("chip-closed");
    });
  });

  it("한 날짜에 공고가 칸 표시 한도(3건)보다 많아도 모든 공고를 빠짐없이 일정으로 만듭니다", () => {
    const notices = Array.from({ length: 12 }, (_, i) => scheduleOf({ id: `n${i}`, applyEnd: "2026-10-30" }));

    const events = toCalendarEvents(notices, TODAY);

    expect(events).toHaveLength(12);
    expect(new Set(events.map((e) => e.extendedProps.order)).size).toBe(12);
  });

  it("같은 날짜에서는 마감 → 시작, 같은 종류는 공고명 순으로 표시 순서를 매깁니다", () => {
    const notices = [
      scheduleOf({ id: "a", title: "가 공고", applyStart: "2026-11-20", applyEnd: "2026-11-30" }),
      scheduleOf({ id: "c", title: "다 공고", applyEnd: "2026-11-20" }),
      scheduleOf({ id: "b", title: "나 공고", applyEnd: "2026-11-20" }),
    ];

    const sameDay = toCalendarEvents(notices, TODAY)
      .filter((e) => e.start === "2026-11-20")
      .sort((x, y) => x.extendedProps.order - y.extendedProps.order);

    expect(sameDay.map((e) => e.id)).toEqual(["b:end", "c:end", "a:start"]);
  });
});

describe("toPeriodEvent", () => {
  describe("시작일과 마감일이 모두 있을 때", () => {
    it("시작일부터 마감일까지 이어지는 막대 일정을 만듭니다 (FullCalendar의 end는 마지막 날 다음 날)", () => {
      const notice = scheduleOf({ id: "n1", applyStart: "2026-11-02", applyEnd: "2026-11-20" });

      const event = toPeriodEvent(notice);

      expect(event).toMatchObject({ id: "n1:period", start: "2026-11-02", end: "2026-11-21", allDay: true });
    });

    it("같은 날짜의 시작·마감 칩보다 먼저 보이도록 가장 앞 순서를 매깁니다", () => {
      const notice = scheduleOf({ applyStart: "2026-11-02", applyEnd: "2026-11-20" });

      expect(toPeriodEvent(notice)?.extendedProps.order).toBe(-1);
    });

    it("분야 색 클래스를 붙입니다", () => {
      const notice = scheduleOf({ categoryId: "C03", applyStart: "2026-11-02", applyEnd: "2026-11-20" });

      expect(toPeriodEvent(notice)?.classNames).toEqual(["period", "chip-cat-3"]);
    });
  });

  describe("기간을 그릴 수 없을 때", () => {
    it("상시 모집 공고는 null을 반환합니다", () => {
      expect(toPeriodEvent(scheduleOf({ isAlways: true }))).toBeNull();
    });

    it("시작일이나 마감일이 없으면 null을 반환합니다", () => {
      expect(toPeriodEvent(scheduleOf({ applyEnd: "2026-11-20" }))).toBeNull();
    });
  });
});
