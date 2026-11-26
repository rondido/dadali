import { describe, expect, it } from "vitest";
import {
  EMPTY_CONDITIONS,
  chipLabel,
  conditionsFromParams,
  conditionsToParams,
  hasConditions,
  toChips,
  toggleChip,
  withChip,
  withoutChip,
  type SearchConditions,
} from "./conditions";

const FULL: SearchConditions = {
  region: "11",
  district: null,
  age: "youth",
  target: null,
  biz: "retail",
  topics: ["facility", "fund"],
};

describe("아동·청소년 나이대", () => {
  it("주소의 age=child를 아동·청소년 칩으로 읽고 다시 주소로 씁니다", () => {
    const conditions = conditionsFromParams(new URLSearchParams("age=child"));

    expect(conditions.age).toBe("child");
    expect(toChips(conditions).map(chipLabel)).toEqual(["아동·청소년"]);
    expect(conditionsToParams(conditions).toString()).toBe("age=child");
  });
});

describe("시·군·구 조건", () => {
  const mapo: SearchConditions = { ...EMPTY_CONDITIONS, region: "11", district: "마포구" };

  it("주소에 gu로 담고, 그 시·도에 없는 시·군·구는 버립니다", () => {
    expect(conditionsToParams(mapo).get("gu")).toBe("마포구");
    expect(conditionsFromParams(new URLSearchParams("region=11&gu=마포구")).district).toBe("마포구");
    expect(conditionsFromParams(new URLSearchParams("region=26&gu=마포구")).district).toBeNull();
    expect(conditionsFromParams(new URLSearchParams("gu=마포구")).district).toBeNull();
  });

  it("지역 칩에 시·군·구를 함께 보여주고, 빼면 둘 다 뺍니다", () => {
    const [chip] = toChips(mapo);

    expect(chipLabel(chip)).toBe("서울 마포구");
    expect(withoutChip(mapo, chip)).toMatchObject({ region: null, district: null });
  });

  it("다른 시·도로 바꾸면 그 시·도에 같은 이름이 있을 때만 시·군·구를 남깁니다", () => {
    const jung: SearchConditions = { ...EMPTY_CONDITIONS, region: "11", district: "중구" };

    expect(withChip(jung, { kind: "region", value: "26" })).toMatchObject({ region: "26", district: "중구" });
    expect(withChip(mapo, { kind: "region", value: "26" })).toMatchObject({ region: "26", district: null });
  });
});

describe("toggleChip", () => {
  it("고르지 않은 지역을 누르면 그 지역을 고릅니다", () => {
    expect(toggleChip(EMPTY_CONDITIONS, { kind: "region", value: "11" }).region).toBe("11");
  });

  it("이미 고른 지역을 다시 누르면 뺍니다", () => {
    expect(toggleChip(FULL, { kind: "region", value: "11" }).region).toBeNull();
  });

  it("다른 지역을 누르면 하나만 남도록 바꿉니다", () => {
    expect(toggleChip(FULL, { kind: "region", value: "26" }).region).toBe("26");
  });

  it("관심 주제는 여러 개를 함께 고릅니다", () => {
    expect(toggleChip(FULL, { kind: "topic", value: "house" }).topics).toEqual(["facility", "fund", "house"]);
  });

  it("이미 고른 관심 주제를 다시 누르면 그 주제만 뺍니다", () => {
    expect(toggleChip(FULL, { kind: "topic", value: "facility" }).topics).toEqual(["fund"]);
  });
});

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

    expect(conditionsFromParams(params)).toEqual({ region: null, district: null, age: null, target: null, biz: "retail", topics: ["facility"] });
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

describe("대상(가구 상황) 조건", () => {
  it("주소의 target을 대상 칩으로 읽고 다시 주소로 씁니다", () => {
    const conditions = conditionsFromParams(new URLSearchParams("target=disabled"));
    expect(conditions.target).toBe("disabled");
    expect(toChips(conditions)).toEqual([{ kind: "target", value: "disabled" }]);
    expect(chipLabel({ kind: "target", value: "disabled" })).toBe("장애인");
    expect(conditionsToParams(conditions).toString()).toBe("target=disabled");
  });

  it("알 수 없는 대상은 버립니다", () => {
    expect(conditionsFromParams(new URLSearchParams("target=alien")).target).toBeNull();
  });
});
