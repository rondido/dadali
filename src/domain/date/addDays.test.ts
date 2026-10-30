import { expect, test } from "vitest";
import { addDays } from "./addDays";

test.each([
  ["2026-11-20", 1, "2026-11-21"],
  ["2026-11-30", 1, "2026-12-01"],
  ["2026-12-31", 1, "2027-01-01"],
  ["2026-11-01", -1, "2026-10-31"],
])("%s에 %i일을 더하면 %s를 반환합니다", (date, days, expected) => {
  expect(addDays(date, days)).toBe(expected);
});
