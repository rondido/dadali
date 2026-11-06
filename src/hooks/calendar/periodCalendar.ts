// 공고 하나의 접수 기간을 월 달력 격자로 바꾼다 (기간 달력 뷰 전용, 기획서 5장 공고 상세)
// 두 달에 걸치면 두 달을, 세 달 이상이면 시작·마감 달만 보여주고 사이는 "… N주 …"로 접는다
import {
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { IsoDate } from "@/domain/notice/notice";

export interface CalendarDay {
  date: IsoDate;
  day: number;
  inMonth: boolean; // 앞뒤 달 날짜는 빈칸으로 그린다
  inPeriod: boolean; // 접수 기간 안 (이 달 날짜만)
  elapsed: boolean; // 접수 기간 중 이미 지난 날
  isToday: boolean;
  isStart: boolean;
  isEnd: boolean;
}

export interface CalendarMonth {
  key: string; // "2026-11"
  year: number;
  month: number; // 1~12
  weeks: CalendarDay[][]; // 일요일부터 시작하는 주
}

export type PeriodCalendarBlock = { kind: "month"; month: CalendarMonth } | { kind: "gap"; weeks: number };

const toIso = (date: Date): IsoDate => format(date, "yyyy-MM-dd");

function monthGrid(monthStart: Date, start: IsoDate, end: IsoDate, today: IsoDate): CalendarMonth {
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });
  const monthKey = format(monthStart, "yyyy-MM");

  const cells = days.map((d): CalendarDay => {
    const date = toIso(d);
    const inMonth = date.startsWith(monthKey);
    const inPeriod = inMonth && date >= start && date <= end;
    return {
      date,
      day: getDate(d),
      inMonth,
      inPeriod,
      elapsed: inPeriod && date < today,
      isToday: inMonth && date === today,
      isStart: inMonth && date === start,
      isEnd: inMonth && date === end,
    };
  });

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { key: monthKey, year: monthStart.getFullYear(), month: monthStart.getMonth() + 1, weeks };
}

export function toPeriodCalendar(start: IsoDate, end: IsoDate, today: IsoDate): PeriodCalendarBlock[] {
  const firstMonth = startOfMonth(parseISO(start));
  const lastMonth = startOfMonth(parseISO(end));
  const span = differenceInCalendarMonths(lastMonth, firstMonth);

  const month = (m: Date): PeriodCalendarBlock => ({ kind: "month", month: monthGrid(m, start, end, today) });

  if (span === 0) return [month(firstMonth)];
  if (span === 1) return [month(firstMonth), month(lastMonth)];

  // 시작 달 다음 날부터 마감 달 전날까지를 주 단위로 센다
  const hiddenDays = differenceInCalendarDays(lastMonth, addMonths(firstMonth, 1));
  return [month(firstMonth), { kind: "gap", weeks: Math.max(1, Math.round(hiddenDays / 7)) }, month(lastMonth)];
}

// 화면 낭독기용 요약에 쓰는 "10월 28일"
export function formatMonthDay(date: IsoDate): string {
  return format(parseISO(date), "M월 d일");
}
