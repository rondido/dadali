import { describe, expect, it } from "vitest";
import { SAMPLE_NOTICES } from "@/data/sampleNotices";
import {
  EMPTY_DETAILS,
  applyDetails,
  detailChipLabel,
  detailCount,
  detailsFromParams,
  normalizeWords,
  toDetailChips,
  withoutDetailChip,
  writeDetails,
} from "./detailFilters";
import type { NoticeMatch } from "./matchNotices";

const matchesOf = (titles: { title: string; org?: string; regionCodes?: string[] }[]): NoticeMatch[] =>
  titles.map((t, i) => ({
    notice: { ...SAMPLE_NOTICES[0], id: `t${i}`, org: t.org ?? "기관", regionCodes: t.regionCodes ?? [], title: t.title },
    reasons: [],
  }));

const titlesOf = (matches: NoticeMatch[]) => matches.map((m) => m.notice.title);

describe("주소와 상세 조건", () => {
  it("주소의 inc·exc·local을 읽습니다", () => {
    const details = detailsFromParams(new URLSearchParams("inc=창업,교육&exc=입찰&local=1"));
    expect(details).toEqual({ include: ["창업", "교육"], exclude: ["입찰"], localOnly: true });
  });

  it("없는 값은 빈 상세 조건이 됩니다", () => {
    expect(detailsFromParams(new URLSearchParams("region=11"))).toEqual(EMPTY_DETAILS);
  });

  it("기존 조건은 두고 상세 조건만 덧붙이거나 지웁니다", () => {
    const params = new URLSearchParams("region=11&exc=입찰");
    const written = writeDetails(params, { include: ["창업"], exclude: [], localOnly: false });
    expect(written.get("region")).toBe("11");
    expect(written.get("inc")).toBe("창업");
    expect(written.has("exc")).toBe(false);
    expect(written.has("local")).toBe(false);
  });

  it("단어는 공백을 지우고 겹치지 않게 다섯 개까지만 둡니다", () => {
    expect(normalizeWords([" 창업 ", "창업", "", "a", "b", "c", "d", "e"])).toEqual(["창업", "a", "b", "c", "d"]);
  });
});

describe("applyDetails", () => {
  const matches = matchesOf([
    { title: "청년 창업 지원", regionCodes: ["11"] },
    { title: "공공 용역 입찰" },
    { title: "소상공인 교육", org: "창업진흥원" },
  ]);

  it("상세 조건이 없으면 그대로 둡니다", () => {
    expect(applyDetails(matches, EMPTY_DETAILS)).toBe(matches);
  });

  it("포함 단어가 공고명이나 기관에 하나라도 있으면 남깁니다", () => {
    const result = applyDetails(matches, { ...EMPTY_DETAILS, include: ["창업"] });
    expect(titlesOf(result)).toEqual(["청년 창업 지원", "소상공인 교육"]);
  });

  it("제외 단어가 있으면 뺍니다", () => {
    expect(titlesOf(applyDetails(matches, { ...EMPTY_DETAILS, exclude: ["입찰"] }))).toEqual(["청년 창업 지원", "소상공인 교육"]);
  });

  it("전국 대상 제외는 지역을 정해 둔 공고만 남깁니다", () => {
    expect(titlesOf(applyDetails(matches, { ...EMPTY_DETAILS, localOnly: true }))).toEqual(["청년 창업 지원"]);
  });

  it("영문 대소문자는 가리지 않습니다", () => {
    const english = matchesOf([{ title: "AI 바우처" }]);
    expect(applyDetails(english, { ...EMPTY_DETAILS, include: ["ai"] })).toHaveLength(1);
  });
});

describe("상세 조건 칩", () => {
  const details = { include: ["창업"], exclude: ["입찰"], localOnly: true };

  it("단어마다, 그리고 전국 대상 제외를 칩 하나로 만듭니다", () => {
    expect(toDetailChips(details).map(detailChipLabel)).toEqual(["포함 창업", "제외 입찰", "전국 대상 제외"]);
    expect(detailCount(details)).toBe(3);
  });

  it("칩을 빼면 그 단어나 전국 대상 제외만 지웁니다", () => {
    expect(withoutDetailChip(details, { kind: "exclude", value: "입찰" })).toEqual({ ...details, exclude: [] });
    expect(withoutDetailChip(details, { kind: "localOnly" })).toEqual({ ...details, localOnly: false });
  });
});
