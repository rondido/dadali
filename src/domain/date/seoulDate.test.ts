import { expect, test } from "vitest";
import { formatSeoulDateTime, toSeoulDate } from "./seoulDate";

test.each([
  ["2026-11-19T14:59:59Z", "2026-11-19"],
  ["2026-11-19T15:00:00Z", "2026-11-20"],
  ["2026-12-31T15:00:00Z", "2027-01-01"],
])("UTC 시각 %s는 서울 날짜로 %s를 반환합니다", (utc, expected) => {
  expect(toSeoulDate(new Date(utc))).toBe(expected);
});

test.each([
  ["2026-11-09T20:00:00Z", "11월 10일 05:00"],
  ["2026-11-10T14:30:00Z", "11월 10일 23:30"],
])("UTC 시각 %s는 서울 기준 %s로 표시합니다", (utc, expected) => {
  expect(formatSeoulDateTime(new Date(utc))).toBe(expected);
});
