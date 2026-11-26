// 열에서 지금 보여줄 카드 (기획서 F06 더보기). 처음 5건, "더보기"를 누를 때마다 20건씩 늘린다
// 열 안의 순서(마감·시작 빠른 순)를 그대로 따르고, "먼저 보기" 공고는 접혀서 안 보이는 일이 없게 항상 보여준다
import { BOARD_PREVIEW_COUNT, type BoardCard, type BoardColumn, type BoardColumnKey } from "./boardColumns";

export const LOAD_MORE_STEP = 20;

// 더보기를 n번 누른 열에 보여줄 개수
export function visibleLimit(loadMoreClicks: number, first: number = BOARD_PREVIEW_COUNT): number {
  return first + loadMoreClicks * LOAD_MORE_STEP;
}

// 상시 혜택은 수가 많아(수백~수천 건) 접수 중 공고를 묻히게 하므로, 처음에는 맞춤순 앞의 몇 건만 보이고 접어 둔다
export const ALWAYS_COLLAPSED_COUNT = 3;

// 조건과 태그로 분명히 맞은 공고 수 (맞춤순이라 열 앞쪽에 모여 있다)
function matchedCount(cards: BoardCard[]): number {
  return cards.filter((card) => (card.match.strength ?? 0) > 0).length;
}

// 검색 조건과 분명히 맞은 공고가 보드 어딘가에 있는지. 없으면(조건 없이 전체 보기, 단어로만 찾기) 접지 않는다
export function boardHasMatched(columns: BoardColumn[]): boolean {
  return columns.some((column) => matchedCount(column.cards) > 0);
}

// 구역에 보여줄 개수: 접힌 상시 구역은 ALWAYS_COLLAPSED_COUNT건, 펼치면 다른 구역처럼 처음 5건에 더보기마다 20건씩.
// 짧게 찾아도 맞는 공고가 바로 보이도록, 처음에는 분명히 맞은 공고까지만 보여준다
// (대상이 비어 "누구나"로 통과한 공고는 더보기 뒤로. 분명히 맞은 공고가 없는 구역은 처음에 한 줄도 보이지 않는다)
export function sectionLimit(
  key: BoardColumnKey,
  loadMoreClicks: number,
  alwaysExpanded: boolean,
  cards: BoardCard[] = [],
  foldUnmatched = false,
): number {
  const base = key === "always" && !alwaysExpanded ? ALWAYS_COLLAPSED_COUNT : BOARD_PREVIEW_COUNT;
  const first = foldUnmatched ? Math.min(base, matchedCount(cards)) : base;
  if (key === "always" && !alwaysExpanded) return first;
  return visibleLimit(loadMoreClicks, first);
}

export function visibleCards(cards: BoardCard[], limit: number, pinnedIds: ReadonlySet<string>): BoardCard[] {
  return cards.filter((card, index) => index < limit || pinnedIds.has(card.match.notice.id));
}

// 접을 때 분명히 맞은 공고가 없는 구역(처음에 한 줄도 안 보이는 구역)은 맨 아래로 보낸다. 빈 구역이 맨 위를 차지하지 않게
export function matchedSectionsFirst(sections: BoardColumn[]): BoardColumn[] {
  return [...sections].sort((a, b) => Number(matchedCount(a.cards) === 0) - Number(matchedCount(b.cards) === 0));
}
