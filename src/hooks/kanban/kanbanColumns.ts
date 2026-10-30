// 공고를 진행 예정·진행 중·상시 세 열로 나눈다 (칸반 뷰 전용). 마감된 공고는 칸반에 넣지 않는다.
import { daysBetween } from "@/domain/date/daysBetween";
import type { IsoDate, NoticeSchedule } from "@/domain/notice/noticeMarkers";
import { formatDDay, noticeStatusOf, type NoticeStatus } from "@/domain/notice/noticeStatus";

export type KanbanColumnKey = "upcoming" | "ongoing" | "always";

export interface KanbanCard {
  notice: NoticeSchedule;
  status: NoticeStatus;
  // 진행 중(마감 임박 포함)일 때만 "D-4" 같은 표시, 그 외는 null
  dDay: string | null;
}

export interface KanbanColumn {
  key: KanbanColumnKey;
  title: string;
  cards: KanbanCard[];
}

type Compare = (a: NoticeSchedule, b: NoticeSchedule) => number;

const byTitle: Compare = (a, b) => a.title.localeCompare(b.title, "ko");
const byStart: Compare = (a, b) => (a.applyStart ?? "").localeCompare(b.applyStart ?? "") || byTitle(a, b);
const byEnd: Compare = (a, b) => (a.applyEnd ?? "9999").localeCompare(b.applyEnd ?? "9999") || byTitle(a, b);

// 열 순서, 각 열에 들어가는 접수 상태, 열 안의 정렬 기준
const COLUMNS: { key: KanbanColumnKey; title: string; statuses: NoticeStatus[]; compare: Compare }[] = [
  { key: "upcoming", title: "진행 예정", statuses: ["upcoming"], compare: byStart },
  { key: "ongoing", title: "진행 중", statuses: ["open", "closing"], compare: byEnd },
  { key: "always", title: "상시", statuses: ["always"], compare: byTitle },
];

function dDayOf(notice: NoticeSchedule, status: NoticeStatus, today: IsoDate): string | null {
  if ((status !== "open" && status !== "closing") || !notice.applyEnd) return null;
  return formatDDay(daysBetween(today, notice.applyEnd));
}

export function toKanbanColumns(notices: NoticeSchedule[], today: IsoDate): KanbanColumn[] {
  const withStatus = notices.map((notice) => ({ notice, status: noticeStatusOf(notice, today) }));

  return COLUMNS.map(({ key, title, statuses, compare }) => ({
    key,
    title,
    cards: withStatus
      .filter(({ status }) => statuses.includes(status))
      .sort((a, b) => compare(a.notice, b.notice))
      .map(({ notice, status }) => ({ notice, status, dDay: dDayOf(notice, status, today) })),
  }));
}
