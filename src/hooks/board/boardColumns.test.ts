import { describe, expect, it } from "vitest";
import type { Notice } from "@/domain/notice/notice";
import { toBoardColumns, type BoardColumnKey } from "./boardColumns";

// 테스트마다 달라지는 값만 넘기고, 나머지는 판단에 영향이 없는 기본값으로 채웁니다
function noticeOf(overrides: Partial<Notice>): Notice {
  return {
    id: "n1",
    title: "공고",
    categoryId: "C02",
    applyStart: null,
    applyEnd: null,
    isAlways: false,
    org: "기관",
    summary: "",
    ageGroups: [],
    regionCodes: [],
    industries: [],
    topics: [],
    detailUrl: null,
    sourceName: "출처",
    sourceUrl: "https://www.gov.kr",
    ...overrides,
  };
}

const TODAY = "2026-11-10";

function columnsOf(notices: Notice[]) {
  return toBoardColumns(
    notices.map((notice) => ({ notice, reasons: [] })),
    TODAY,
  );
}

function cardsIn(notices: Notice[], key: BoardColumnKey) {
  return columnsOf(notices).find((c) => c.key === key)!.cards;
}

function idsIn(notices: Notice[], key: BoardColumnKey): string[] {
  return cardsIn(notices, key).map((c) => c.match.notice.id);
}

describe("toBoardColumns", () => {
  it("진행 예정 → 진행 중 → 상시 순서로 세 열을 만듭니다", () => {
    expect(columnsOf([]).map((c) => c.title)).toEqual(["진행 예정", "진행 중", "상시"]);
  });

  describe("열 나누기", () => {
    it("접수 시작 전인 공고는 진행 예정 열에 넣습니다", () => {
      const notice = noticeOf({ id: "upcoming", applyStart: "2026-11-20", applyEnd: "2026-11-30" });

      expect(idsIn([notice], "upcoming")).toEqual(["upcoming"]);
    });

    it("마감 7일 안에 든 공고도 따로 나누지 않고 진행 중 열에 넣습니다", () => {
      const notices = [
        noticeOf({ id: "open", applyStart: "2026-11-01", applyEnd: "2026-11-30" }),
        noticeOf({ id: "closing", applyStart: "2026-11-01", applyEnd: "2026-11-14" }),
      ];

      expect(idsIn(notices, "ongoing")).toEqual(["closing", "open"]);
    });

    it("상시 모집 공고는 상시 열에 넣습니다", () => {
      const notice = noticeOf({ id: "always", isAlways: true });

      expect(idsIn([notice], "always")).toEqual(["always"]);
    });

    it("마감된 공고는 어느 열에도 넣지 않습니다", () => {
      const notice = noticeOf({ applyStart: "2026-11-01", applyEnd: "2026-11-05" });

      expect(columnsOf([notice]).flatMap((c) => c.cards)).toEqual([]);
    });
  });

  describe("열 안의 정렬", () => {
    it("진행 예정 열은 시작일이 빠른 순으로 정렬합니다", () => {
      const notices = [
        noticeOf({ id: "late", applyStart: "2026-11-25" }),
        noticeOf({ id: "soon", applyStart: "2026-11-12" }),
      ];

      expect(idsIn(notices, "upcoming")).toEqual(["soon", "late"]);
    });

    it("진행 중 열은 마감일이 빠른 순으로 정렬합니다", () => {
      const notices = [
        noticeOf({ id: "late", applyStart: "2026-11-01", applyEnd: "2026-12-20" }),
        noticeOf({ id: "soon", applyStart: "2026-11-01", applyEnd: "2026-11-30" }),
      ];

      expect(idsIn(notices, "ongoing")).toEqual(["soon", "late"]);
    });

    it("상시 열은 공고명 가나다순으로 정렬합니다", () => {
      const notices = [
        noticeOf({ id: "b", title: "나 공고", isAlways: true }),
        noticeOf({ id: "a", title: "가 공고", isAlways: true }),
      ];

      expect(idsIn(notices, "always")).toEqual(["a", "b"]);
    });
  });

  describe("카드 배지", () => {
    it("진행 중 카드에는 마감까지 남은 D-day를 붙입니다", () => {
      const [card] = cardsIn([noticeOf({ applyStart: "2026-11-01", applyEnd: "2026-11-30" })], "ongoing");

      expect(card).toMatchObject({ badge: "D-20", urgent: false });
    });

    it("마감 7일 안의 카드는 빨간색으로 표시하도록 urgent를 켭니다", () => {
      const [card] = cardsIn([noticeOf({ applyStart: "2026-11-01", applyEnd: "2026-11-14" })], "ongoing");

      expect(card).toMatchObject({ badge: "D-4", urgent: true });
    });

    it("진행 예정 카드에는 시작까지 남은 날을 붙입니다", () => {
      const [card] = cardsIn([noticeOf({ applyStart: "2026-11-13", applyEnd: "2026-11-30" })], "upcoming");

      expect(card.badge).toBe("3일 후 시작");
    });

    it("상시 카드에는 상시를 붙입니다", () => {
      const [card] = cardsIn([noticeOf({ isAlways: true })], "always");

      expect(card.badge).toBe("상시");
    });
  });

  it("진행 중 카드에는 기간 중 며칠째인지 담습니다", () => {
    const [card] = cardsIn([noticeOf({ applyStart: "2026-11-07", applyEnd: "2026-11-21" })], "ongoing");

    expect(card.progress).toEqual({ day: 4, total: 15 });
  });
});
