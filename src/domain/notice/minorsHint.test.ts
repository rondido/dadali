import { describe, expect, it } from "vitest";
import { looksMinorsOnly } from "./minorsHint";

describe("공고명으로 미성년자 전용 공고 짐작하기", () => {
  it("초중고·교복·영유아·학교 밖 청소년 공고는 미성년자 전용으로 봅니다", () => {
    for (const title of ["중·고등학교 신입생 교복 지원", "동구 학교 밖 청소년 검정고시 합격축하금 지원", "영유아 건강검진", "초등학생 돌봄교실"]) {
      expect(looksMinorsOnly(title), title).toBe(true);
    }
  });

  it("어른이 받는 공고임을 드러내는 말이 함께 있으면 미성년자 전용으로 보지 않습니다", () => {
    for (const title of [
      "자립준비청년(보호종료아동) 자립정착금 지원",
      "청년·청소년 마음건강 지원",
      "영유아 양육 가정 지원",
      "어린이집 보육교사 처우개선",
      "청주시 청년 전세자금 대출이자 지원",
    ]) {
      expect(looksMinorsOnly(title), title).toBe(false);
    }
  });
});
