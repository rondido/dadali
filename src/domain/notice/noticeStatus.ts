// 공고의 접수 상태 (기획서 5장 D-day, 13장 마감 처리). 칸반·목록 등 어떤 뷰에서도 같은 규칙을 쓴다.
import { daysBetween } from "@/domain/date/daysBetween";
import { isNoticeClosed, type IsoDate, type NoticeSchedule } from "./noticeMarkers";

export type NoticeStatus = "upcoming" | "open" | "closing" | "closed" | "always";

// 마감 7일 전(D-7)부터 마감 임박으로 본다
export const CLOSING_SOON_DAYS = 7;

export function noticeStatusOf(notice: NoticeSchedule, today: IsoDate): NoticeStatus {
  if (notice.isAlways) return "always";
  if (isNoticeClosed(notice, today)) return "closed";
  if (notice.applyStart && notice.applyStart > today) return "upcoming";
  if (notice.applyEnd && daysBetween(today, notice.applyEnd) <= CLOSING_SOON_DAYS) return "closing";
  return "open";
}

export function formatDDay(daysLeft: number): string {
  return daysLeft === 0 ? "D-day" : `D-${daysLeft}`;
}
