import type { IsoDate } from "@/domain/notice/noticeMarkers";

// "2026-11-02" → "11.02" (카드·기간 막대처럼 좁은 자리에 쓰는 날짜 표기)
export function formatShortDate(date: IsoDate): string {
  return date.slice(5).replace("-", ".");
}
