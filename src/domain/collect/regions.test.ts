import { describe, expect, test } from "vitest";
import { sidoCodesOf, sidoCodesOfOrg } from "./regions";

describe("sidoCodesOf", () => {
  test.each([
    ["서울", ["11"]],
    ["경기도", ["41"]],
    ["강원특별자치도", ["51"]],
    ["전북특별자치도", ["52"]],
    ["전남광주통합특별시", ["29", "46"]],
    ["없는지역", []],
  ])("%s는 %o입니다", (name, expected) => {
    expect(sidoCodesOf(name)).toEqual(expected);
  });
});

describe("sidoCodesOfOrg", () => {
  test.each([
    ["경기도 수원시", ["41"]],
    ["울산광역시", ["31"]],
    ["보건복지부", []],
    ["재단법인안산인재육성재단", []],
  ])("기관명 %s는 %o입니다", (org, expected) => {
    expect(sidoCodesOfOrg(org)).toEqual(expected);
  });
});
