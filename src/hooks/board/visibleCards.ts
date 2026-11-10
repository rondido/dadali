// 열에서 지금 보여줄 카드 (기획서 F06 더보기). "먼저 보기" 공고는 접혀서 안 보이는 일이 없게 항상 보여준다
import { BOARD_PREVIEW_COUNT, type BoardCard } from "./boardColumns";

export function visibleCards(cards: BoardCard[], expanded: boolean, pinnedIds: ReadonlySet<string>): BoardCard[] {
  if (expanded) return cards;
  return cards.filter((card, index) => index < BOARD_PREVIEW_COUNT || pinnedIds.has(card.match.notice.id));
}
