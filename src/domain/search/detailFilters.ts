// 상세 조건: 기본 조건(지역·나이대·하는 일·주제)으로 거른 결과를 한 번 더 좁힌다.
// - 포함 단어: 공고명·기관에 하나라도 있으면 남긴다
// - 제외 단어: 공고명·기관에 하나라도 있으면 뺀다 (예: "입찰")
// - 전국 대상 제외: 지역을 정해 둔 공고만 남긴다
// 이미 받은 목록에서 거르므로 서버에 다시 묻지 않는다. 주소(inc, exc, local)에 담아 링크·새로고침 때 유지한다
import type { NoticeMatch } from "./matchNotices";

export interface DetailFilters {
  include: string[];
  exclude: string[];
  localOnly: boolean;
}

export const EMPTY_DETAILS: DetailFilters = { include: [], exclude: [], localOnly: false };

const INCLUDE_PARAM = "inc";
const EXCLUDE_PARAM = "exc";
const LOCAL_PARAM = "local";

// 한 칸에 담는 단어 수와 길이 (손으로 고친 주소가 지나치게 길어지지 않게)
export const MAX_WORDS = 5;
const MAX_WORD_LENGTH = 20;

// 앞뒤 공백을 지우고, 너무 긴 단어는 자르고, 같은 단어는 한 번만
export function normalizeWords(words: string[]): string[] {
  const cleaned = words.map((word) => word.trim().slice(0, MAX_WORD_LENGTH)).filter(Boolean);
  return [...new Set(cleaned)].slice(0, MAX_WORDS);
}

export function detailsFromParams(params: URLSearchParams): DetailFilters {
  const words = (name: string) => normalizeWords((params.get(name) ?? "").split(","));
  return { include: words(INCLUDE_PARAM), exclude: words(EXCLUDE_PARAM), localOnly: params.get(LOCAL_PARAM) === "1" };
}

// 주소의 검색 부분에 상세 조건을 덧붙인다 (빈 값은 지운다)
export function writeDetails(params: URLSearchParams, details: DetailFilters): URLSearchParams {
  const next = new URLSearchParams(params);
  if (details.include.length > 0) next.set(INCLUDE_PARAM, details.include.join(","));
  else next.delete(INCLUDE_PARAM);
  if (details.exclude.length > 0) next.set(EXCLUDE_PARAM, details.exclude.join(","));
  else next.delete(EXCLUDE_PARAM);
  if (details.localOnly) next.set(LOCAL_PARAM, "1");
  else next.delete(LOCAL_PARAM);
  return next;
}

export function detailCount(details: DetailFilters): number {
  return details.include.length + details.exclude.length + (details.localOnly ? 1 : 0);
}

export function hasDetails(details: DetailFilters): boolean {
  return detailCount(details) > 0;
}

// 영문 대소문자는 가리지 않는다
const contains = (text: string, word: string) => text.toLowerCase().includes(word.toLowerCase());

export function applyDetails(matches: NoticeMatch[], details: DetailFilters): NoticeMatch[] {
  if (!hasDetails(details)) return matches;
  return matches.filter(({ notice }) => {
    const text = `${notice.title} ${notice.org}`;
    if (details.include.length > 0 && !details.include.some((word) => contains(text, word))) return false;
    if (details.exclude.some((word) => contains(text, word))) return false;
    if (details.localOnly && notice.regionCodes.length === 0) return false;
    return true;
  });
}

// 칩 하나 = 단어 하나 또는 전국 대상 제외
export type DetailChip = { kind: "include" | "exclude"; value: string } | { kind: "localOnly" };

export function toDetailChips(details: DetailFilters): DetailChip[] {
  return [
    ...details.include.map((value) => ({ kind: "include" as const, value })),
    ...details.exclude.map((value) => ({ kind: "exclude" as const, value })),
    ...(details.localOnly ? [{ kind: "localOnly" as const }] : []),
  ];
}

export function detailChipLabel(chip: DetailChip): string {
  if (chip.kind === "include") return `포함 ${chip.value}`;
  if (chip.kind === "exclude") return `제외 ${chip.value}`;
  return "전국 대상 제외";
}

export function withoutDetailChip(details: DetailFilters, chip: DetailChip): DetailFilters {
  if (chip.kind === "localOnly") return { ...details, localOnly: false };
  return { ...details, [chip.kind]: details[chip.kind].filter((word) => word !== chip.value) };
}
