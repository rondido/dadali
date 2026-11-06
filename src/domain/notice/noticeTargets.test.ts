import { describe, expect, it } from "vitest";
import { targetsOf } from "./noticeTargets";

const EMPTY = { regionCodes: [], ageGroups: [], industries: [], topics: [] };

describe("targetsOf", () => {
  it("지역·나이대가 비어 있으면 전체 대상이므로 전국과 전 연령으로 보여줍니다", () => {
    expect(targetsOf(EMPTY)).toEqual({ regions: ["전국"], ages: ["전 연령"], industries: [], topics: [] });
  });

  it("값이 있으면 화면에 쓰는 이름으로 바꿉니다", () => {
    const targets = targetsOf({
      regionCodes: ["11"],
      ageGroups: ["youth", "middle"],
      industries: ["retail"],
      topics: ["facility"],
    });

    expect(targets).toEqual({
      regions: ["서울"],
      ages: ["청년", "중장년"],
      industries: ["도소매·음식"],
      topics: ["시설·인테리어"],
    });
  });
});
