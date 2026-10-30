import { expect, test } from "vitest";
import { daysBetween } from "./daysBetween";

test.each([
  ["2026-11-10", "2026-11-10", 0],
  ["2026-11-10", "2026-11-14", 4],
  ["2026-11-10", "2026-11-05", -5],
  ["2026-12-30", "2027-01-02", 3],
])("%s부터 %s까지는 %i일입니다", (from, to, expected) => {
  expect(daysBetween(from, to)).toBe(expected);
});
