// 검색 결과를 접수 예정·접수 중·상시 세 열로 나눈다 (상태 보드 전용, 기획서 5장 상태 정의)
// 마감된 공고는 보드에 넣지 않는다
import type { IsoDate, NoticeSchedule } from "@/domain/notice/notice";
import { noticeStatusOf, statusBadgeOf, type NoticeStatus } from "@/domain/notice/noticeStatus";
import type { NoticeMatch } from "@/domain/search/matchNotices";

export type BoardColumnKey = "upcoming" | "ongoing" | "always";

// 열마다 처음에 보여줄 카드 수. 나머지는 "N건 더보기"로 펼친다
export const BOARD_PREVIEW_COUNT = 5;

export interface BoardCard {
  match: NoticeMatch;
  status: NoticeStatus;
  badge: string; // "3일 후 시작", "D-4", "오늘 마감", "상시"
  urgent: boolean; // 마감 7일 이내 → 빨간색
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

// 열 순서, 각 열에 들어가는 접수 상태, 열 안의 정렬 기준 (검색 조건과 분명히 맞은 정도 다음에 쓴다)
const COLUMNS: { key: BoardColumnKey; title: string; statuses: NoticeStatus[]; compare: Compare }[] = [
  { key: "upcoming", title: "접수 예정", statuses: ["upcoming"], compare: byStart },
  { key: "ongoing", title: "접수 중", statuses: ["open", "closing"], compare: byEnd },
  { key: "always", title: "상시", statuses: ["always"], compare: byTitle },
];

// 공고 하나를 목록 줄 데이터로 (상태·배지). 마감된 공고도 "마감" 배지로 만든다 (최근 본 공고 목록에서 쓴다)
export function boardCardOf(match: NoticeMatch, today: IsoDate): BoardCard {
  const { label, urgent } = statusBadgeOf(match.notice, today);
  return { match, status: noticeStatusOf(match.notice, today), badge: label, urgent };
}

export function toBoardColumns(matches: NoticeMatch[], today: IsoDate): BoardColumn[] {
  const withStatus = matches.map((match) => ({ match, status: noticeStatusOf(match.notice, today) }));

  return COLUMNS.map(({ key, title, statuses, compare }) => ({
    key,
    title,
    cards: withStatus
      .filter(({ status }) => statuses.includes(status))
      // 조건과 태그로 분명히 맞은 공고가 먼저, 그다음 시·도 전체 공고가 시·군·구 공고보다 먼저,
      // 같으면 열의 원래 순서(시작·마감 빠른 순, 이름순)
      .sort(
        (a, b) =>
          (b.match.strength ?? 0) - (a.match.strength ?? 0) ||
          Number(a.match.local ?? false) - Number(b.match.local ?? false) ||
          compare(a.match.notice, b.match.notice),
      )
      .map(({ match }) => boardCardOf(match, today)),
  }));
}
