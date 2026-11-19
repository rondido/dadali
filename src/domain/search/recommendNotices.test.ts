import { describe, expect, it } from "vitest";
import type { Notice } from "@/domain/notice/notice";
import { EMPTY_CONDITIONS, type SearchConditions } from "./conditions";
import { recommendNotices } from "./recommendNotices";

const TODAY = "2026-11-10";
const SEOUL_RETAIL: SearchConditions = { ...EMPTY_CONDITIONS, region: "11", biz: "retail" };

// 테스트마다 달라지는 값만 넘기고, 나머지는 판단에 영향이 없는 기본값으로 채웁니다
function noticeOf(overrides: Partial<Notice>): Notice {
  return {
    id: "n1",
    title: "공고",
    categoryId: "C02",
    applyStart: "2026-11-01",
    applyEnd: "2026-11-30",
    isAlways: false,
    org: "기관",
    summary: "",
    ageGroups: [],
    regionCodes: [],
    industries: [],
    topics: [],
    detailUrl: null,
    sourceName: "출처",
    sourceUrl: "https://www.gov.kr",
    ...overrides,
  };
}

function idsOf(notices: Notice[], conditions = SEOUL_RETAIL): string[] {
  return recommendNotices(
    notices.map((notice) => ({ notice, reasons: [] })),
    conditions,
    TODAY,
  ).map((m) => m.notice.id);
}

describe("recommendNotices", () => {
  it("조건과 분명히 맞은 항목이 많은 공고를 먼저 보여줍니다", () => {
    const notices = [
      noticeOf({ id: "one", regionCodes: ["11"], applyEnd: "2026-11-11" }),
      noticeOf({ id: "two", regionCodes: ["11"], industries: ["retail"], applyEnd: "2026-11-30" }),
    ];

    expect(idsOf(notices)).toEqual(["two", "one"]);
  });

  it("대상이 비어 있는 공고는 검색에 통과해도 먼저 볼 공고에 넣지 않습니다", () => {
    expect(idsOf([noticeOf({ id: "empty" })])).toEqual([]);
  });

  it("조건이 없으면 고를 근거가 없어 빈 목록을 돌려줍니다", () => {
    expect(idsOf([noticeOf({ regionCodes: ["11"] })], EMPTY_CONDITIONS)).toEqual([]);
  });

  it("마감된 공고는 조건이 맞아도 넣지 않습니다", () => {
    expect(idsOf([noticeOf({ regionCodes: ["11"], applyStart: "2026-10-01", applyEnd: "2026-11-09" })])).toEqual([]);
  });

  describe("맞은 항목 수가 같을 때", () => {
    it("접수 중인 공고는 마감이 가까운 순서로 보여줍니다", () => {
      const notices = [
        noticeOf({ id: "later", regionCodes: ["11"], applyEnd: "2026-11-30" }),
        noticeOf({ id: "sooner", regionCodes: ["11"], applyEnd: "2026-11-12" }),
      ];

      expect(idsOf(notices)).toEqual(["sooner", "later"]);
    });

    it("접수 중 → 접수 예정 → 상시 순서로 보여줍니다", () => {
      const notices = [
        noticeOf({ id: "always", regionCodes: ["11"], applyStart: null, applyEnd: null, isAlways: true }),
        noticeOf({ id: "upcoming", regionCodes: ["11"], applyStart: "2026-11-11", applyEnd: "2026-11-12" }),
        noticeOf({ id: "open", regionCodes: ["11"], applyEnd: "2026-12-31" }),
      ];

      expect(idsOf(notices)).toEqual(["open", "upcoming", "always"]);
    });

    it("접수 예정 공고는 시작이 가까운 순서로 보여줍니다", () => {
      const notices = [
        noticeOf({ id: "later", regionCodes: ["11"], applyStart: "2026-11-20", applyEnd: "2026-12-01" }),
        noticeOf({ id: "sooner", regionCodes: ["11"], applyStart: "2026-11-12", applyEnd: "2026-12-31" }),
      ];

      expect(idsOf(notices)).toEqual(["sooner", "later"]);
    });
  });

  it("개수를 넘는 공고는 잘라 냅니다", () => {
    const notices = ["a", "b", "c", "d"].map((id) => noticeOf({ id, title: id, regionCodes: ["11"] }));

    expect(idsOf(notices)).toEqual(["a", "b", "c"]);
  });

  it("이유에는 분명히 맞은 조건만 담고 전국 같은 통과 태그는 뺍니다", () => {
    const [recommended] = recommendNotices(
      [{ notice: noticeOf({ industries: ["retail"] }), reasons: ["전국", "도소매·음식"] }],
      SEOUL_RETAIL,
      TODAY,
    );

    expect(recommended.reasons).toEqual(["도소매·음식"]);
  });
});
