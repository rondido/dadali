import { describe, expect, it } from "vitest";
import { keywordsFromParams, writeKeywords } from "./keywords";

describe("남은 단어 주소", () => {
  it("남은 단어를 kw에 담고 다시 읽습니다", () => {
    const params = writeKeywords(new URLSearchParams("region=11"), ["복직", "전세사기"]);

    expect(params.toString()).toBe("region=11&kw=%EB%B3%B5%EC%A7%81%2C%EC%A0%84%EC%84%B8%EC%82%AC%EA%B8%B0");
    expect(keywordsFromParams(params)).toEqual(["복직", "전세사기"]);
  });

  it("단어가 없으면 kw를 지웁니다", () => {
    expect(writeKeywords(new URLSearchParams("kw=복직"), []).toString()).toBe("");
  });

  it("손으로 고친 주소의 빈 단어·같은 단어는 버립니다", () => {
    expect(keywordsFromParams(new URLSearchParams("kw=복직,,복직, 교육 "))).toEqual(["복직", "교육"]);
  });
});
