import { describe, expect, it } from "vitest";
import { fromGov24 } from "./gov24";

// 실제 응답 형태에서 판단에 쓰는 필드만 채웁니다
function itemOf(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    서비스ID: "105100000001",
    서비스명: "청년 월세 지원",
    소관기관명: "경기도 수원시",
    서비스목적요약: "무주택 청년의 월세 부담을 덜어 줍니다",
    상세조회URL: "https://plus.gov.kr/portal/benefitV2/benefitSrvcDtl?svcId=105100000001",
    사용자구분: "개인",
    서비스분야: "주거·자립",
    지원유형: "현금",
    지원대상: "만 19~34세 무주택 청년",
    신청기한유형: "상시신청",
    신청기한: "연중",
    ...overrides,
  };
}

describe("fromGov24", () => {
  it("서비스 번호·이름·기관·요약·원문 주소를 옮깁니다", () => {
    expect(fromGov24(itemOf())).toMatchObject({
      source: "gov24",
      sourceId: "105100000001",
      title: "청년 월세 지원",
      org: "경기도 수원시",
      summaryText: "무주택 청년의 월세 부담을 덜어 줍니다",
      detailUrl: expect.stringContaining("plus.gov.kr"),
    });
  });

  describe("신청 기간", () => {
    it("상시신청이면 상시입니다", () => {
      expect(fromGov24(itemOf())).toMatchObject({ isAlways: true, parseStatus: "ok", applyEnd: null });
    });

    it("기간이 적혀 있으면 날짜로 읽습니다", () => {
      const record = fromGov24(itemOf({ 신청기한유형: "직접입력", 신청기한: "2026.02.02~2026.08.31" }));
      expect(record).toMatchObject({ isAlways: false, parseStatus: "ok", applyStart: "2026-02-02", applyEnd: "2026-08-31" });
    });

    it("'별도 공고'처럼 날짜가 없으면 상시로 보되 날짜 없음을 표시합니다", () => {
      const record = fromGov24(itemOf({ 신청기한유형: "직접입력", 신청기한: "별도 공고기한내" }));
      expect(record).toMatchObject({ isAlways: true, parseStatus: "no_date" });
    });

    it("날짜를 읽지 못하면 확인이 필요한 공고로 둡니다", () => {
      const record = fromGov24(itemOf({ 신청기한유형: "직접입력", 신청기한: "2026.13.40 접수" }));
      expect(record).toMatchObject({ isAlways: false, parseStatus: "check" });
    });
  });

  describe("분류", () => {
    it("개인이 대상에 있으면 개인 혜택입니다", () => {
      expect(fromGov24(itemOf({ 사용자구분: "개인||법인/시설/단체" })).categoryId).toBe("C01");
    });

    it("사업자·단체만 대상이면 기업·소상공인입니다", () => {
      expect(fromGov24(itemOf({ 사용자구분: "소상공인||법인/시설/단체" })).categoryId).toBe("C03");
    });
  });

  it("기관명 앞의 시·도로 지역을 정하고, 중앙부처는 전국으로 둡니다", () => {
    expect(fromGov24(itemOf()).regionCodes).toEqual(["41"]);
    expect(fromGov24(itemOf({ 소관기관명: "보건복지부" })).regionCodes).toEqual([]);
  });

  describe("나이대", () => {
    it("지원 대상에 청년만 나오면 청년입니다", () => {
      expect(fromGov24(itemOf()).ageGroups).toEqual(["youth"]);
    });

    it("나이대 단어가 없으면 전체 대상입니다", () => {
      expect(fromGov24(itemOf({ 지원대상: "관내 거주 가구" })).ageGroups).toEqual([]);
    });
  });

  it("서비스 분야와 지원 유형을 관심 주제로 바꿉니다", () => {
    const record = fromGov24(itemOf({ 서비스분야: "주거·자립||고용·창업", 지원유형: "현금(융자)" }));
    expect(record.topics).toEqual(["house", "job", "fund"]);
  });

  it("농림축산어업 서비스는 농림어업 업종으로 둡니다", () => {
    expect(fromGov24(itemOf({ 서비스분야: "농림축산어업" })).industries).toEqual(["agri"]);
  });
});
