// 검색 조건으로 공고를 거르고, 카드에 붙일 "왜 걸렸는지" 태그를 만든다 (기획서 5-1장 칩 규칙)
// 조건 사이는 "그리고", 관심 주제끼리는 "또는". 대상·지역·업종이 비어 있는 공고는 전체 대상으로 보고 통과시킨다
import type { Notice } from "@/domain/notice/notice";
import { ageLabel, industryLabel, regionLabel, topicLabel } from "./conditionValues";
import type { SearchConditions } from "./conditions";

export interface NoticeMatch {
  notice: Notice;
  reasons: string[]; // 예: ["서울", "시설·인테리어"]
}

export interface MatchResult {
  matches: NoticeMatch[];
  // 공고명·지원 내용 요약에서 찾아 결과를 좁히는 데 쓴 단어 (기획서 F07 남은 단어 검색)
  usedKeywords: string[];
}

// 한 가지 조건(지역·나이대·하는 일)을 판정한다: 통과 못 하면 null, 통과하면 붙일 태그(없으면 빈 배열)
function checkOne(selected: string | null, values: string[], label: (v: string) => string, emptyLabel?: string) {
  if (selected === null) return [];
  if (values.length === 0) return emptyLabel ? [emptyLabel] : [];
  return values.includes(selected) ? [label(selected)] : null;
}

function matchConditions(notice: Notice, conditions: SearchConditions): string[] | null {
  const region = checkOne(conditions.region, notice.regionCodes, regionLabel, "전국");
  const age = checkOne(conditions.age, notice.ageGroups, ageLabel);
  const biz = checkOne(conditions.biz, notice.industries, industryLabel);
  if (!region || !age || !biz) return null;

  const topics = conditions.topics.filter((t) => notice.topics.includes(t));
  if (conditions.topics.length > 0 && topics.length === 0) return null;

  return [...region, ...age, ...biz, ...topics.map(topicLabel)];
}

function containsKeyword(notice: Notice, keyword: string): boolean {
  return notice.title.includes(keyword) || notice.summary.includes(keyword);
}

export function matchNotices(notices: Notice[], conditions: SearchConditions, keywords: string[] = []): MatchResult {
  const matches = notices.flatMap((notice) => {
    const reasons = matchConditions(notice, conditions);
    return reasons ? [{ notice, reasons }] : [];
  });

  // 어느 공고에도 없는 단어로 결과를 0건으로 만들지 않도록, 한 건이라도 걸리는 단어만 쓴다
  const usedKeywords = keywords.filter((k) => matches.some((m) => containsKeyword(m.notice, k)));
  if (usedKeywords.length === 0) return { matches, usedKeywords };

  return {
    usedKeywords,
    matches: matches
      .filter((m) => usedKeywords.some((k) => containsKeyword(m.notice, k)))
      .map((m) => ({
        ...m,
        reasons: [...m.reasons, ...usedKeywords.filter((k) => containsKeyword(m.notice, k)).map((k) => `"${k}"`)],
      })),
  };
}
