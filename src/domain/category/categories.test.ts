import { expect, test } from "vitest";
import { colorTokenOf } from "./categories";

test.each([
  ["C01", "cat-1"],
  ["C02", "cat-2"],
  ["C03", "cat-3"],
  ["C04", "cat-4"],
])("분류 ID가 %s이면 색 토큰 %s를 반환합니다", (categoryId, expected) => {
  expect(colorTokenOf(categoryId)).toBe(expected);
});

test("알 수 없는 분류 ID이면 첫 번째 분류의 색 토큰을 반환합니다", () => {
  expect(colorTokenOf("C99")).toBe("cat-1");
});
