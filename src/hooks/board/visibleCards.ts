// 열에서 지금 보여줄 카드 (기획서 F06 더보기). 처음 5건, "더보기"를 누를 때마다 20건씩 늘린다
// 열 안의 순서(마감·시작 빠른 순)를 그대로 따르고, "먼저 보기" 공고는 접혀서 안 보이는 일이 없게 항상 보여준다
import { BOARD_PREVIEW_COUNT, type BoardCard } from "./boardColumns";

export const LOAD_MORE_STEP = 20;

// 더보기를 n번 누른 열에 보여줄 개수
export function visibleLimit(loadMoreClicks: number): number {
  return BOARD_PREVIEW_COUNT + loadMoreClicks * LOAD_MORE_STEP;
}

export function visibleCards(cards: BoardCard[], limit: number, pinnedIds: ReadonlySet<string>): BoardCard[] {
  return cards.filter((card, index) => index < limit || pinnedIds.has(card.match.notice.id));
}
