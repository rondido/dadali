import { describe, expect, it } from "vitest";
import {
  EMPTY_CONDITIONS,
  chipLabel,
  conditionsFromParams,
  conditionsToParams,
  hasConditions,
  toChips,
  withChip,
  withoutChip,
  type SearchConditions,
} from "./conditions";

const FULL: SearchConditions = { region: "11", age: "youth", biz: "retail", topics: ["facility", "fund"] };

describe("conditionsToParams / conditionsFromParams", () => {
  it("조건을 기획서의 URL 형식으로 바꿉니다", () => {
    expect(conditionsToParams(FULL).toString()).toBe("region=11&age=youth&biz=retail&topic=facility%2Cfund");
  });

  it("URL로 바꾼 조건을 다시 읽으면 같은 조건이 됩니다", () => {
    expect(conditionsFromParams(conditionsToParams(FULL))).toEqual(FULL);
  });

  it("빈 조건은 빈 주소가 됩니다", () => {
    expect(conditionsToParams(EMPTY_CONDITIONS).toString()).toBe("");
  });

  it("알 수 없는 값은 버리고 읽습니다", () => {
    const params = new URLSearchParams("region=99&age=kid&biz=retail&topic=facility,unknown");

    expect(conditionsFromParams(params)).toEqual({ region: null, age: null, biz: "retail", topics: ["facility"] });
  });
});

describe("hasConditions", () => {
  it("아무 조건도 없으면 false를 반환합니다", () => {
    expect(hasConditions(EMPTY_CONDITIONS)).toBe(false);
  });

  it("관심 주제 하나만 있어도 true를 반환합니다", () => {
    expect(hasConditions({ ...EMPTY_CONDITIONS, topics: ["fund"] })).toBe(true);
  });
});

describe("toChips", () => {
  it("지역 → 나이대 → 하는 일 → 관심 주제 순서로 칩을 만듭니다", () => {
    expect(toChips(FULL).map(chipLabel)).toEqual(["서울", "청년", "도소매·음식", "시설·인테리어", "자금·대출"]);
  });
});

describe("withoutChip", () => {
  it("지역 칩을 빼면 지역 조건만 비웁니다", () => {
    expect(withoutChip(FULL, { kind: "region", value: "11" })).toEqual({ ...FULL, region: null });
  });

  it("관심 주제 칩을 빼면 그 주제만 뺍니다", () => {
    expect(withoutChip(FULL, { kind: "topic", value: "facility" }).topics).toEqual(["fund"]);
  });
});

describe("withChip", () => {
  it("지역 칩을 더하면 기존 지역을 바꿉니다", () => {
    expect(withChip(FULL, { kind: "region", value: "26" }).region).toBe("26");
  });

  it("관심 주제 칩을 더하면 기존 주제 뒤에 붙입니다", () => {
    expect(withChip(FULL, { kind: "topic", value: "job" }).topics).toEqual(["facility", "fund", "job"]);
  });

  it("이미 있는 관심 주제를 더하면 그대로 둡니다", () => {
    expect(withChip(FULL, { kind: "topic", value: "fund" })).toBe(FULL);
  });
});
