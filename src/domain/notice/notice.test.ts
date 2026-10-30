import { describe, expect, it, test } from "vitest";
import { isNoticeClosed } from "./notice";

describe("isNoticeClosed", () => {
  test.each([
    ["2026-11-19", true],
    ["2026-11-20", false],
    ["2026-11-21", false],
  ])("오늘이 2026-11-20이고 마감일이 %s이면 %s를 반환합니다", (applyEnd, expected) => {
    expect(isNoticeClosed({ applyEnd }, "2026-11-20")).toBe(expected);
  });

  it("마감일이 없는 공고는 마감되지 않은 것으로 보고 false를 반환합니다", () => {
    expect(isNoticeClosed({ applyEnd: null }, "2026-11-20")).toBe(false);
  });
});
