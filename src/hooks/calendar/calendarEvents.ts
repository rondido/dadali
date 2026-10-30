// 공고 마커를 FullCalendar 일정으로 바꾼다 (달력 뷰 전용)
import { colorTokenOf } from "@/domain/category/categories";
import { addDays } from "@/domain/date/addDays";
import {
  compareNoticeMarkers,
  isNoticeClosed,
  toNoticeMarkers,
  type IsoDate,
  type NoticeMarker,
  type NoticeMarkerKind,
  type NoticeSchedule,
} from "@/domain/notice/noticeMarkers";

// FullCalendar EventInput과 같은 모양
export interface CalendarEvent {
  id: string;
  title: string;
  start: IsoDate;
  allDay: true;
  classNames: string[];
  extendedProps: {
    kind: NoticeMarkerKind;
    // 같은 날짜 안 표시 순서. FullCalendar의 eventOrder="order"로 정렬한다
    order: number;
    notice: NoticeSchedule;
  };
}

// 칸반에서 고른 공고의 접수 기간 막대 (시작일 ~ 마감일)
export interface PeriodEvent {
  id: string;
  title: string;
  start: IsoDate;
  // FullCalendar의 end는 포함하지 않는 날짜라 마감일 다음 날을 넣는다
  end: IsoDate;
  allDay: true;
  classNames: string[];
  extendedProps: {
    kind: "period";
    // 같은 날짜의 시작·마감 칩(0부터)보다 먼저 보인다
    order: -1;
    notice: NoticeSchedule;
  };
}

export function toPeriodEvent(notice: NoticeSchedule): PeriodEvent | null {
  if (notice.isAlways || !notice.applyStart || !notice.applyEnd) return null;

  return {
    id: `${notice.id}:period`,
    title: notice.title,
    start: notice.applyStart,
    end: addDays(notice.applyEnd, 1),
    allDay: true,
    classNames: ["period", `chip-${colorTokenOf(notice.categoryId)}`],
    extendedProps: { kind: "period", order: -1, notice },
  };
}

function byDateThenMarker(a: NoticeMarker, b: NoticeMarker): number {
  return a.date.localeCompare(b.date) || compareNoticeMarkers(a, b);
}

export function toCalendarEvents(notices: NoticeSchedule[], today: IsoDate): CalendarEvent[] {
  const markers = notices.flatMap(toNoticeMarkers).sort(byDateThenMarker);

  return markers.map((marker, order) => {
    const { notice, kind } = marker;
    const classNames = ["chip", `chip-${kind}`, `chip-${colorTokenOf(notice.categoryId)}`];
    if (isNoticeClosed(notice, today)) classNames.push("chip-closed");

    return {
      id: `${notice.id}:${kind}`,
      title: notice.title,
      start: marker.date,
      allDay: true,
      classNames,
      extendedProps: { kind, order, notice },
    };
  });
}
