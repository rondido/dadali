import { describe, expect, it } from "vitest";
import { formatMonthDay, toPeriodCalendar, type CalendarDay, type PeriodCalendarBlock } from "./periodCalendar";

function monthKeys(blocks: PeriodCalendarBlock[]): string[] {
  return blocks.map((b) => (b.kind === "month" ? b.month.key : `gap:${b.weeks}`));
}

function daysOf(blocks: PeriodCalendarBlock[]): CalendarDay[] {
  return blocks.flatMap((b) => (b.kind === "month" ? b.month.weeks.flat() : []));
}

function dayAt(blocks: PeriodCalendarBlock[], date: string): CalendarDay {
  return daysOf(blocks).find((d) => d.date === date && d.inMonth)!;
}

describe("toPeriodCalendar", () => {
  describe("보여줄 달", () => {
    it("기간이 한 달 안이면 그 달 하나만 보여줍니다", () => {
      expect(monthKeys(toPeriodCalendar("2026-11-02", "2026-11-20", "2026-11-10"))).toEqual(["2026-11"]);
    });

    it("기간이 두 달에 걸치면 두 달을 모두 보여줍니다", () => {
      expect(monthKeys(toPeriodCalendar("2026-10-28", "2026-11-11", "2026-11-10"))).toEqual(["2026-10", "2026-11"]);
    });

    it("기간이 세 달 이상이면 시작·마감 달만 보여주고 사이를 주 단위로 접습니다", () => {
      // 11월·12월 61일 → 약 9주
      expect(monthKeys(toPeriodCalendar("2026-10-28", "2027-01-15", "2026-11-10"))).toEqual([
        "2026-10",
        "gap:9",
        "2027-01",
      ]);
    });
  });

  it("주는 일요일부터 시작하고 앞뒤 달 날짜는 이 달 날짜가 아닌 것으로 표시합니다", () => {
    // 2026년 11월 1일은 일요일, 11월 30일은 월요일
    const [block] = toPeriodCalendar("2026-11-02", "2026-11-20", "2026-11-10");
    const weeks = block.kind === "month" ? block.month.weeks : [];

    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toMatchObject({ date: "2026-11-01", inMonth: true });
    expect(weeks[4][3]).toMatchObject({ date: "2026-12-02", inMonth: false, inPeriod: false });
  });

  describe("접수 기간 표시", () => {
    const blocks = toPeriodCalendar("2026-11-02", "2026-11-20", "2026-11-10");

    it("시작일과 마감일을 표시합니다", () => {
      expect(dayAt(blocks, "2026-11-02")).toMatchObject({ isStart: true, inPeriod: true });
      expect(dayAt(blocks, "2026-11-20")).toMatchObject({ isEnd: true, inPeriod: true });
    });

    it("오늘 전의 기간은 지난 날로, 오늘부터는 남은 날로 표시합니다", () => {
      expect(dayAt(blocks, "2026-11-09")).toMatchObject({ inPeriod: true, elapsed: true });
      expect(dayAt(blocks, "2026-11-10")).toMatchObject({ inPeriod: true, elapsed: false, isToday: true });
    });

    it("기간 밖의 날은 기간으로 표시하지 않습니다", () => {
      expect(dayAt(blocks, "2026-11-01").inPeriod).toBe(false);
      expect(dayAt(blocks, "2026-11-21").inPeriod).toBe(false);
    });
  });
});

describe("formatMonthDay", () => {
  it('"2026-10-28"을 "10월 28일"로 바꿉니다', () => {
    expect(formatMonthDay("2026-10-28")).toBe("10월 28일");
  });
});
