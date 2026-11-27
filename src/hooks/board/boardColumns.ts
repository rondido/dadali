// 검색 결과를 접수 예정·접수 중·상시 세 열로 나눈다 (상태 보드 전용, 기획서 5장 상태 정의)
// 마감된 공고는 보드에 넣지 않는다
import type { IsoDate, Notice } from "@/domain/notice/notice";
import { noticeStatusOf, statusBadgeOf, type NoticeStatus } from "@/domain/notice/noticeStatus";
import { targetBreadthOf, type NoticeMatch } from "@/domain/search/matchNotices";

export type BoardColumnKey = "upcoming" | "ongoing" | "always";

// 열 안의 순서: 맞춤순(조건과 분명히 맞은 공고 먼저) 또는 마감순(열의 원래 순서: 시작·마감 빠른 순, 이름순)
export type BoardOrder = "match" | "deadline";

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

type Compare = (a: Notice, b: Notice) => number;

const byTitle: Compare = (a, b) => a.title.localeCompare(b.title, "ko");
const byStart: Compare = (a, b) => (a.applyStart ?? "").localeCompare(b.applyStart ?? "") || byTitle(a, b);
const byEnd: Compare = (a, b) => (a.applyEnd ?? "9999").localeCompare(b.applyEnd ?? "9999") || byTitle(a, b);
// 상시는 마감이 없으므로 많이 찾는 혜택(출처 조회수)부터. 조회수가 없으면 0으로 보고 이름순
const byViews: Compare = (a, b) => (b.views ?? 0) - (a.views ?? 0) || byTitle(a, b);

// 열 순서, 각 열에 들어가는 접수 상태, 열 안의 정렬 기준 (검색 조건과 분명히 맞은 정도 다음에 쓴다)
const COLUMNS: { key: BoardColumnKey; title: string; statuses: NoticeStatus[]; compare: Compare }[] = [
  { key: "upcoming", title: "접수 예정", statuses: ["upcoming"], compare: byStart },
  { key: "ongoing", title: "접수 중", statuses: ["open", "closing"], compare: byEnd },
  { key: "always", title: "상시", statuses: ["always"], compare: byViews },
];

// 공고 하나를 목록 줄 데이터로 (상태·배지). 마감된 공고도 "마감" 배지로 만든다 (최근 본 공고 목록에서 쓴다)
export function boardCardOf(match: NoticeMatch, today: IsoDate): BoardCard {
  const { label, urgent } = statusBadgeOf(match.notice, today);
  return { match, status: noticeStatusOf(match.notice, today), badge: label, urgent };
}

export function toBoardColumns(matches: NoticeMatch[], today: IsoDate, order: BoardOrder = "match"): BoardColumn[] {
  const withStatus = matches.map((match) => ({ match, status: noticeStatusOf(match.notice, today) }));

  return COLUMNS.map(({ key, title, statuses, compare }) => ({
    key,
    title,
    cards: withStatus
      .filter(({ status }) => statuses.includes(status))
      // 맞춤순: 조건과 태그로 분명히 맞은 공고가 먼저, 그다음 대상이 적게 붙은(그 처지 전용) 공고, 시·도 전체 공고가 시·군·구 공고보다 먼저,
      // 같으면 열의 원래 순서(시작·마감 빠른 순, 이름순). 마감순은 열의 원래 순서만 쓴다
      .sort(
        (a, b) =>
          (order === "match"
            ? (b.match.strength ?? 0) - (a.match.strength ?? 0) ||
              targetBreadthOf(a.match) - targetBreadthOf(b.match) ||
              Number(a.match.local ?? false) - Number(b.match.local ?? false)
            : 0) || compare(a.match.notice, b.match.notice),
      )
      .map(({ match }) => boardCardOf(match, today)),
  }));
}

// 목록에 보여줄 구역 순서. 조건에 맞는 상시 혜택이 있으면 맨 위에 둔다:
// 접힌 상시 구역은 많이 찾는 대표 혜택 몇 건이라(국민취업지원제도 등), 검색하자마자 눈에 들어오는 첫 줄이 된다.
// 상시 혜택이 없으면(조건 없이 전체 보기 등) 접수 중 → 접수 예정 → 상시 순서
export function sectionOrderOf(columns: BoardColumn[]): BoardColumn[] {
  const byKey = (key: BoardColumnKey) => columns.filter((column) => column.key === key);
  const alwaysFirst = byKey("always").some((column) => column.cards.length > 0);
  const order: BoardColumnKey[] = alwaysFirst ? ["always", "ongoing", "upcoming"] : ["ongoing", "upcoming", "always"];
  return order.flatMap(byKey);
}
