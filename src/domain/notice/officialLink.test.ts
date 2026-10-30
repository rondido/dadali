import { describe, expect, it, test } from "vitest";
import { isOfficialUrl, officialLinkOf } from "./officialLink";

describe("isOfficialUrl", () => {
  test.each([
    ["https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do", true],
    ["https://www.bokjiro.go.kr", true],
    ["https://www.semas.or.kr", true],
    ["https://www.sbiz24.kr", true],
    ["https://sbiz24.kr", true],
    ["https://k-startup.go.kr.example.com", false],
    ["https://fake-sbiz24.kr", false],
    ["javascript:alert(1)", false],
    ["주소 아님", false],
  ])("%s는 공식 주소 여부 %s를 반환합니다", (url, expected) => {
    expect(isOfficialUrl(url)).toBe(expected);
  });
});

describe("officialLinkOf", () => {
  const sourceUrl = "https://www.k-startup.go.kr";

  it("원문 공고 주소가 공식 도메인이면 그 주소로 보내고 www를 뺀 도메인을 함께 반환합니다", () => {
    const detailUrl = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do";

    expect(officialLinkOf({ detailUrl, sourceUrl })).toEqual({
      url: detailUrl,
      host: "k-startup.go.kr",
      isFallback: false,
    });
  });

  it("원문 공고 주소가 없으면 출처 사이트 메인으로 보냅니다", () => {
    expect(officialLinkOf({ detailUrl: null, sourceUrl })).toEqual({
      url: sourceUrl,
      host: "k-startup.go.kr",
      isFallback: true,
    });
  });

  it("원문 공고 주소가 공식 도메인이 아니면 출처 사이트 메인으로 보냅니다", () => {
    const link = officialLinkOf({ detailUrl: "https://example.com/notice", sourceUrl });

    expect(link).toMatchObject({ url: sourceUrl, isFallback: true });
  });
});
