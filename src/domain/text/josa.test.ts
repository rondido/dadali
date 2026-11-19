import { expect, test } from "vitest";
import { josa } from "./josa";

test.each([
  ["복직", "은"],
  ["고양이", "는"],
  ["인테리어", "는"],
  ["월세", "는"],
  ["창업", "은"],
  ["R&D", "는"],
])("%s 뒤에는 %s를 붙입니다", (word, expected) => {
  expect(josa(word, "은", "는")).toBe(expected);
});

test("받침이 있으면 이/가 중 '이'를 고릅니다", () => {
  expect(josa("복직", "이", "가")).toBe("이");
});
