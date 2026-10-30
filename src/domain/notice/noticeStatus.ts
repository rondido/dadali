// 공고의 접수 상태 (기획서 5장 상태 정의, 13장 마감 처리). 보드·상세 등 어떤 뷰에서도 같은 규칙을 쓴다.
import { daysBetween } from "@/domain/date/daysBetween";
import { isNoticeClosed, type IsoDate, type NoticeSchedule } from "./notice";

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

// 진행 중 배지: 당일은 "오늘 마감", 그 외 "D-4"
export function formatDDay(daysLeft: number): string {
  return daysLeft === 0 ? "오늘 마감" : `D-${daysLeft}`;
}

// 진행 예정 배지: "내일 시작", "3일 후 시작"
export function formatStartsIn(daysUntil: number): string {
  return daysUntil === 1 ? "내일 시작" : `${daysUntil}일 후 시작`;
}

export interface PeriodProgress {
  day: number; // 오늘이 접수 기간의 며칠째인지 (첫날 = 1)
  total: number; // 접수 기간 전체 일수 (시작일·마감일 포함)
}

// 접수 중인 공고가 기간 중 얼마나 지났는지 ("15일 중 4일째"). 접수 중이 아니거나 날짜가 없으면 null
export function periodProgressOf(notice: NoticeSchedule, today: IsoDate): PeriodProgress | null {
  const { applyStart, applyEnd } = notice;
  if (notice.isAlways || !applyStart || !applyEnd || today < applyStart || today > applyEnd) return null;
  return { day: daysBetween(applyStart, today) + 1, total: daysBetween(applyStart, applyEnd) + 1 };
}

export interface NoticeSummary {
  ongoing: number; // 진행 중 (마감 임박 포함)
  closingThisWeek: number; // 7일 안에 마감
  startingSoon: number; // 7일 안에 시작
}

// 첫 화면·보드 위 요약 ("지금 진행 중 N건 · 이번 주 마감 N건 · 7일 안에 시작 N건")
export function summarizeNotices(notices: NoticeSchedule[], today: IsoDate): NoticeSummary {
  const summary: NoticeSummary = { ongoing: 0, closingThisWeek: 0, startingSoon: 0 };
  for (const notice of notices) {
    const status = noticeStatusOf(notice, today);
    if (status === "open" || status === "closing") summary.ongoing += 1;
    if (status === "closing") summary.closingThisWeek += 1;
    if (status === "upcoming" && daysBetween(today, notice.applyStart!) <= CLOSING_SOON_DAYS) summary.startingSoon += 1;
  }
  return summary;
}

// 7일 안에 마감하는 공고를 마감 빠른 순으로 (첫 화면 "이번 주 마감" 카드)
export function closingThisWeek<T extends NoticeSchedule>(notices: T[], today: IsoDate): T[] {
  return notices
    .filter((n) => noticeStatusOf(n, today) === "closing")
    .sort((a, b) => a.applyEnd!.localeCompare(b.applyEnd!) || a.title.localeCompare(b.title, "ko"));
}
