// 검색 조건으로 공고를 거르고, 카드에 붙일 "왜 걸렸는지" 태그를 만든다 (기획서 5-1장 칩 규칙)
// 조건 사이는 "그리고", 관심 주제끼리는 "또는". 대상·지역·업종이 비어 있는 공고는 전체 대상으로 보고 통과시킨다
// 시·군·구를 정하면 같은 시·도의 다른 시·군·구 기관 공고(대개 그 주민만 대상)를 뺀다. 시·군·구는 기관명에서 읽는다
import type { Notice } from "@/domain/notice/notice";
import { ageLabel, industryLabel, regionLabel, targetLabel, topicLabel } from "./conditionValues";
import type { SearchConditions } from "./conditions";
import { orgDistrictOf } from "./districts";

export interface NoticeMatch {
  notice: Notice;
  reasons: string[]; // 예: ["서울", "시설·인테리어"]
  // 조건과 태그로 분명히 맞은 개수 (지역·나이대·대상·하는 일 각 1, 맞은 주제마다 1). 대상이 비어 통과한 것은 세지 않는다
  // 보드 열 안에서 분명히 맞은 공고를 먼저 보여주는 데 쓴다. 관심·최근 공고처럼 검색과 무관한 목록은 없다(0)
  strength?: number;
  // 시·도로만 찾았을 때 시·군·구 기관의 공고 (시·도 전체·전국 공고 뒤에 보여준다)
  local?: boolean;
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

// 공고를 낸 기관이 찾는 시·도 안의 시·군·구인지: 같은 시·군·구면 "same", 다른 시·군·구면 "other", 아니면 null
function districtRelation(notice: Notice, conditions: SearchConditions): "same" | "other" | null {
  if (conditions.region === null) return null;
  const org = orgDistrictOf(notice.org);
  if (!org || !org.regions.includes(conditions.region)) return null;
  return org.name === conditions.district ? "same" : "other";
}

function matchConditions(notice: Notice, conditions: SearchConditions): string[] | null {
  const relation = districtRelation(notice, conditions);
  if (conditions.district !== null && relation === "other") return null;
  const region =
    relation === "same" ? [conditions.district!] : checkOne(conditions.region, notice.regionCodes, regionLabel, "전국");
  // 미성년자 전용 공고는 어른 나이대(청년·중장년·어르신)로 찾을 때 대상이 아니다
  if (conditions.age !== null && conditions.age !== "child" && notice.minorsOnly) return null;
  const age = checkOne(conditions.age, notice.ageGroups, ageLabel);
  // 대상(가구 상황)이 정해진 공고는 그 대상으로 찾을 때만, 비어 있으면 누구나 대상으로 통과한다 (나이대와 같은 규칙)
  const target = checkOne(conditions.target, notice.targets ?? [], targetLabel);
  const biz = checkOne(conditions.biz, notice.industries, industryLabel);
  if (!region || !age || !target || !biz) return null;

  const topics = conditions.topics.filter((t) => notice.topics.includes(t));
  if (conditions.topics.length > 0 && topics.length === 0) return null;

  return [...region, ...age, ...target, ...biz, ...topics.map(topicLabel)];
}

// 통과한 공고가 조건과 태그로 분명히 맞은 개수
export function strengthOf(notice: Notice, conditions: SearchConditions): number {
  const hits = (selected: string | null, values: string[]) => (selected !== null && values.includes(selected) ? 1 : 0);
  return (
    hits(conditions.region, notice.regionCodes) +
    (conditions.district !== null && districtRelation(notice, conditions) === "same" ? 1 : 0) +
    hits(conditions.age, notice.ageGroups) +
    hits(conditions.target, notice.targets ?? []) +
    hits(conditions.biz, notice.industries) +
    conditions.topics.filter((t) => notice.topics.includes(t)).length
  );
}

function containsKeyword(notice: Notice, keyword: string): boolean {
  return notice.title.includes(keyword) || notice.summary.includes(keyword);
}

export function matchNotices(notices: Notice[], conditions: SearchConditions, keywords: string[] = []): MatchResult {
  const matches = notices.flatMap((notice) => {
    const reasons = matchConditions(notice, conditions);
    if (!reasons) return [];
    const local = conditions.district === null && districtRelation(notice, conditions) === "other";
    return [{ notice, reasons, strength: strengthOf(notice, conditions), ...(local ? { local } : {}) }];
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
