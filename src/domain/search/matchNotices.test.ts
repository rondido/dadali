import { describe, expect, it } from "vitest";
import type { Notice } from "@/domain/notice/notice";
import { EMPTY_CONDITIONS } from "./conditions";
import { matchNotices } from "./matchNotices";

// 테스트마다 달라지는 값만 넘기고, 나머지는 판단에 영향이 없는 기본값으로 채웁니다
function noticeOf(overrides: Partial<Notice>): Notice {
  return {
    id: "n1",
    title: "공고",
    categoryId: "C02",
    applyStart: null,
    applyEnd: null,
    isAlways: true,
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

function idsOf(notices: Notice[], conditions = EMPTY_CONDITIONS, keywords: string[] = []): string[] {
  return matchNotices(notices, conditions, keywords).matches.map((m) => m.notice.id);
}

describe("matchNotices", () => {
  it("조건과 태그로 분명히 맞은 개수를 세고, 대상이 비어 통과한 것은 세지 않습니다", () => {
    const conditions = { ...EMPTY_CONDITIONS, region: "11" as const, age: "youth" as const, topics: ["fund" as const, "house" as const] };
    const notices = [
      noticeOf({ id: "explicit", regionCodes: ["11"], ageGroups: ["youth"], topics: ["fund", "house"] }),
      noticeOf({ id: "open", topics: ["fund"] }),
    ];

    const strengths = matchNotices(notices, conditions).matches.map((m) => [m.notice.id, m.strength]);
    expect(strengths).toEqual([
      ["explicit", 4],
      ["open", 1],
    ]);
  });

  describe("시·군·구", () => {
    const notices = [
      noticeOf({ id: "mapo", org: "서울특별시 마포구", regionCodes: ["11"] }),
      noticeOf({ id: "gwangjin", org: "서울특별시 광진구", regionCodes: ["11"] }),
      noticeOf({ id: "seoul", org: "서울특별시", regionCodes: ["11"] }),
      noticeOf({ id: "nation", org: "보건복지부" }),
      noticeOf({ id: "busan-jung", org: "부산광역시 중구", regionCodes: ["26"] }),
    ];

    it("시·군·구를 정하면 같은 시·도의 다른 시·군·구 기관 공고를 빼고, 그 시·군·구 공고를 더 맞은 것으로 셉니다", () => {
      const { matches } = matchNotices(notices, { ...EMPTY_CONDITIONS, region: "11", district: "마포구" });

      expect(matches.map((m) => [m.notice.id, m.reasons, m.strength])).toEqual([
        ["mapo", ["마포구"], 2],
        ["seoul", ["서울"], 1],
        ["nation", ["전국"], 0],
      ]);
    });

    it("시·도로만 찾으면 다른 시·군·구 공고도 보여주되 시·군·구 공고로 표시합니다", () => {
      const { matches } = matchNotices(notices, { ...EMPTY_CONDITIONS, region: "11" });

      expect(matches.map((m) => [m.notice.id, m.local ?? false])).toEqual([
        ["mapo", true],
        ["gwangjin", true],
        ["seoul", false],
        ["nation", false],
      ]);
    });

    it("광주·전남 통합 기관명도 두 시·도의 시·군·구로 읽습니다", () => {
      const merged = [
        noticeOf({ id: "dong", org: "전남광주통합특별시 동구", regionCodes: ["29", "46"] }),
        noticeOf({ id: "suncheon", org: "전남광주통합특별시 순천시", regionCodes: ["29", "46"] }),
      ];

      expect(idsOf(merged, { ...EMPTY_CONDITIONS, region: "29", district: "동구" })).toEqual(["dong"]);
      expect(idsOf(merged, { ...EMPTY_CONDITIONS, region: "46", district: "순천시" })).toEqual(["suncheon"]);
    });
  });

  it("미성년자 전용 공고는 나이대 조건이 있을 때 빠지고, 없을 때는 보입니다", () => {
    const notices = [noticeOf({ id: "kids", minorsOnly: true }), noticeOf({ id: "all" })];

    expect(idsOf(notices, { ...EMPTY_CONDITIONS, age: "youth" })).toEqual(["all"]);
    expect(idsOf(notices)).toEqual(["kids", "all"]);
  });

  it("조건이 없으면 모든 공고를 태그 없이 반환합니다", () => {
    const { matches } = matchNotices([noticeOf({ id: "a" }), noticeOf({ id: "b" })], EMPTY_CONDITIONS);

    expect(matches).toEqual([
      { notice: expect.objectContaining({ id: "a" }), reasons: [], strength: 0 },
      { notice: expect.objectContaining({ id: "b" }), reasons: [], strength: 0 },
    ]);
  });

  describe("지역", () => {
    const notices = [
      noticeOf({ id: "nation", regionCodes: [] }),
      noticeOf({ id: "seoul", regionCodes: ["11"] }),
      noticeOf({ id: "busan", regionCodes: ["26"] }),
    ];
    const seoul = { ...EMPTY_CONDITIONS, region: "11" as const };

    it("고른 시·도 공고와 전국 공고를 함께 반환합니다", () => {
      expect(idsOf(notices, seoul)).toEqual(["nation", "seoul"]);
    });

    it("전국 공고에는 전국, 지역 공고에는 시·도 이름 태그를 붙입니다", () => {
      const { matches } = matchNotices(notices, seoul);

      expect(matches.map((m) => m.reasons)).toEqual([["전국"], ["서울"]]);
    });
  });

  it("나이대가 비어 있는 공고는 전 연령 대상으로 보고 통과시킵니다", () => {
    const notices = [noticeOf({ id: "all", ageGroups: [] }), noticeOf({ id: "senior", ageGroups: ["senior"] })];

    expect(idsOf(notices, { ...EMPTY_CONDITIONS, age: "youth" })).toEqual(["all"]);
  });

  it("조건 사이는 모두 만족해야 통과합니다", () => {
    const notices = [
      noticeOf({ id: "both", regionCodes: ["11"], industries: ["retail"] }),
      noticeOf({ id: "regionOnly", regionCodes: ["11"], industries: ["mfg"] }),
    ];

    expect(idsOf(notices, { ...EMPTY_CONDITIONS, region: "11", biz: "retail" })).toEqual(["both"]);
  });

  describe("관심 주제", () => {
    const notices = [
      noticeOf({ id: "facility", topics: ["facility"] }),
      noticeOf({ id: "fund", topics: ["fund"] }),
      noticeOf({ id: "none", topics: [] }),
    ];

    it("고른 주제 중 하나라도 있으면 통과합니다", () => {
      expect(idsOf(notices, { ...EMPTY_CONDITIONS, topics: ["facility", "fund"] })).toEqual(["facility", "fund"]);
    });

    it("맞은 주제를 태그로 붙입니다", () => {
      const { matches } = matchNotices(notices, { ...EMPTY_CONDITIONS, topics: ["facility"] });

      expect(matches[0].reasons).toEqual(["시설·인테리어"]);
    });
  });

  describe("남은 단어 검색", () => {
    const notices = [
      noticeOf({ id: "title", title: "복직 준비 지원" }),
      noticeOf({ id: "summary", summary: "경력 복직 교육비 지원" }),
      noticeOf({ id: "other", title: "수출 바우처" }),
    ];

    it("공고명이나 지원 내용 요약에 단어가 있는 공고만 남기고 태그를 붙입니다", () => {
      const result = matchNotices(notices, EMPTY_CONDITIONS, ["복직"]);

      expect(result.matches.map((m) => [m.notice.id, m.reasons])).toEqual([
        ["title", ['"복직"']],
        ["summary", ['"복직"']],
      ]);
      expect(result.usedKeywords).toEqual(["복직"]);
    });

    it("어느 공고에도 없는 단어로는 결과를 거르지 않습니다", () => {
      const result = matchNotices(notices, EMPTY_CONDITIONS, ["없는말"]);

      expect(result.matches).toHaveLength(3);
      expect(result.usedKeywords).toEqual([]);
    });
  });
});
