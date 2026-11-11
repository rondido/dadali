"use client";

// 상태 보드 (기획서 5장): 접수 예정 · 접수 중 · 상시 3열. 열 나누기·정렬은 hooks/board에 있다
// 모바일에서는 세 열을 탭으로 바꾸고 기본 탭은 접수 중
import { useState } from "react";
import NoticeCard from "@/components/board/NoticeCard";
import type { BoardColumn, BoardColumnKey } from "@/hooks/board/boardColumns";
import { LOAD_MORE_STEP, visibleCards, visibleLimit } from "@/hooks/board/visibleCards";

interface StatusBoardProps {
  columns: BoardColumn[];
  recommendedIds: ReadonlySet<string>; // "먼저 보기"를 붙일 공고
  alwaysNote?: string | null; // 상시 열 위에 붙일 안내 (상시 혜택을 일부만 받았을 때)
  selectedId: string | null;
  onOpen: (id: string) => void;
}

export default function StatusBoard({ columns, recommendedIds, alwaysNote = null, selectedId, onOpen }: StatusBoardProps) {
  const [activeTab, setActiveTab] = useState<BoardColumnKey>("ongoing");
  // 열마다 "더보기"를 누른 횟수
  const [loadMore, setLoadMore] = useState<Partial<Record<BoardColumnKey, number>>>({});

  const showMore = (key: BoardColumnKey) => setLoadMore((current) => ({ ...current, [key]: (current[key] ?? 0) + 1 }));

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
              activeTab === column.key ? "bg-primary text-on-primary" : "text-ink-2 hover:bg-ground"
            }`}
          >
            {column.title} {column.cards.length}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {columns.map((column) => {
          const visible = visibleCards(column.cards, visibleLimit(loadMore[column.key] ?? 0), recommendedIds);
          const hiddenCount = column.cards.length - visible.length;
          const nextCount = Math.min(hiddenCount, LOAD_MORE_STEP);

          return (
            <section
              key={column.key}
              id={`column-${column.key}`}
              aria-label={column.title}
              className={`${activeTab === column.key ? "flex" : "hidden"} flex-col rounded-lg bg-ground p-2 md:flex`}
            >
              <h3 className="flex items-center justify-between px-1 pb-2 pt-0.5 text-[15px] font-bold tracking-tight text-ink">
                {column.title}
                <span className="rounded-sm bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-2">{column.cards.length}건</span>
              </h3>

              {column.key === "always" && alwaysNote && (
                <p className="mb-2 rounded-md bg-primary-tint px-2.5 py-2 text-xs leading-relaxed text-primary">{alwaysNote}</p>
              )}

              {column.cards.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-muted">없어요</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {visible.map((card) => (
                    <li key={card.match.notice.id}>
                      <NoticeCard
                        card={card}
                        recommended={recommendedIds.has(card.match.notice.id)}
                        selected={card.match.notice.id === selectedId}
                        onOpen={onOpen}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => showMore(column.key)}
                  className="mt-2 min-h-11 rounded-md border border-line-strong bg-surface text-sm text-ink-2 hover:bg-ground"
                >
                  {nextCount}건 더보기
                  {hiddenCount > nextCount && (
                    <span className="ml-1 text-xs tabular-nums text-muted">(남은 {hiddenCount.toLocaleString()}건)</span>
                  )}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
