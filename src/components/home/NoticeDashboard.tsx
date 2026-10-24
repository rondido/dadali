"use client";

// 메인 화면: 색 안내 + 월간 달력 + 칸반. 칸반에서 고른 공고를 달력에 기간 막대로 보여준다.
import { useState } from "react";
import CalendarLegend from "@/components/calendar/CalendarLegend";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import NoticeKanban from "@/components/kanban/NoticeKanban";
import { formatShortDate } from "@/domain/date/formatShortDate";
import type { NoticeSchedule } from "@/domain/notice/noticeMarkers";

interface NoticeDashboardProps {
  notices: NoticeSchedule[];
}

export default function NoticeDashboard({ notices }: NoticeDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNotice = notices.find((n) => n.id === selectedId) ?? null;

  // 같은 카드를 다시 누르면 선택을 푼다
  const toggleSelect = (notice: NoticeSchedule) =>
    setSelectedId((current) => (current === notice.id ? null : notice.id));

  return (
    <>
      <CalendarLegend />

      {selectedNotice && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface px-4 py-2 text-sm ring-1 ring-line"
        >
          <span className="text-muted">달력에 표시 중</span>
          <strong className="font-semibold">{selectedNotice.title}</strong>
          <span className="text-ink-2">
            {formatShortDate(selectedNotice.applyStart!)} ~ {formatShortDate(selectedNotice.applyEnd!)}
          </span>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="ml-auto rounded border border-line-strong px-2 py-0.5 text-xs hover:bg-ground"
          >
            선택 해제
          </button>
        </div>
      )}

      <MonthCalendar notices={notices} selectedNotice={selectedNotice} />

      <section aria-labelledby="kanban-title" className="flex flex-col gap-3">
        <h2 id="kanban-title" className="flex flex-wrap items-baseline gap-x-2 text-lg font-bold">
          공고 현황 <span className="text-sm font-normal text-muted">(칸반 예시) · 카드를 누르면 달력에 접수 기간이 막대로 표시됩니다</span>
        </h2>
        <NoticeKanban notices={notices} selectedId={selectedId} onSelect={toggleSelect} />
      </section>
    </>
  );
}
