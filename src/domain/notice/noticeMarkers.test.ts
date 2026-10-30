import { describe, expect, it, test } from "vitest";
import {
  compareNoticeMarkers,
  isNoticeClosed,
  toNoticeMarkers,
  type NoticeMarker,
  type NoticeSchedule,
} from "./noticeMarkers";

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

function markerOf(kind: NoticeMarker["kind"], title: string): NoticeMarker {
  return { kind, date: "2026-11-20", notice: scheduleOf({ title }) };
}

describe("toNoticeMarkers", () => {
  describe("접수 시작일과 마감일이 모두 있을 때", () => {
    it("시작일 마커와 마감일 마커를 하나씩 만듭니다", () => {
      const notice = scheduleOf({ applyStart: "2026-11-06", applyEnd: "2026-11-20" });

      expect(toNoticeMarkers(notice)).toEqual([
        { kind: "start", date: "2026-11-06", notice },
        { kind: "end", date: "2026-11-20", notice },
      ]);
    });
  });

  describe("시작일과 마감일이 같은 날일 때", () => {
    it("한 칸에 같은 공고가 두 번 보이지 않도록 마감일 마커만 만듭니다", () => {
      const notice = scheduleOf({ applyStart: "2026-11-20", applyEnd: "2026-11-20" });

      expect(toNoticeMarkers(notice)).toEqual([{ kind: "end", date: "2026-11-20", notice }]);
    });
  });

  describe("날짜가 하나만 있을 때", () => {
    it("마감일만 있으면 마감일 마커만 만듭니다", () => {
      const notice = scheduleOf({ applyEnd: "2026-11-20" });

      expect(toNoticeMarkers(notice)).toEqual([{ kind: "end", date: "2026-11-20", notice }]);
    });

    it("시작일만 있으면 시작일 마커만 만듭니다", () => {
      const notice = scheduleOf({ applyStart: "2026-11-06" });

      expect(toNoticeMarkers(notice)).toEqual([{ kind: "start", date: "2026-11-06", notice }]);
    });
  });

  describe("달력 칸에 올리지 않는 공고일 때", () => {
    it("상시 모집 공고는 날짜가 있어도 마커를 만들지 않습니다", () => {
      const notice = scheduleOf({ applyStart: "2026-11-06", applyEnd: "2026-11-20", isAlways: true });

      expect(toNoticeMarkers(notice)).toEqual([]);
    });

    it("시작일과 마감일이 모두 없으면 마커를 만들지 않습니다", () => {
      expect(toNoticeMarkers(scheduleOf({}))).toEqual([]);
    });
  });
});

describe("compareNoticeMarkers", () => {
  it("마감 마커를 시작 마커보다 앞에 정렬합니다", () => {
    const markers = [markerOf("start", "가 공고"), markerOf("end", "나 공고")];

    const sorted = [...markers].sort(compareNoticeMarkers);

    expect(sorted.map((m) => m.kind)).toEqual(["end", "start"]);
  });

  it("같은 종류의 마커는 공고명 가나다순으로 정렬합니다", () => {
    const markers = [
      markerOf("start", "라 공고"),
      markerOf("end", "다 공고"),
      markerOf("start", "가 공고"),
      markerOf("end", "나 공고"),
    ];

    const sorted = [...markers].sort(compareNoticeMarkers);

    expect(sorted.map((m) => `${m.kind}:${m.notice.title}`)).toEqual([
      "end:나 공고",
      "end:다 공고",
      "start:가 공고",
      "start:라 공고",
    ]);
  });
});

describe("isNoticeClosed", () => {
  test.each([
    ["2026-11-19", true],
    ["2026-11-20", false],
    ["2026-11-21", false],
  ])("오늘이 2026-11-20이고 마감일이 %s이면 %s를 반환합니다", (applyEnd, expected) => {
    expect(isNoticeClosed(scheduleOf({ applyEnd }), "2026-11-20")).toBe(expected);
  });

  it("마감일이 없는 공고는 마감되지 않은 것으로 보고 false를 반환합니다", () => {
    expect(isNoticeClosed(scheduleOf({}), "2026-11-20")).toBe(false);
  });
});
