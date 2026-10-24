import { describe, expect, it } from "vitest";
import type { NoticeSchedule } from "@/domain/notice/noticeMarkers";
import { toKanbanColumns, type KanbanColumnKey } from "./kanbanColumns";

// 테스트마다 달라지는 값만 넘기고, 나머지는 판단에 영향이 없는 기본값으로 채웁니다
function scheduleOf(overrides: Partial<NoticeSchedule>): NoticeSchedule {
  return {
    id: "n1",
    title: "공고",
    categoryId: "C02",
    applyStart: null,
    applyEnd: null,
    isAlways: false,
    ...overrides,
  };
}

const TODAY = "2026-11-10";

function idsIn(notices: NoticeSchedule[], key: KanbanColumnKey): string[] {
  const column = toKanbanColumns(notices, TODAY).find((c) => c.key === key)!;
  return column.cards.map((c) => c.notice.id);
}

describe("toKanbanColumns", () => {
  it("진행 예정 → 진행 중 → 상시 순서로 세 열을 만듭니다", () => {
    const columns = toKanbanColumns([], TODAY);

    expect(columns.map((c) => c.title)).toEqual(["진행 예정", "진행 중", "상시"]);
  });

  describe("열 나누기", () => {
    it("접수 시작 전인 공고는 진행 예정 열에 넣습니다", () => {
      const notice = scheduleOf({ id: "upcoming", applyStart: "2026-11-20", applyEnd: "2026-11-30" });

      expect(idsIn([notice], "upcoming")).toEqual(["upcoming"]);
    });

    it("마감 7일 안에 든 공고도 따로 나누지 않고 진행 중 열에 넣습니다", () => {
      const notices = [
        scheduleOf({ id: "open", applyStart: "2026-11-01", applyEnd: "2026-11-30" }),
        scheduleOf({ id: "closing", applyStart: "2026-11-01", applyEnd: "2026-11-14" }),
      ];

      expect(idsIn(notices, "ongoing")).toEqual(["closing", "open"]);
    });

    it("상시 모집 공고는 상시 열에 넣습니다", () => {
      const notice = scheduleOf({ id: "always", isAlways: true });

      expect(idsIn([notice], "always")).toEqual(["always"]);
    });

    it("마감된 공고는 어느 열에도 넣지 않습니다", () => {
      const notice = scheduleOf({ applyStart: "2026-11-01", applyEnd: "2026-11-05" });

      const columns = toKanbanColumns([notice], TODAY);

      expect(columns.flatMap((c) => c.cards)).toEqual([]);
    });
  });

  describe("열 안의 정렬", () => {
    it("진행 예정 열은 시작일이 빠른 순으로 정렬합니다", () => {
      const notices = [
        scheduleOf({ id: "late", applyStart: "2026-11-25" }),
        scheduleOf({ id: "soon", applyStart: "2026-11-12" }),
      ];

      expect(idsIn(notices, "upcoming")).toEqual(["soon", "late"]);
    });

    it("진행 중 열은 마감일이 빠른 순으로 정렬합니다", () => {
      const notices = [
        scheduleOf({ id: "late", applyStart: "2026-11-01", applyEnd: "2026-12-20" }),
        scheduleOf({ id: "soon", applyStart: "2026-11-01", applyEnd: "2026-11-30" }),
      ];

      expect(idsIn(notices, "ongoing")).toEqual(["soon", "late"]);
    });

    it("상시 열은 공고명 가나다순으로 정렬합니다", () => {
      const notices = [
        scheduleOf({ id: "b", title: "나 공고", isAlways: true }),
        scheduleOf({ id: "a", title: "가 공고", isAlways: true }),
      ];

      expect(idsIn(notices, "always")).toEqual(["a", "b"]);
    });
  });

  describe("D-day 표시", () => {
    it("진행 중 카드에는 마감까지 남은 D-day를 붙입니다", () => {
      const notice = scheduleOf({ applyStart: "2026-11-01", applyEnd: "2026-11-14" });

      const [card] = toKanbanColumns([notice], TODAY).find((c) => c.key === "ongoing")!.cards;

      expect(card.dDay).toBe("D-4");
    });

    it("진행 예정 카드에는 D-day를 붙이지 않습니다", () => {
      const notice = scheduleOf({ applyStart: "2026-11-20", applyEnd: "2026-11-30" });

      const [card] = toKanbanColumns([notice], TODAY).find((c) => c.key === "upcoming")!.cards;

      expect(card.dDay).toBeNull();
    });
  });
});
