"use client";

// 마감일 중심 월간 달력 (F01). 표시 규칙은 domain/notice, 일정 변환은 hooks/calendar에 있다.
import type { DayCellContentArg, EventContentArg, MoreLinkContentArg } from "@fullcalendar/core";
import koLocale from "@fullcalendar/core/locales/ko";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import { useEffect, useMemo, useRef } from "react";
import { EndIcon, StartIcon } from "@/components/icons/ScheduleIcons";
import { formatShortDate } from "@/domain/date/formatShortDate";
import type { IsoDate, NoticeSchedule } from "@/domain/notice/noticeMarkers";
import {
  toCalendarEvents,
  toPeriodEvent,
  type CalendarEvent,
  type PeriodEvent,
} from "@/hooks/calendar/calendarEvents";
import { useSeoulToday } from "@/hooks/ui/useSeoulToday";

// 칸마다 최대 3건, 나머지는 "+N건" (기획서 5장)
const MAX_EVENTS_PER_DAY = 3;

const KIND_LABEL = { start: "시작", end: "마감" } as const;

// 아래 옵션은 렌더링마다 새로 만들면 FullCalendar가 옵션이 바뀐 줄 알고 다시 처리하므로 컴포넌트 밖에 한 번만 만든다
const PLUGINS = [dayGridPlugin];
const HEADER_TOOLBAR = { start: "title", end: "today prev,next" };

const renderMoreLink = (arg: MoreLinkContentArg) => `+${arg.num}건`;

// ko 로케일은 날짜 숫자에 "일"을 붙이므로 숫자만 남긴다
const renderDayCell = (arg: DayCellContentArg) => arg.dayNumberText.replace("일", "");

function renderEvent(arg: EventContentArg) {
  const props = arg.event.extendedProps as CalendarEvent["extendedProps"] | PeriodEvent["extendedProps"];
  if (props.kind === "period") {
    const { applyStart, applyEnd } = props.notice;
    return (
      <span className="chip-body" title={arg.event.title}>
        {arg.event.title}
        <span className="period-range">
          {formatShortDate(applyStart!)} ~ {formatShortDate(applyEnd!)}
        </span>
      </span>
    );
  }
  const { kind } = props;
  return (
    <span className="chip-body" title={arg.event.title}>
      {/* 화면에서는 색과 아이콘으로 구분하고, 화면 낭독기에는 글자로 알려준다 */}
      {kind === "end" ? <EndIcon className="chip-icon" /> : <StartIcon className="chip-icon" />}
      <span className="chip-kind sr-only">{KIND_LABEL[kind]}</span>
      {arg.event.title}
    </span>
  );
}

interface MonthCalendarProps {
  notices: NoticeSchedule[];
  // 칸반에서 고른 공고. 있으면 접수 기간을 막대로 그리고 그 시작 달로 이동한다
  selectedNotice?: NoticeSchedule | null;
  // 테스트에서 고정할 때만 넘긴다. 기본값은 서울 기준 오늘
  today?: IsoDate;
}

export default function MonthCalendar({ notices, selectedNotice, today }: MonthCalendarProps) {
  const todayInSeoul = useSeoulToday(today);
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const periodEvent = useMemo(() => (selectedNotice ? toPeriodEvent(selectedNotice) : null), [selectedNotice]);
  const events = useMemo(() => {
    if (!todayInSeoul) return [];
    const markers = toCalendarEvents(notices, todayInSeoul);
    return periodEvent ? [periodEvent, ...markers] : markers;
  }, [notices, todayInSeoul, periodEvent]);

  // 공고를 고르면 접수 시작 달로 넘기고 달력이 보이게 스크롤한다
  const periodStart = periodEvent?.start;
  useEffect(() => {
    if (!periodStart) return;
    // gotoDate는 FullCalendar를 즉시 다시 그리므로(flushSync) effect 안에서 바로 부르면 React 경고가 쏟아진다.
    // React가 화면을 다 그린 뒤로 미룬다
    const timer = setTimeout(() => {
      calendarRef.current?.getApi().gotoDate(periodStart);
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => clearTimeout(timer);
  }, [periodStart]);

  if (!todayInSeoul) {
    return <div className="min-h-[640px] rounded bg-surface" aria-busy="true" />;
  }

  return (
    <div ref={containerRef} className="scroll-mt-4">
      <FullCalendar
        ref={calendarRef}
        plugins={PLUGINS}
        initialView="dayGridMonth"
        locale={koLocale}
        // 기기 시간대가 달라도 서울 기준 오늘을 강조한다
        now={todayInSeoul}
        initialDate={todayInSeoul}
        headerToolbar={HEADER_TOOLBAR}
        height="auto"
        fixedWeekCount={false}
        events={events}
        eventDisplay="block"
        eventOrder="order"
        dayMaxEvents={MAX_EVENTS_PER_DAY}
        moreLinkContent={renderMoreLink}
        dayCellContent={renderDayCell}
        eventContent={renderEvent}
      />
    </div>
  );
}
