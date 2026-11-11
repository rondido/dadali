import { describe, expect, it } from "vitest";
import type { BoardCard } from "./boardColumns";
import { LOAD_MORE_STEP, visibleCards, visibleLimit } from "./visibleCards";

// 판단에 쓰이는 공고 id만 채웁니다
function cardsOf(count: number): BoardCard[] {
  return Array.from({ length: count }, (_, i) => ({ match: { notice: { id: `n${i}` } } }) as BoardCard);
}

function idsOf(cards: BoardCard[]): string[] {
  return cards.map((card) => card.match.notice.id);
}

describe("visibleLimit", () => {
  it("더보기를 누르지 않으면 5건입니다", () => {
    expect(visibleLimit(0)).toBe(5);
  });

  it("더보기를 누를 때마다 20건씩 늘어납니다", () => {
    expect(visibleLimit(1)).toBe(5 + LOAD_MORE_STEP);
    expect(visibleLimit(2)).toBe(5 + LOAD_MORE_STEP * 2);
  });
});

describe("visibleCards", () => {
  it("보여줄 개수까지만 앞에서부터 보여줍니다", () => {
    expect(idsOf(visibleCards(cardsOf(7), 5, new Set()))).toEqual(["n0", "n1", "n2", "n3", "n4"]);
  });

  it("보여줄 개수가 남은 카드보다 많으면 모두 보여줍니다", () => {
    expect(visibleCards(cardsOf(7), 25, new Set())).toHaveLength(7);
  });

  it("363건 중 더보기를 한 번 누르면 25건만 보여줍니다", () => {
    expect(visibleCards(cardsOf(363), visibleLimit(1), new Set())).toHaveLength(25);
  });

  it("먼저 보기 공고는 뒤에 있어도 접지 않고 순서를 유지합니다", () => {
    expect(idsOf(visibleCards(cardsOf(7), 5, new Set(["n6"])))).toEqual(["n0", "n1", "n2", "n3", "n4", "n6"]);
  });
});
