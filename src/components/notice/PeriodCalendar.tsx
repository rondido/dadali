// 공고 하나의 접수 기간 달력 (기획서 5장 공고 상세): 시작일부터 마감일까지 막대, 지난·남은 기간은 진하기로,
// 오늘은 테두리로, 시작·마감일은 진한 원으로 표시한다. 달 계산은 hooks/calendar/periodCalendar에 있다
import { useMemo } from "react";
import type { IsoDate } from "@/domain/notice/notice";
import { formatMonthDay, toPeriodCalendar, type CalendarDay, type CalendarMonth } from "@/hooks/calendar/periodCalendar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 블록 수별 넓은 화면 배치: 두 달은 나란히, 접은 경우(시작 달 · … N주 … · 마감 달)는 가운데를 좁게
const MONTH_COLUMNS: Record<number, string> = { 2: "xl:grid-cols-2", 3: "xl:grid-cols-[1fr_auto_1fr]" };

interface PeriodCalendarProps {
  start: IsoDate;
  end: IsoDate;
  today: IsoDate;
}

function dayAttributes(day: CalendarDay, column: number) {
  if (!day.inMonth) return {};
  const edges = [
    day.inPeriod && (day.isStart || column === 0) ? "left" : "",
    day.inPeriod && (day.isEnd || column === 6) ? "right" : "",
  ].filter(Boolean);
  return {
    "data-date": day.date,
    "data-period": day.inPeriod ? (day.elapsed ? "elapsed" : "remaining") : undefined,
    "data-edge": edges.length > 0 ? edges.join(" ") : undefined,
    "data-mark": day.isStart ? "start" : day.isEnd ? "end" : undefined,
    "data-today": day.isToday ? "" : undefined,
  };
}

// 화면 낭독기에는 날짜와 함께 시작·마감·오늘을 글자로 알려준다
function dayLabel(day: CalendarDay): string | undefined {
  const tags = [day.isStart && "접수 시작", day.isEnd && "접수 마감", day.isToday && "오늘"].filter(Boolean);
  return tags.length > 0 ? `${formatMonthDay(day.date)} ${tags.join(", ")}` : undefined;
}

function MonthTable({ month }: { month: CalendarMonth }) {
  return (
    <table className="w-full table-fixed border-collapse">
      <caption className="pb-1 text-left text-sm font-semibold text-ink">
        {month.year}년 {month.month}월
      </caption>
      <thead>
        <tr>
          {WEEKDAYS.map((w) => (
            <th key={w} scope="col" className="pb-1 text-[11px] font-normal text-muted">
              {w}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {month.weeks.map((week) => (
          <tr key={week[0].date}>
            {week.map((day, column) => (
              <td key={day.date} className="p-0 py-0.5">
                {day.inMonth && (
                  <div className="period-day" {...dayAttributes(day, column)} aria-label={dayLabel(day)}>
                    <span className="period-mark">{day.day}</span>
                  </div>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PeriodCalendar({ start, end, today }: PeriodCalendarProps) {
  const blocks = useMemo(() => toPeriodCalendar(start, end, today), [start, end, today]);

  return (
    <figure aria-label="접수 기간 달력" className="flex flex-col gap-2">
      <figcaption className="sr-only">
        접수 기간 {formatMonthDay(start)}부터 {formatMonthDay(end)}까지
      </figcaption>
      {/* 두 달은 넓은 화면에서 나란히, 좁은 화면에서 위아래로 */}
      <div className={`grid gap-4 ${MONTH_COLUMNS[blocks.length] ?? ""}`}>
        {blocks.map((block, i) =>
          block.kind === "month" ? (
            <MonthTable key={block.month.key} month={block.month} />
          ) : (
            <p key={`gap-${i}`} className="self-center text-center text-xs text-muted">
              … {block.weeks}주 …
            </p>
          ),
        )}
      </div>
    </figure>
  );
}
