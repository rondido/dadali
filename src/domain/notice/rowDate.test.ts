import { describe, expect, it } from "vitest";
import type { NoticeSchedule } from "./notice";
import { rowDateOf } from "./rowDate";

function scheduleOf(applyStart: string | null, applyEnd: string | null, isAlways = false): NoticeSchedule {
  return { id: "n", title: "공고", categoryId: "C02", applyStart, applyEnd, isAlways };
}

describe("목록 줄의 실제 날짜", () => {
  it("접수 중이면 마감일을 보여줍니다 (마감 임박도 같습니다)", () => {
    expect(rowDateOf(scheduleOf("2026-11-01", "2026-12-01"), "open")).toBe("12.01 마감");
    expect(rowDateOf(scheduleOf("2026-11-01", "2026-11-22"), "closing")).toBe("11.22 마감");
  });

  it("접수 예정이면 시작일부터 마감일까지 기간을 보여줍니다", () => {
    expect(rowDateOf(scheduleOf("2026-11-22", "2026-12-05"), "upcoming")).toBe("11.22 ~ 12.05");
    expect(rowDateOf(scheduleOf("2026-11-22", null), "upcoming")).toBe("11.22 시작");
  });

  it("상시이거나 날짜가 없으면 보여주지 않습니다", () => {
    expect(rowDateOf(scheduleOf(null, null, true), "always")).toBeNull();
    expect(rowDateOf(scheduleOf("2026-11-01", null), "open")).toBeNull();
  });

  it("마감된 공고(최근 본 목록)는 마감일을 보여줍니다", () => {
    expect(rowDateOf(scheduleOf("2026-10-01", "2026-10-31"), "closed")).toBe("10.31 마감");
  });
});
