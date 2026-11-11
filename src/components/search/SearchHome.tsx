"use client";

// 메인 화면: 첫 화면(P01) ↔ 검색 결과·전체 보드(P02·P03) + 공고 상세 패널(P04). 어느 화면인지는 URL로 정한다 (hooks/search/useSearch)
// 화면 높이(100vh) 안에서 위쪽(검색·칩·요약)은 고정하고 보드와 패널이 각자 스크롤한다. 모바일은 전체가 한 번에 스크롤한다
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import StatusBoard from "@/components/board/StatusBoard";
import NoticePanel from "@/components/notice/NoticePanel";
import ConditionBar from "@/components/search/ConditionBar";
import ConditionPicker from "@/components/search/ConditionPicker";
import SearchBox from "@/components/search/SearchBox";
import StartScreen from "@/components/search/StartScreen";
import type { Notice } from "@/domain/notice/notice";
import { chipLabel, hasConditions, toChips } from "@/domain/search/conditions";
import type { DictionaryEntry } from "@/domain/search/interpretQuery";
import { matchNotices } from "@/domain/search/matchNotices";
import { recommendNotices } from "@/domain/search/recommendNotices";
import { toBoardColumns } from "@/hooks/board/boardColumns";
import { useSearch } from "@/hooks/search/useSearch";
import { useSeoulToday } from "@/hooks/ui/useSeoulToday";

interface SearchHomeProps {
  notices: Notice[];
  dictionary: DictionaryEntry[];
  syncedAt: string | null; // 데이터 최종 갱신 시각 (ISO). 수집 기록이 없으면 null
  alwaysNote?: string | null; // 상시 열 안내 (상시 혜택을 일부만 보낼 때)
}

export default function SearchHome({ notices, dictionary, syncedAt, alwaysNote = null }: SearchHomeProps) {
  const today = useSeoulToday();
  const search = useSearch(dictionary);

  const { matches, usedKeywords } = useMemo(
    () => matchNotices(notices, search.conditions, search.unknownTerms),
    [notices, search.conditions, search.unknownTerms],
  );
  const columns = useMemo(() => (today ? toBoardColumns(matches, today) : []), [matches, today]);
  const total = columns.reduce((sum, column) => sum + column.cards.length, 0);
  // 결과가 한 건이면 표시할 이유가 없다. 보드 카드에 "먼저 보기"로 붙인다
  const recommendedIds = useMemo(() => {
    if (!today || total <= 1) return new Set<string>();
    return new Set(recommendNotices(matches, search.conditions, today).map((m) => m.notice.id));
  }, [matches, search.conditions, today, total]);
  const selectedNotice = notices.find((n) => n.id === search.selectedNoticeId) ?? null;

  // 패널을 닫으면 키보드 초점을 그 공고 카드로 돌려준다
  const lastOpenedId = useRef<string | null>(null);
  useEffect(() => {
    if (search.selectedNoticeId) {
      lastOpenedId.current = search.selectedNoticeId;
      return;
    }
    if (lastOpenedId.current) {
      document.querySelector<HTMLElement>(`[data-notice-id="${lastOpenedId.current}"]`)?.focus();
      lastOpenedId.current = null;
    }
  }, [search.selectedNoticeId]);

  // 오늘 날짜와 저장된 조건을 확인하기 전에는 빈 자리만 잡아 둔다
  if (!today || !search.ready) {
    return <div className="min-h-0 flex-1 rounded-lg bg-surface" aria-busy="true" />;
  }

  if (!search.showResults) {
    return (
      <div key="start" className="min-h-0 flex-1 overflow-y-auto">
        <StartScreen notices={notices} today={today} onSearch={search.search} onShowAll={search.showAll} />
      </div>
    );
  }

  const filtered = hasConditions(search.conditions) || usedKeywords.length > 0;
  // 문장에서 아무것도 알아듣지 못했을 때만 직접 고르는 선택지를 펼친다
  const understoodNothing =
    !hasConditions(search.conditions) && search.unknownTerms.length > 0 && usedKeywords.length === 0;

  return (
    <div key="results" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:overflow-hidden">
      <div className="flex shrink-0 flex-col gap-2">
        <div className="flex items-center gap-3">
          {/* 서비스 이름을 누르면 첫 화면으로. 저장된 조건이 남아 있으면 첫 화면에서 다시 보드로 넘어가므로 지우고 이동한다 */}
          <Link
            href="/"
            aria-label="혜택톡톡 첫 화면으로"
            onClick={(event) => {
              event.preventDefault();
              search.startOver();
            }}
            className="shrink-0 rounded-sm text-xl font-extrabold tracking-tight hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            혜택톡톡
          </Link>
          <SearchBox size="compact" onSearch={search.search} />
        </div>

        <ConditionBar
          conditions={search.conditions}
          regionChoices={search.regionChoices}
          unknownTerms={search.unknownTerms}
          usedKeywords={usedKeywords}
          onRemove={search.removeChip}
          onAdd={search.addChip}
          trailing={
            <div className="flex w-full flex-wrap items-baseline gap-x-3 md:ml-auto md:w-auto">
              {/* 마감 임박은 접수 중 열의 빨간 D-day가, 처음으로 돌아가기는 왼쪽 위 서비스 이름이 맡는다 */}
              <h1 className="font-bold">
                {filtered ? `조건에 맞을 수 있는 지원사업 ${total}건` : `전체 지원사업 ${total}건`}
              </h1>
            </div>
          }
        />
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1 md:overflow-y-auto md:pr-1">
          {understoodNothing && (
            <section aria-labelledby="picker-title" className="mb-3 flex flex-col gap-3 rounded-lg bg-surface p-4 ring-1 ring-line">
              <h2 id="picker-title" className="font-bold">
                직접 골라서 찾기
              </h2>
              <ConditionPicker notices={notices} today={today} onApply={search.applyConditions} />
            </section>
          )}

          {total === 0 ? (
            <div className="flex flex-col gap-2 rounded-lg bg-surface p-4 text-sm ring-1 ring-line">
              <p>맞는 지원사업이 없어요. 조건을 하나 빼 보세요.</p>
              <div className="flex flex-wrap gap-2">
                {toChips(search.conditions).map((chip) => (
                  <button
                    key={`${chip.kind}-${chip.value}`}
                    type="button"
                    onClick={() => search.removeChip(chip)}
                    className="min-h-11 rounded-md border border-line-strong px-3 hover:bg-ground md:min-h-9"
                  >
                    &apos;{chipLabel(chip)}&apos; 빼고 찾기
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <StatusBoard
              columns={columns}
              recommendedIds={recommendedIds}
              alwaysNote={alwaysNote}
              selectedId={search.selectedNoticeId}
              onOpen={search.openNotice}
            />
          )}
        </div>

        {search.selectedNoticeId && (
          <NoticePanel notice={selectedNotice} today={today} syncedAt={syncedAt} onClose={search.closeNotice} />
        )}
      </div>
    </div>
  );
}
