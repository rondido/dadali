import { describe, expect, it } from "vitest";
import type { BoardCard } from "./boardColumns";
import {
  ALWAYS_COLLAPSED_COUNT,
  LOAD_MORE_STEP,
  boardHasMatched,
  matchedSectionsFirst,
  sectionLimit,
  visibleCards,
  visibleLimit,
} from "./visibleCards";

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

describe("sectionLimit", () => {
  it("상시 구역은 펼치기 전까지 3건만 보여줍니다", () => {
    expect(sectionLimit("always", 0, false)).toBe(ALWAYS_COLLAPSED_COUNT);
    expect(ALWAYS_COLLAPSED_COUNT).toBe(3);
  });

  it("상시 구역을 펼치면 다른 구역처럼 5건에 더보기마다 20건씩 늘어납니다", () => {
    expect(sectionLimit("always", 0, true)).toBe(5);
    expect(sectionLimit("always", 1, true)).toBe(5 + LOAD_MORE_STEP);
  });

  it("접수 중·접수 예정 구역은 펼침과 상관없이 처음 5건입니다", () => {
    expect(sectionLimit("ongoing", 0, false)).toBe(5);
    expect(sectionLimit("upcoming", 1, false)).toBe(5 + LOAD_MORE_STEP);
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

// 앞의 matched건은 조건과 분명히 맞은 공고, 나머지는 대상이 비어 통과한 공고 (맞춤순이라 앞에 모인다)
function rankedCards(matched: number, rest: number): BoardCard[] {
  return Array.from({ length: matched + rest }, (_, i) => ({ match: { notice: { id: `n${i}` }, strength: i < matched ? 1 : 0 } }) as BoardCard);
}

describe("분명히 맞은 공고 먼저 (짧게 찾아도 맞는 공고만 바로 보이게)", () => {
  it("처음에는 분명히 맞은 공고까지만 보이고, 더보기를 누르면 20건씩 늘어납니다", () => {
    const cards = rankedCards(3, 171);
    expect(sectionLimit("ongoing", 0, false, cards, true)).toBe(3);
    expect(sectionLimit("ongoing", 1, false, cards, true)).toBe(3 + LOAD_MORE_STEP);
  });

  it("분명히 맞은 공고가 5건보다 많으면 처음 5건입니다", () => {
    expect(sectionLimit("ongoing", 0, false, rankedCards(62, 171), true)).toBe(5);
  });

  it("분명히 맞은 공고가 없는 구역은 처음에 한 줄도 보이지 않습니다", () => {
    expect(sectionLimit("upcoming", 0, false, rankedCards(0, 7), true)).toBe(0);
    expect(sectionLimit("always", 0, false, rankedCards(0, 7), true)).toBe(0);
  });

  it("접힌 상시 구역은 분명히 맞은 공고 중 3건까지입니다", () => {
    expect(sectionLimit("always", 0, false, rankedCards(300, 0), true)).toBe(ALWAYS_COLLAPSED_COUNT);
    expect(sectionLimit("always", 0, false, rankedCards(2, 50), true)).toBe(2);
  });

  it("접지 않을 때(전체 보기, 단어로만 찾기, 마감순)는 예전처럼 5건입니다", () => {
    expect(sectionLimit("ongoing", 0, false, rankedCards(0, 50), false)).toBe(5);
  });

  it("보드 어디에도 분명히 맞은 공고가 없으면 접지 않습니다", () => {
    const column = (cards: BoardCard[]) => ({ key: "ongoing" as const, title: "접수 중", cards });
    expect(boardHasMatched([column(rankedCards(0, 9)), column(rankedCards(0, 3))])).toBe(false);
    expect(boardHasMatched([column(rankedCards(0, 9)), column(rankedCards(1, 3))])).toBe(true);
  });
});

describe("matchedSectionsFirst", () => {
  it("분명히 맞은 공고가 없는 구역은 순서를 지킨 채 맨 아래로 갑니다", () => {
    const column = (key: "always" | "ongoing" | "upcoming", cards: BoardCard[]) => ({ key, title: key, cards });
    const sorted = matchedSectionsFirst([column("always", rankedCards(0, 5)), column("ongoing", rankedCards(2, 5)), column("upcoming", rankedCards(1, 0))]);
    expect(sorted.map((c) => c.key)).toEqual(["ongoing", "upcoming", "always"]);
  });
});
