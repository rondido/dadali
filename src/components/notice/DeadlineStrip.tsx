// 마감까지 남은 날 띠 (공고 상세): 오늘부터 마감일까지 하루를 한 칸으로 한 줄에 늘어놓는다.
// 월 달력 대신 한 줄로 "며칠 남았고 언제 끝나는지"만 보여준다. 오늘은 검정, 남은 날은 연한 파랑, 마감일은 파랑
// 남은 날이 너무 많으면 칸이 가늘어져 읽을 수 없으므로 그리지 않고, 패널이 마감일 글자만 보여준다 (MAX_DAYS)
import { differenceInCalendarDays, eachDayOfInterval, format, getDay, parseISO } from "date-fns";
import { formatShortDate } from "@/domain/date/formatShortDate";
import type { IsoDate } from "@/domain/notice/notice";

const MAX_DAYS = 21;

// 띠를 그릴 수 있는지: 오늘이 마감일 이전이고, 오늘부터 마감일까지 MAX_DAYS일 이하
export function showsDeadlineStrip(today: IsoDate, end: IsoDate): boolean {
  const days = differenceInCalendarDays(parseISO(end), parseISO(today)) + 1;
  return days >= 1 && days <= MAX_DAYS;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface DeadlineStripProps {
  today: IsoDate;
  end: IsoDate;
}

export default function DeadlineStrip({ today, end }: DeadlineStripProps) {
  if (!showsDeadlineStrip(today, end)) return null;
  const days = eachDayOfInterval({ start: parseISO(today), end: parseISO(end) }).map((d) => format(d, "yyyy-MM-dd"));
  const last = days.length - 1;
  const weekday = WEEKDAYS[getDay(parseISO(end))];

  return (
    <figure aria-label="마감까지 남은 날" className="flex flex-col gap-2">
      <ol aria-hidden="true" className="flex gap-1">
        {days.map((date, i) => (
          <li
            key={date}
            data-date={date}
            className={`h-2.5 flex-1 origin-left motion-safe:animate-strip-in ${i === last ? "bg-primary" : i === 0 ? "bg-ink" : "bg-primary-tint"}`}
            style={{ animationDelay: `${120 + i * 30}ms` }}
          />
        ))}
      </ol>
      <figcaption className="flex justify-between gap-2 text-[13px] tabular-nums text-muted">
        {last > 0 && <span>오늘</span>}
        <span className="ml-auto font-semibold text-primary">
          {last === 0 ? "오늘 마감" : `${formatShortDate(end)} (${weekday}) 마감`}
        </span>
      </figcaption>
    </figure>
  );
}
