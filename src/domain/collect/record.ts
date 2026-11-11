// 수집한 공고를 DB(notice 테이블)에 넣기 전 모양. 변환 규칙(kstartup.ts, gov24.ts)이 만들고 수집 스크립트가 저장한다
import type { IsoDate } from "@/domain/notice/notice";
import type { AgeGroup, Industry, RegionCode, Topic } from "@/domain/search/conditionValues";

export interface NoticeRecord {
  source: "kstartup" | "gov24";
  sourceId: string;
  title: string;
  org: string;
  categoryId: string;
  applyStart: IsoDate | null;
  applyEnd: IsoDate | null;
  isAlways: boolean;
  parseStatus: "ok" | "no_date" | "check";
  detailUrl: string;
  summaryText: string | null;
  topics: Topic[];
  ageGroups: AgeGroup[];
  regionCodes: RegionCode[];
  industries: Industry[];
  rawPayload: Record<string, unknown>;
}

// API 값은 HTML 특수문자가 엔티티로 오기도 한다 ("기술개발(R&amp;D)")
export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

// 줄바꿈·연속 공백을 한 칸으로
export function cleanText(value: unknown): string {
  return decodeEntities(String(value ?? "")).replace(/\s+/g, " ").trim();
}

const SUMMARY_MAX = 300;

// 지원 내용 요약은 300자까지 (DB 검사 규칙과 같다)
export function toSummary(text: string): string | null {
  const cleaned = cleanText(text);
  if (!cleaned) return null;
  return cleaned.length <= SUMMARY_MAX ? cleaned : `${cleaned.slice(0, SUMMARY_MAX - 1)}…`;
}

export function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
