import { describe, expect, it } from "vitest";
import type { BoardCard } from "./boardColumns";
import { visibleCards } from "./visibleCards";

// 판단에 쓰이는 공고 id만 채웁니다
function cardsOf(count: number): BoardCard[] {
  return Array.from({ length: count }, (_, i) => ({ match: { notice: { id: `n${i}` } } }) as BoardCard);
}

function idsOf(cards: BoardCard[]): string[] {
  return cards.map((card) => card.match.notice.id);
}

describe("visibleCards", () => {
  it("접혀 있으면 처음 5건만 보여줍니다", () => {
    expect(idsOf(visibleCards(cardsOf(7), false, new Set()))).toEqual(["n0", "n1", "n2", "n3", "n4"]);
  });

  it("펼치면 모두 보여줍니다", () => {
    expect(visibleCards(cardsOf(7), true, new Set())).toHaveLength(7);
  });

  it("먼저 보기 공고는 뒤에 있어도 접지 않고 순서를 유지합니다", () => {
    expect(idsOf(visibleCards(cardsOf(7), false, new Set(["n6"])))).toEqual(["n0", "n1", "n2", "n3", "n4", "n6"]);
  });
});
