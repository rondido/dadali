// 행정안전부 공공서비스(혜택) → 혜택톡톡 공고 (기획서 13장 다달이 분류 매핑)
// 공고가 아니라 늘 운영되는 서비스 목록이라 대부분 날짜가 없다. 날짜가 확실한 것만 기간으로, 나머지는 상시로 둔다
import type { AgeGroup, Industry, Topic } from "@/domain/search/conditionValues";
import { parseApplyPeriod } from "./dates";
import { cleanText, toSummary, unique, type NoticeRecord } from "./record";
import { sidoCodesOfOrg } from "./regions";

const GOV24_HOME = "https://www.gov.kr";

function listOf(value: unknown): string[] {
  return cleanText(value).split("||").map((s) => s.trim()).filter(Boolean);
}

// 서비스 분야·지원 유형 → 관심 주제
const TOPICS_BY_FIELD: Record<string, Topic[]> = {
  "주거·자립": ["house"],
  "고용·창업": ["job"],
  "보육·교육": ["edu"],
};
const TOPICS_BY_SUPPORT: Record<string, Topic[]> = {
  "현금(융자)": ["fund"],
  "서비스(일자리)": ["job"],
};

// 지원 대상 문장에서 나이대 단어를 찾는다. 한두 나이대만 분명하게 나올 때만 쓰고, 셋 다거나 없으면 전체 대상
function ageGroupsOf(target: string): AgeGroup[] {
  const groups: AgeGroup[] = [];
  if (/청년/.test(target)) groups.push("youth");
  if (/중장년|신중년/.test(target)) groups.push("middle");
  if (/노인|어르신|65세\s*이상/.test(target)) groups.push("senior");
  return groups.length === 3 ? [] : groups;
}

// 개인·가구 대상이면 "개인 혜택", 사업자·단체만 대상이면 "기업·소상공인"
function categoryOf(users: string[]): string {
  return users.some((u) => u === "개인" || u === "가구") || users.length === 0 ? "C01" : "C03";
}

function periodOf(item: Record<string, unknown>) {
  if (cleanText(item["신청기한유형"]) === "상시신청") {
    return { applyStart: null, applyEnd: null, isAlways: true, parseStatus: "ok" as const };
  }
  const period = parseApplyPeriod(cleanText(item["신청기한"]));
  if (period.kind === "range") {
    return { applyStart: period.start, applyEnd: period.end, isAlways: false, parseStatus: "ok" as const };
  }
  if (period.kind === "until") {
    return { applyStart: null, applyEnd: period.end, isAlways: false, parseStatus: "ok" as const };
  }
  // "연중", "수시", "별도 공고" 같은 문장은 상시로 보되 날짜가 없었다는 표시를 남긴다
  if (period.kind === "none") return { applyStart: null, applyEnd: null, isAlways: true, parseStatus: "no_date" as const };
  return { applyStart: null, applyEnd: null, isAlways: false, parseStatus: "check" as const };
}

export function fromGov24(item: Record<string, unknown>): NoticeRecord {
  const fields = listOf(item["서비스분야"]);
  const supports = listOf(item["지원유형"]);
  const org = cleanText(item["소관기관명"]);

  return {
    source: "gov24",
    sourceId: cleanText(item["서비스ID"]),
    title: cleanText(item["서비스명"]),
    org: org || "정부24",
    categoryId: categoryOf(listOf(item["사용자구분"])),
    ...periodOf(item),
    detailUrl: cleanText(item["상세조회URL"]) || GOV24_HOME,
    summaryText: toSummary(cleanText(item["서비스목적요약"])),
    topics: unique([
      ...fields.flatMap((f) => TOPICS_BY_FIELD[f] ?? []),
      ...supports.flatMap((s) => TOPICS_BY_SUPPORT[s] ?? []),
    ]),
    ageGroups: ageGroupsOf(cleanText(item["지원대상"])),
    regionCodes: sidoCodesOfOrg(org),
    industries: fields.includes("농림축산어업") ? (["agri"] satisfies Industry[]) : [],
    rawPayload: item,
  };
}
