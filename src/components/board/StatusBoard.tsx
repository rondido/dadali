"use client";

// 공고 목록: 탭으로 숨기지 않고 접수 중 → 접수 예정 → 상시 구역을 한 번에 이어 보여준다.
// 접수 중은 7일 안에 마감하는 공고를 넓은 간격으로 떼어 맨 위에 모은다 (소제목 대신 간격과 빨간 D-day로 구분).
// 한 묶음 안의 줄은 간격 없이 이어 붙이고 얇은 가로선으로만 나눠, 카드 더미가 아니라 하나의 목록으로 읽히게 한다.
// 구역 이름은 목록을 내려도 위에 붙어 있어, 지금 어느 구역을 보는지 글 없이 알 수 있다
// 상시는 수가 많아 접수 중 공고를 묻히게 하므로 앞의 몇 건만 보이고 접어 둔다 (펼치기를 누르면 다른 구역처럼 더보기)
import { useState } from "react";
import NoticeRow from "@/components/board/NoticeRow";
import type { BoardCard, BoardColumn, BoardColumnKey } from "@/hooks/board/boardColumns";
import { LOAD_MORE_STEP, sectionLimit, visibleCards } from "@/hooks/board/visibleCards";

interface StatusBoardProps {
  columns: BoardColumn[];
  recommendedIds: ReadonlySet<string>;
  alwaysNote?: string | null;
  selectedId: string | null;
  viewedIds: ReadonlySet<string>;
  savedIds: ReadonlySet<string>;
  onOpen: (id: string) => void;
}

const SECTION_ORDER: BoardColumnKey[] = ["ongoing", "upcoming", "always"];

interface RowGroup {
  label: string | null; // 묶음 이름 (화면 낭독기용). 나누지 않으면 null
  cards: BoardCard[];
}

// 접수 중 구역만 마감 임박(7일 안)과 그 이후로 나눈다. 열 안의 순서(마감 빠른 순)는 그대로 둔다
function groupsOf(key: BoardColumnKey, cards: BoardCard[]): RowGroup[] {
  if (key !== "ongoing") return [{ label: null, cards }];
  return [
    { label: "7일 안에 마감", cards: cards.filter((card) => card.urgent) },
    { label: "8일 이상 남음", cards: cards.filter((card) => !card.urgent) },
  ].filter((group) => group.cards.length > 0);
}

export default function StatusBoard({
  columns,
  recommendedIds,
  alwaysNote = null,
  selectedId,
  viewedIds,
  savedIds,
  onOpen,
}: StatusBoardProps) {
  const [loadMore, setLoadMore] = useState<Partial<Record<BoardColumnKey, number>>>({});
  // 상시 구역은 앞의 몇 건만 보이고 접혀 있다가, 펼치기를 누르면 다른 구역처럼 더보기로 넘겨 본다
  const [alwaysExpanded, setAlwaysExpanded] = useState(false);
  const sections = SECTION_ORDER.flatMap((key) => columns.filter((column) => column.key === key));
  // 먼저 보기 공고와 지금 열어 둔 공고는 접혀서 안 보이는 일이 없게 한다
  const pinnedIds = new Set(recommendedIds);
  if (selectedId) pinnedIds.add(selectedId);

  return (
    <div className="flex flex-col gap-14 pb-10">
      {sections.map((column) => {
        const clicks = loadMore[column.key] ?? 0;
        const collapsed = column.key === "always" && !alwaysExpanded;
        const visible = visibleCards(column.cards, sectionLimit(column.key, clicks, alwaysExpanded), pinnedIds);
        // 방금 더보기로 펼친 줄 (처음부터 보이던 줄은 움직이지 않는다). 떠오르는 순서는 위에서부터, 너무 길어지지 않게 10줄까지만 늦춘다
        // 상시를 막 펼쳤을 때는 접혀 있던 몇 건 뒤로 새로 보인 줄이 떠오른다
        const before =
          clicks > 0
            ? visibleCards(column.cards, sectionLimit(column.key, clicks - 1, alwaysExpanded), pinnedIds)
            : column.key === "always" && alwaysExpanded
              ? visibleCards(column.cards, sectionLimit(column.key, 0, false), pinnedIds)
              : visible;
        const revealedOrder = new Map(
          visible.filter((card) => !before.includes(card)).map((card, i) => [card.match.notice.id, Math.min(i, 10)]),
        );
        const hiddenCount = column.cards.length - visible.length;
        const nextCount = Math.min(hiddenCount, LOAD_MORE_STEP);
        const showNote = column.key === "always" && alwaysNote;

        return (
          <section
            key={column.key}
            id={`section-${column.key}`}
            aria-labelledby={`section-${column.key}-title`}
            className="flex flex-col gap-4"
          >
            {/* 강조선 → 구역 이름. 목록을 내려도 위에 붙어 있다 */}
            <div className="sticky top-0 z-10 flex flex-col gap-3 bg-background pt-2 pb-3">
              <span aria-hidden="true" className="trim-line bg-primary" />
              {/* 구역 이름은 왼쪽, 건수는 오른쪽 (줄의 D-day 열과 같은 쪽) */}
              <h2 id={`section-${column.key}-title`} className="flex items-baseline justify-between gap-4 text-[22px] font-bold tracking-tight">
                {column.title}
                <span className="text-[15px] font-normal tracking-normal tabular-nums text-muted">{column.cards.length.toLocaleString()}건</span>
              </h2>
            </div>

            {showNote && <p className="text-[15px] leading-relaxed text-ink-2">{alwaysNote}</p>}

            {column.cards.length === 0
              ? !showNote && <p className="text-[15px] text-muted">공고가 없어요</p>
              : groupsOf(column.key, visible).map((group) => (
                  <ul key={group.label ?? column.key} aria-label={group.label ?? undefined} className="flex flex-col divide-y divide-line [&+&]:mt-6">
                    {group.cards.map((card) => (
                      <li
                        key={card.match.notice.id}
                        className={`bg-surface ${revealedOrder.has(card.match.notice.id) ? "motion-safe:animate-rise" : ""}`}
                        style={revealedOrder.has(card.match.notice.id) ? { animationDelay: `${revealedOrder.get(card.match.notice.id)! * 40}ms` } : undefined}
                      >
                        <NoticeRow
                          card={card}
                          recommended={recommendedIds.has(card.match.notice.id)}
                          selected={card.match.notice.id === selectedId}
                          viewed={viewedIds.has(card.match.notice.id)}
                          saved={savedIds.has(card.match.notice.id)}
                          onOpen={onOpen}
                        />
                      </li>
                    ))}
                  </ul>
                ))}

            {collapsed && hiddenCount > 0 && (
              <button
                type="button"
                aria-expanded={false}
                onClick={() => setAlwaysExpanded(true)}
                className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-md bg-surface px-6 text-sm font-medium text-ink-2 hover:bg-primary-tint hover:text-primary"
              >
                상시 혜택 {hiddenCount.toLocaleString()}건 펼치기
                <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className="size-3.5">
                  <path d="M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {!collapsed && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setLoadMore((current) => ({ ...current, [column.key]: (current[column.key] ?? 0) + 1 }))}
                className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-md bg-surface px-6 text-sm font-medium text-ink-2 hover:bg-primary-tint hover:text-primary"
              >
                {column.title} {nextCount}건 더보기
                {hiddenCount > nextCount && <span className="text-xs tabular-nums text-muted">(남은 {hiddenCount.toLocaleString()}건)</span>}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
