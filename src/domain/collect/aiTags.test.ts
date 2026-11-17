import { describe, expect, it } from "vitest";
import { contentHashOf, normalizeAiTags, tagInputOf, tagModelOf, type AiTags } from "./aiTags";

const tags = (over: Partial<AiTags> = {}): AiTags => ({
  regions: [],
  ages: [],
  minors_only: false,
  industries: [],
  topics: [],
  ...over,
});

describe("tagInputOf", () => {
  it("정해진 원문 필드만 이름과 함께 한 줄씩 넣고, 빈 값은 뺍니다", () => {
    const text = tagInputOf("gov24", { 서비스명: "청년 월세 지원", 지원대상: "  만 19~34세\n무주택 청년 ", 선정기준: "", 조회수: 99 });

    expect(text).toBe("서비스명: 청년 월세 지원\n지원대상: 만 19~34세 무주택 청년");
  });
});

describe("contentHashOf", () => {
  it("조회수처럼 태깅에 안 쓰는 값이 바뀌면 지문이 그대로입니다", () => {
    const raw = { 서비스명: "청년 월세 지원", 조회수: 1 };

    expect(contentHashOf("gov24", raw)).toBe(contentHashOf("gov24", { ...raw, 조회수: 2 }));
  });

  it("지원 대상 같은 내용이 바뀌면 지문이 달라집니다", () => {
    const raw = { 서비스명: "청년 월세 지원", 지원대상: "만 19~34세" };

    expect(contentHashOf("gov24", raw)).not.toBe(contentHashOf("gov24", { ...raw, 지원대상: "만 19~39세" }));
  });
});

describe("normalizeAiTags", () => {
  it("세 나이대를 모두 붙였으면 나이 제한 없음(빈 배열)으로 바꿉니다", () => {
    expect(normalizeAiTags(tags({ ages: ["youth", "middle", "senior"] })).ages).toEqual([]);
  });

  it("미성년자 전용이면 나이대를 비웁니다", () => {
    expect(normalizeAiTags(tags({ minors_only: true, ages: ["youth"] })).ages).toEqual([]);
  });

  it("값의 중복을 없애고 정렬해 저장합니다", () => {
    expect(normalizeAiTags(tags({ topics: ["startup", "fund", "startup"], regions: ["46", "29"] }))).toMatchObject({
      topics: ["fund", "startup"],
      regions: ["29", "46"],
    });
  });
});

describe("tagModelOf", () => {
  it("기간 있는 공고는 정확한 모델, 상시 혜택은 저렴한 모델을 씁니다", () => {
    expect(tagModelOf(false)).toBe("claude-opus-5-5");
    expect(tagModelOf(true)).toBe("claude-haiku-5-5");
  });
});
