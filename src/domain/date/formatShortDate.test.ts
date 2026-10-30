import { expect, test } from "vitest";
import { formatShortDate } from "./formatShortDate";

test.each([
  ["2026-11-02", "11.02"],
  ["2027-01-15", "01.15"],
])("%s는 %s로 짧게 표시합니다", (date, expected) => {
  expect(formatShortDate(date)).toBe(expected);
});
