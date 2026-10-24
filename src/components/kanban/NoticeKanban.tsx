"use client";

// 공고를 진행 예정·진행 중·상시로 나눠 보여주는 칸반 (예시 화면). 열 나누기·정렬은 hooks/kanban에 있다.
// 날짜가 있는 카드를 누르면 달력에 접수 기간 막대가 그려진다 (NoticeDashboard가 연결)
import { useMemo } from "react";
import { AlwaysIcon, EndIcon, StartIcon } from "@/components/icons/ScheduleIcons";
import { CATEGORIES, colorTokenOf } from "@/domain/category/categories";
import { formatShortDate } from "@/domain/date/formatShortDate";
import type { IsoDate, NoticeSchedule } from "@/domain/notice/noticeMarkers";
import { toKanbanColumns, type KanbanCard } from "@/hooks/kanban/kanbanColumns";
import { useSeoulToday } from "@/hooks/ui/useSeoulToday";

interface NoticeKanbanProps {
  notices: NoticeSchedule[];
  selectedId: string | null;
  onSelect: (notice: NoticeSchedule) => void;
  // 테스트에서 고정할 때만 넘긴다. 기본값은 서울 기준 오늘
  today?: IsoDate;
}

function CardBody({ card }: { card: KanbanCard }) {
  const { notice, dDay, status } = card;
  const categoryName = CATEGORIES.find((c) => c.id === notice.categoryId)?.name;

  return (
    <>
      <span className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-ink-2">
          <span aria-hidden="true" className={`kanban-dot chip-${colorTokenOf(notice.categoryId)}`} />
          {categoryName}
        </span>
        {dDay && (
          <span
            className={`rounded px-1.5 py-0.5 font-semibold ${
              status === "closing" ? "bg-danger-tint text-danger" : "bg-ground text-ink-2"
            }`}
          >
            {dDay}
          </span>
        )}
      </span>

      <span className="mt-1.5 block font-medium leading-snug text-ink">{notice.title}</span>

      <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {notice.isAlways ? (
          <span className="flex items-center gap-1">
            <AlwaysIcon className="kanban-icon" />
            상시 모집
          </span>
        ) : (
          <>
            {notice.applyStart && (
              <span className="flex items-center gap-1">
                <StartIcon className="kanban-icon" />
                <span className="sr-only">시작</span>
                {formatShortDate(notice.applyStart)}
              </span>
            )}
            {notice.applyEnd && (
              <span className="flex items-center gap-1">
                <EndIcon className="kanban-icon" />
                <span className="sr-only">마감</span>
                {formatShortDate(notice.applyEnd)}
              </span>
            )}
          </>
        )}
      </span>
    </>
  );
}

const CARD_CLASS = "block w-full rounded-md border bg-surface p-3 text-left text-sm";

export default function NoticeKanban({ notices, selectedId, onSelect, today }: NoticeKanbanProps) {
  const todayInSeoul = useSeoulToday(today);
  const columns = useMemo(
    () => (todayInSeoul ? toKanbanColumns(notices, todayInSeoul) : []),
    [notices, todayInSeoul],
  );

  if (!todayInSeoul) {
    return <div className="min-h-[320px] rounded-lg bg-surface" aria-busy="true" />;
  }

  return (
    // 데스크톱에서는 세 열이 한 화면에 들어가고, 좁은 화면에서만 옆으로 넘겨 본다
    <div className="grid auto-cols-[minmax(13rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
      {columns.map((column) => (
        <section key={column.key} aria-label={column.title} className="flex flex-col rounded-lg bg-ground p-2 ring-1 ring-line">
          <h3 className="flex items-center justify-between px-1 pb-2 text-sm font-semibold text-ink">
            <span className="flex items-center gap-1.5">
              {column.key === "always" && <AlwaysIcon className="kanban-icon" />}
              {column.title}
            </span>
            <span className="rounded-full bg-surface px-2 text-xs font-medium text-muted">{column.cards.length}건</span>
          </h3>
          {column.cards.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs text-muted">없음</p>
          ) : (
            <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
              {column.cards.map((card) => {
                const selected = card.notice.id === selectedId;
                return (
                  <li key={card.notice.id}>
                    {/* 상시 모집은 기간이 없어 달력에 그릴 것이 없으므로 누를 수 없다 */}
                    {card.notice.isAlways ? (
                      <div className={`${CARD_CLASS} border-line`}>
                        <CardBody card={card} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onSelect(card.notice)}
                        className={`${CARD_CLASS} cursor-pointer transition-colors hover:border-line-strong ${
                          selected ? "border-ink ring-2 ring-ink" : "border-line"
                        }`}
                      >
                        <CardBody card={card} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
