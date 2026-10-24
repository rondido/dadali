import { expect, test } from "vitest";
import { toSeoulDate } from "./seoulDate";

test.each([
  ["2026-11-19T14:59:59Z", "2026-11-19"],
  ["2026-11-19T15:00:00Z", "2026-11-20"],
  ["2026-12-31T15:00:00Z", "2027-01-01"],
])("UTC 시각 %s는 서울 날짜로 %s를 반환합니다", (utc, expected) => {
  expect(toSeoulDate(new Date(utc))).toBe(expected);
});
