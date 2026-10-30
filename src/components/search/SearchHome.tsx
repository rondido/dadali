"use client";

// 메인 화면: 첫 화면(P01) ↔ 검색 결과·전체 보드(P02·P03). 어느 화면인지는 URL 조건으로 정한다 (hooks/search/useSearch)
import { useMemo } from "react";
import StatusBoard from "@/components/board/StatusBoard";
import ConditionBar from "@/components/search/ConditionBar";
import SearchBox from "@/components/search/SearchBox";
import StartScreen from "@/components/search/StartScreen";
import type { Notice } from "@/domain/notice/notice";
import { summarizeNotices } from "@/domain/notice/noticeStatus";
import { chipLabel, hasConditions, toChips } from "@/domain/search/conditions";
import type { DictionaryEntry } from "@/domain/search/interpretQuery";
import { matchNotices } from "@/domain/search/matchNotices";
import { toBoardColumns } from "@/hooks/board/boardColumns";
import { useSearch } from "@/hooks/search/useSearch";
import { useSeoulToday } from "@/hooks/ui/useSeoulToday";

interface SearchHomeProps {
  notices: Notice[];
  dictionary: DictionaryEntry[];
}

export default function SearchHome({ notices, dictionary }: SearchHomeProps) {
  const today = useSeoulToday();
  const search = useSearch(dictionary);

  const { matches, usedKeywords } = useMemo(
    () => matchNotices(notices, search.conditions, search.unknownTerms),
    [notices, search.conditions, search.unknownTerms],
  );
  const columns = useMemo(() => (today ? toBoardColumns(matches, today) : []), [matches, today]);

  // 오늘 날짜와 저장된 조건을 확인하기 전에는 빈 자리만 잡아 둔다
  if (!today || !search.ready) {
    return <div className="min-h-[60vh] rounded-lg bg-surface" aria-busy="true" />;
  }

  if (!search.showResults) {
    return <StartScreen notices={notices} today={today} onSearch={search.search} onShowAll={search.showAll} />;
  }

  const total = columns.reduce((sum, column) => sum + column.cards.length, 0);
  const summary = summarizeNotices(
    matches.map((m) => m.notice),
    today,
  );
  const filtered = hasConditions(search.conditions) || usedKeywords.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <SearchBox size="compact" onSearch={search.search} />

      <ConditionBar
        conditions={search.conditions}
        regionChoices={search.regionChoices}
        unknownTerms={search.unknownTerms}
        usedKeywords={usedKeywords}
        onRemove={search.removeChip}
        onAdd={search.addChip}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold">
          {filtered ? `조건에 맞을 수 있는 지원사업 ${total}건` : `전체 지원사업 ${total}건`}
        </h1>
        <button type="button" onClick={search.startOver} className="text-sm text-ink-2 underline underline-offset-2">
          처음부터 새로 찾기
        </button>
      </div>

      {total === 0 ? (
        <div className="flex flex-col gap-2 rounded-lg bg-surface p-4 text-sm ring-1 ring-line">
          <p>지금 접수 중이거나 예정된 공고가 없어요. 조건을 하나 빼고 찾아보세요.</p>
          <div className="flex flex-wrap gap-2">
            {toChips(search.conditions).map((chip) => (
              <button
                key={`${chip.kind}-${chip.value}`}
                type="button"
                onClick={() => search.removeChip(chip)}
                className="min-h-9 rounded-full border border-line-strong px-3 hover:bg-ground"
              >
                &apos;{chipLabel(chip)}&apos; 빼고 찾기
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-2">
            이번 주 마감 <strong className="text-danger">{summary.closingThisWeek}건</strong> · 7일 안에 시작{" "}
            <strong>{summary.startingSoon}건</strong>
          </p>
          <StatusBoard columns={columns} />
        </>
      )}
    </div>
  );
}
