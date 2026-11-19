// 공공데이터의 날짜 표기를 "YYYY-MM-DD"로 바꾼다 (기획서 13장 날짜 변환)
import type { IsoDate } from "@/domain/notice/notice";

function toIso(year: number, month: number, day: number): IsoDate | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  // 2월 30일처럼 없는 날짜는 다음 달로 넘어가므로 되돌려 확인한다
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// K-Startup: "20261123" → "2026-11-23"
export function parseCompactDate(value: unknown): IsoDate | null {
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(String(value ?? "").trim());
  return match ? toIso(Number(match[1]), Number(match[2]), Number(match[3])) : null;
}

export type ApplyPeriod =
  | { kind: "range"; start: IsoDate; end: IsoDate }
  | { kind: "until"; end: IsoDate }
  | { kind: "unclear" } // 날짜처럼 보이지만 읽지 못함 → 확인 필요
  | { kind: "none" }; // 날짜가 없음 ("연중", "수시", "별도 공고")

// 연도가 있는 날짜: "2026.1.19.", "2026. 2. 1.", "2026-02-02", "2026년 3월 2일"
const YMD = String.raw`(20\d{2})\s*[.\-년]\s*(\d{1,2})\s*[.\-월]\s*(\d{1,2})\s*일?\.?`;
// 연도를 빼먹은 끝 날짜: "~ 12. 31."
const MD = String.raw`(\d{1,2})\s*[.\-월]\s*(\d{1,2})\s*일?\.?`;
const RANGE = new RegExp(`${YMD}\\s*(?:\\([^)]*\\))?\\s*[~∼～\\-–]\\s*(?:${YMD}|${MD})`);
const UNTIL = new RegExp(`${YMD}\\s*(?:\\([^)]*\\))?\\s*까지`);
const ANY_YMD = new RegExp(YMD);

// 행안부 신청기한 문장: 첫 번째 기간만 읽는다
export function parseApplyPeriod(text: string): ApplyPeriod {
  const range = RANGE.exec(text);
  if (range) {
    const [, sy, sm, sd, ey, em, ed, mm, md] = range;
    const startYear = Number(sy);
    const start = toIso(startYear, Number(sm), Number(sd));
    let end = ey ? toIso(Number(ey), Number(em), Number(ed)) : toIso(startYear, Number(mm), Number(md));
    // "2026.11.1 ~ 2.28"처럼 해를 넘기는데 끝 연도가 없으면 다음 해로 본다
    if (start && end && !ey && end < start) end = toIso(startYear + 1, Number(mm), Number(md));
    if (start && end && start <= end) return { kind: "range", start, end };
    return { kind: "unclear" };
  }

  const until = UNTIL.exec(text);
  if (until) {
    const end = toIso(Number(until[1]), Number(until[2]), Number(until[3]));
    return end ? { kind: "until", end } : { kind: "unclear" };
  }

  return ANY_YMD.test(text) ? { kind: "unclear" } : { kind: "none" };
}
