"use client";

// 상태 보드 (기획서 5장): 진행 예정 · 진행 중 · 상시 3열. 열 나누기·정렬은 hooks/board에 있다
// 모바일에서는 세 열을 탭으로 바꾸고 기본 탭은 진행 중
import { useState } from "react";
import NoticeCard from "@/components/board/NoticeCard";
import { BOARD_PREVIEW_COUNT, type BoardColumn, type BoardColumnKey } from "@/hooks/board/boardColumns";

interface StatusBoardProps {
  columns: BoardColumn[];
  selectedId: string | null;
  onOpen: (id: string) => void;
}

export default function StatusBoard({ columns, selectedId, onOpen }: StatusBoardProps) {
  const [activeTab, setActiveTab] = useState<BoardColumnKey>("ongoing");
  const [expanded, setExpanded] = useState<Set<BoardColumnKey>>(new Set());

  const expand = (key: BoardColumnKey) => setExpanded((current) => new Set(current).add(key));

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="접수 상태" className="grid grid-cols-3 gap-1 rounded-lg bg-surface p-1 ring-1 ring-line md:hidden">
        {columns.map((column) => (
          <button
            key={column.key}
            type="button"
            role="tab"
            id={`tab-${column.key}`}
            aria-selected={activeTab === column.key}
            aria-controls={`column-${column.key}`}
            onClick={() => setActiveTab(column.key)}
            className={`min-h-11 rounded-md text-sm font-medium ${
              activeTab === column.key ? "bg-ink text-surface" : "text-ink-2 hover:bg-ground"
            }`}
          >
            {column.title} {column.cards.length}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {columns.map((column) => {
          const isExpanded = expanded.has(column.key);
          const visible = isExpanded ? column.cards : column.cards.slice(0, BOARD_PREVIEW_COUNT);
          const hiddenCount = column.cards.length - visible.length;

          return (
            <section
              key={column.key}
              id={`column-${column.key}`}
              aria-label={column.title}
              className={`${activeTab === column.key ? "flex" : "hidden"} flex-col rounded-lg bg-ground p-2 ring-1 ring-line md:flex`}
            >
              <h3 className="flex items-center justify-between px-1 pb-2 text-sm font-semibold text-ink">
                {column.title}
                <span className="rounded-full bg-surface px-2 text-xs font-medium text-muted">{column.cards.length}건</span>
              </h3>

              {column.cards.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-muted">없음</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {visible.map((card) => (
                    <li key={card.match.notice.id}>
                      <NoticeCard card={card} selected={card.match.notice.id === selectedId} onOpen={onOpen} />
                    </li>
                  ))}
                </ul>
              )}

              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => expand(column.key)}
                  className="mt-2 min-h-11 rounded-md border border-line-strong bg-surface text-sm text-ink-2 hover:bg-ground"
                >
                  {hiddenCount}건 더보기
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
