// 검색 결과를 진행 예정·진행 중·상시 세 열로 나눈다 (상태 보드 전용, 기획서 5장 상태 정의)
// 마감된 공고는 보드에 넣지 않는다
import { daysBetween } from "@/domain/date/daysBetween";
import type { IsoDate, NoticeSchedule } from "@/domain/notice/notice";
import {
  formatDDay,
  formatStartsIn,
  noticeStatusOf,
  periodProgressOf,
  type NoticeStatus,
  type PeriodProgress,
} from "@/domain/notice/noticeStatus";
import type { NoticeMatch } from "@/domain/search/matchNotices";

export type BoardColumnKey = "upcoming" | "ongoing" | "always";

// 열마다 처음에 보여줄 카드 수. 나머지는 "N건 더보기"로 펼친다
export const BOARD_PREVIEW_COUNT = 5;

export interface BoardCard {
  match: NoticeMatch;
  status: NoticeStatus;
  badge: string; // "3일 후 시작", "D-4", "오늘 마감", "상시"
  urgent: boolean; // 마감 7일 이내 → 빨간색
  progress: PeriodProgress | null; // 진행 중 카드의 기간 막대
}

export interface BoardColumn {
  key: BoardColumnKey;
  title: string;
  cards: BoardCard[];
}

type Compare = (a: NoticeSchedule, b: NoticeSchedule) => number;

const byTitle: Compare = (a, b) => a.title.localeCompare(b.title, "ko");
const byStart: Compare = (a, b) => (a.applyStart ?? "").localeCompare(b.applyStart ?? "") || byTitle(a, b);
const byEnd: Compare = (a, b) => (a.applyEnd ?? "9999").localeCompare(b.applyEnd ?? "9999") || byTitle(a, b);

// 열 순서, 각 열에 들어가는 접수 상태, 열 안의 정렬 기준
const COLUMNS: { key: BoardColumnKey; title: string; statuses: NoticeStatus[]; compare: Compare }[] = [
  { key: "upcoming", title: "진행 예정", statuses: ["upcoming"], compare: byStart },
  { key: "ongoing", title: "진행 중", statuses: ["open", "closing"], compare: byEnd },
  { key: "always", title: "상시", statuses: ["always"], compare: byTitle },
];

function badgeOf(notice: NoticeSchedule, status: NoticeStatus, today: IsoDate): string {
  if (status === "upcoming") return formatStartsIn(daysBetween(today, notice.applyStart!));
  if (status === "always") return "상시";
  return notice.applyEnd ? formatDDay(daysBetween(today, notice.applyEnd)) : "접수 중";
}

export function toBoardColumns(matches: NoticeMatch[], today: IsoDate): BoardColumn[] {
  const withStatus = matches.map((match) => ({ match, status: noticeStatusOf(match.notice, today) }));

  return COLUMNS.map(({ key, title, statuses, compare }) => ({
    key,
    title,
    cards: withStatus
      .filter(({ status }) => statuses.includes(status))
      .sort((a, b) => compare(a.match.notice, b.match.notice))
      .map(({ match, status }) => ({
        match,
        status,
        badge: badgeOf(match.notice, status, today),
        urgent: status === "closing",
        progress: periodProgressOf(match.notice, today),
      })),
  }));
}
