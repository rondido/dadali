import { describe, expect, it, test } from "vitest";
import { parseApplyPeriod, parseCompactDate } from "./dates";

describe("parseCompactDate", () => {
  test.each([
    ["20261123", "2026-11-23"],
    ["20260230", null],
    ["2026-11-23", null],
    ["", null],
    [undefined, null],
  ])("%s를 %s로 바꿉니다", (value, expected) => {
    expect(parseCompactDate(value)).toBe(expected);
  });
});

describe("parseApplyPeriod", () => {
  // 행안부 신청기한에서 실제로 본 표기들입니다
  test.each([
    ["2026.1.19. ~ 2026.1.30.(추가모집 별도 진행 *문의 요망)", "2026-01-19", "2026-01-30"],
    ["2026. 2. 1. ~ 2026. 11. 30.", "2026-02-01", "2026-11-30"],
    ["2026.02.02~2026.08.31", "2026-02-02", "2026-08-31"],
    ["2026.10.12. ~ 2027.2.26. (백신 소진 시 사업 종료)", "2026-10-12", "2027-02-26"],
    ["2026년 3월 2일 ~ 2026년 6월 30일", "2026-03-02", "2026-06-30"],
  ])("기간 '%s'를 %s부터 %s까지로 읽습니다", (text, start, end) => {
    expect(parseApplyPeriod(text)).toEqual({ kind: "range", start, end });
  });

  it("끝 날짜에 연도가 없으면 시작 연도를 씁니다", () => {
    expect(parseApplyPeriod("2026. 1. 1. ~ 12. 31.(예산소진 시 종료)")).toEqual({
      kind: "range",
      start: "2026-01-01",
      end: "2026-12-31",
    });
  });

  it("연도 없는 끝 날짜가 시작보다 앞이면 다음 해로 봅니다", () => {
    expect(parseApplyPeriod("2026.11.1 ~ 2.28")).toEqual({ kind: "range", start: "2026-11-01", end: "2027-02-28" });
  });

  it("'까지'만 있으면 마감일만 읽습니다", () => {
    expect(parseApplyPeriod("2026.3.31.까지 신청")).toEqual({ kind: "until", end: "2026-03-31" });
  });

  test.each(["연중", "별도 공고기한내", "수시", "연초 모집공고에 따름", "자세한 날짜는 시군구청에 따라 다를 수 있음"])(
    "날짜가 없는 '%s'는 날짜 없음으로 봅니다",
    (text) => {
      expect(parseApplyPeriod(text)).toEqual({ kind: "none" });
    },
  );

  it("날짜처럼 보이지만 읽을 수 없으면 확인이 필요하다고 봅니다", () => {
    expect(parseApplyPeriod("2026.13.40 접수")).toEqual({ kind: "unclear" });
  });
});
