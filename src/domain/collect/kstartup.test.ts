import { describe, expect, it } from "vitest";
import { fromKstartup } from "./kstartup";

// 실제 응답 형태에서 판단에 쓰는 필드만 채웁니다
function itemOf(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    pbanc_sn: 179766,
    biz_pbanc_nm: "2027 예비창업 도전 프로그램",
    pbanc_ntrp_nm: "강동구 청년해냄센터",
    pbanc_rcpt_bgng_dt: "20261109",
    pbanc_rcpt_end_dt: "20261123",
    detl_pg_url: "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=179766",
    supt_regin: "서울",
    supt_biz_clsfc: "사업화",
    biz_trgt_age: "만 20세 이상 ~ 만 39세 이하",
    pbanc_ctnt: "예비창업자의 사업화 자금과 멘토링을 지원합니다.",
    ...overrides,
  };
}

describe("fromKstartup", () => {
  it("공고 번호·이름·기관·접수 기간·원문 주소를 옮깁니다", () => {
    expect(fromKstartup(itemOf())).toMatchObject({
      source: "kstartup",
      sourceId: "179766",
      title: "2027 예비창업 도전 프로그램",
      org: "강동구 청년해냄센터",
      categoryId: "C02",
      applyStart: "2026-11-09",
      applyEnd: "2026-11-23",
      isAlways: false,
      parseStatus: "ok",
      detailUrl: expect.stringContaining("pbancSn=179766"),
    });
  });

  it("접수 날짜를 읽지 못하면 확인이 필요한 공고로 둡니다", () => {
    expect(fromKstartup(itemOf({ pbanc_rcpt_end_dt: "" })).parseStatus).toBe("check");
  });

  describe("지역", () => {
    it("시·도 이름을 코드로 바꿉니다", () => {
      expect(fromKstartup(itemOf({ supt_regin: "서울,경기" })).regionCodes).toEqual(["11", "41"]);
    });

    it("전국이면 빈 배열(전국 대상)로 둡니다", () => {
      expect(fromKstartup(itemOf({ supt_regin: "전국" })).regionCodes).toEqual([]);
    });
  });

  describe("나이대", () => {
    it("39세 이하 구간만 있으면 청년입니다", () => {
      expect(fromKstartup(itemOf()).ageGroups).toEqual(["youth"]);
    });

    it("40세 이상만 있으면 중장년과 어르신입니다", () => {
      expect(fromKstartup(itemOf({ biz_trgt_age: "만 40세 이상" })).ageGroups).toEqual(["middle", "senior"]);
    });

    it("모든 구간이면 전체 대상(빈 배열)입니다", () => {
      const all = "만 20세 미만,만 20세 이상 ~ 만 39세 이하,만 40세 이상";
      expect(fromKstartup(itemOf({ biz_trgt_age: all })).ageGroups).toEqual([]);
    });
  });

  it("지원 분야를 관심 주제로 바꾸고 창업 주제를 항상 붙입니다", () => {
    const record = fromKstartup(itemOf({ supt_biz_clsfc: "사업화,판로ㆍ해외진출,시설ㆍ공간ㆍ보육" }));
    expect(record.topics).toEqual(["startup", "fund", "market", "export"]);
  });

  it("공고 이름의 HTML 엔티티를 글자로 바꿉니다", () => {
    expect(fromKstartup(itemOf({ biz_pbanc_nm: "기술개발(R&amp;D) 지원" })).title).toBe("기술개발(R&D) 지원");
  });

  describe("요약", () => {
    it("공고 내용을 요약으로 씁니다", () => {
      expect(fromKstartup(itemOf()).summaryText).toBe("예비창업자의 사업화 자금과 멘토링을 지원합니다.");
    });

    it("공고 내용이 인사말뿐이면 신청 대상 설명을 씁니다", () => {
      const record = fromKstartup(
        itemOf({
          pbanc_ctnt: "강동구 청년해냄센터에서 다음과 같이 공고하오니 신청하시기 바랍니다.",
          aply_trgt_ctnt: "예비창업자 및 기창업자 24명",
        }),
      );
      expect(record.summaryText).toBe("예비창업자 및 기창업자 24명");
    });

    it("300자를 넘으면 자르고 말줄임표를 붙입니다", () => {
      const summary = fromKstartup(itemOf({ pbanc_ctnt: "가".repeat(400) })).summaryText!;
      expect(summary).toHaveLength(300);
      expect(summary.endsWith("…")).toBe(true);
    });
  });
});
