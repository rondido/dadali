"use client";

// 첫 화면은 로고·검색창·예시 검색어만 둔다 (검색 엔진 첫 화면처럼). 검색하면 같은 검색창이 위로 올라가며 가로로 늘어나 붙고,
// 그 아래에 조건 칩과 상태별 공고 목록이 떠오른다. 선택한 공고는 옆 상세 패널에서 읽는다.
// 화면 높이(100vh) 안에서 위쪽(검색·칩)은 고정하고 목록과 패널이 각자 스크롤한다 (모바일 포함).
// 스크롤 영역은 relative로 두어, 화면 낭독기용 숨김 글자(sr-only, absolute)가 영역 밖으로 나가 페이지를 늘리지 않게 한다
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import NoticeRow from "@/components/board/NoticeRow";
import StatusBoard from "@/components/board/StatusBoard";
import NoticePanel from "@/components/notice/NoticePanel";
import type { PopularNotice } from "@/db/homeData";
import ConditionBar from "@/components/search/ConditionBar";
import ConditionPicker from "@/components/search/ConditionPicker";
import SearchBox from "@/components/search/SearchBox";
import StartScreen from "@/components/search/StartScreen";
import { ListSkeleton, ResultsSkeleton, Skeleton, StartSkeleton } from "@/components/ui/Skeleton";
import LogoMark from "@/components/ui/LogoMark";
import { useToast } from "@/components/ui/Toast";
import type { Notice } from "@/domain/notice/notice";
import { chipLabel, hasConditions, toChips, withoutChip, type ConditionChip } from "@/domain/search/conditions";
import {
  EMPTY_DETAILS,
  applyDetails,
  detailChipLabel,
  hasDetails,
  toDetailChips,
  type DetailFilters,
} from "@/domain/search/detailFilters";
import type { DictionaryEntry } from "@/domain/search/interpretQuery";
import { matchNotices, type NoticeMatch } from "@/domain/search/matchNotices";
import { recommendNotices } from "@/domain/search/recommendNotices";
import { boardCardOf, toBoardColumns, type BoardOrder } from "@/hooks/board/boardColumns";
import { useNoticeMemory } from "@/hooks/notice/useNoticeMemory";
import { useSearch } from "@/hooks/search/useSearch";
import { afterLeave } from "@/hooks/ui/motion";
import { useSeoulToday } from "@/hooks/ui/useSeoulToday";

// 최근·관심이 비었을 때: 목록 영역 가운데에 짧은 강조선과 함께
function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-60 flex-1 flex-col items-center justify-center gap-4 text-center motion-safe:animate-fade-in">
      <span aria-hidden="true" className="trim-line bg-line-strong" />
      <p className="text-[15px] text-muted">{children}</p>
    </div>
  );
}

// 건수 숫자: 값이 바뀌면 아래에서 굴러 올라온다 (값을 key로 써서 바뀔 때마다 다시 그린다)
function Count({ value }: { value: number }) {
  return (
    <span key={value} className="inline-block tabular-nums motion-safe:animate-count-in">
      {value.toLocaleString()}
    </span>
  );
}

interface SearchHomeProps {
  notices: Notice[];
  dictionary: DictionaryEntry[];
  syncedAt: string | null; // 데이터 최종 갱신 시각 (ISO). 수집 기록이 없으면 null
  alwaysNote?: string | null; // 상시 열 안내 (상시 혜택을 일부만 보낼 때)
  isSample?: boolean; // 샘플 데이터로 그리는 중 (첫 화면 고지에 함께 알린다)
  popular?: PopularNotice[]; // 첫 화면에 둘 많이 찾는 혜택 (없으면 예시 검색어)
}

export default function SearchHome({
  notices,
  dictionary,
  syncedAt,
  alwaysNote = null,
  isSample = false,
  popular = [],
}: SearchHomeProps) {
  const today = useSeoulToday();
  const search = useSearch(dictionary);
  const toast = useToast();
  // 토스트의 되돌리기는 나중에 눌리므로, 그때의 최신 검색 상태로 조건을 되살린다
  const latest = useRef(search);
  latest.current = search;

  // 조건 칩을 빼면 무엇을 뺐는지 알리고 되돌릴 수 있게 한다 (×를 잘못 눌렀을 때)
  const removeChip = (chip: ConditionChip) => {
    search.removeChip(chip);
    toast({
      message: `${chipLabel(chip)} 조건을 뺐어요`,
      action: { label: "되돌리기", onClick: () => latest.current.addChip(chip) },
    });
  };
  // 이 브라우저에만 남기는 기록: 최근 본 공고, 관심 공고
  const memory = useNoticeMemory();
  // 목록 위 보기 전환: 검색 결과 / 최근 본 공고 / 관심 공고. 최근·관심은 검색 조건과 상관없이 보여 준다
  const [listView, setListView] = useState<"results" | "recent" | "saved">("results");
  // 검색 결과 구역 안의 순서: 맞춤순(조건과 분명히 맞은 공고 먼저) / 마감순
  const [order, setOrder] = useState<BoardOrder>("match");
  const savedOnly = listView === "saved";
  const recentOnly = listView === "recent";

  // 공고 내용 찾기: 지금 받은 목록 → 관심 → 최근 본 공고 순서 (받은 목록에 없는 상시 공고도 기록에서 찾는다)
  const findNotice = (id: string | null) =>
    id === null
      ? null
      : (notices.find((n) => n.id === id) ??
        memory.savedNotices.find((n) => n.id === id) ??
        memory.recentNotices.find((n) => n.id === id) ??
        null);

  const openNotice = (id: string) => {
    const notice = findNotice(id);
    if (notice) memory.markViewed(notice);
    search.openNotice(id);
  };
  const toggleSave = (notice: Notice) => {
    const added = memory.toggleSaved(notice);
    toast({ message: added ? "관심 공고에 담았어요" : "관심 공고에서 뺐어요" });
  };
  // 상세에서 이 공고의 링크를 복사한다. 조건도 주소에 담겨 있어, 받은 사람에게 같은 결과와 이 공고가 열린다
  const copyLink = async (id: string) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("notice", id);
      await navigator.clipboard.writeText(url.toString());
      toast({ message: "링크를 복사했어요" });
    } catch {
      toast({ message: "링크를 복사하지 못했어요" });
    }
  };

  // 처음으로 돌아가면 저장된 조건도 지우므로 알려 준다
  const startOver = () => {
    const hadConditions = hasConditions(search.conditions);
    search.startOver();
    if (hadConditions) toast({ message: "저장된 조건을 지웠어요" });
  };

  const { matches, usedKeywords } = useMemo(
    () => matchNotices(notices, search.conditions, search.unknownTerms),
    [notices, search.conditions, search.unknownTerms],
  );
  // 관심 공고는 지금 받은 목록에 있으면 최신 내용을, 없으면 담을 때 저장해 둔 내용을 쓴다
  const savedMatches = useMemo(
    (): NoticeMatch[] =>
      memory.savedNotices.map((saved) => ({ notice: notices.find((n) => n.id === saved.id) ?? saved, reasons: [] })),
    [memory.savedNotices, notices],
  );
  // 상세 조건(포함·제외 단어, 전국 대상 제외)은 받아 둔 목록에서 한 번 더 거른다. 관심 공고만 볼 때는 거르지 않는다
  const detailed = useMemo(() => applyDetails(matches, search.details), [matches, search.details]);
  const boardMatches = savedOnly ? savedMatches : detailed;
  // 상세 조건을 적용했을 때의 결과 건수
  const countFor = (details: DetailFilters) =>
    today ? toBoardColumns(applyDetails(matches, details), today).reduce((sum, column) => sum + column.cards.length, 0) : 0;
  // 접수 중·접수 예정 건수 (날짜 있는 공고는 모두 받아 두었으므로 정확하다)
  const datedCount = (list: NoticeMatch[]) =>
    today
      ? toBoardColumns(list, today)
          .filter((column) => column.key !== "always")
          .reduce((sum, column) => sum + column.cards.length, 0)
      : 0;
  const columns = useMemo(() => (today ? toBoardColumns(boardMatches, today, order) : []), [boardMatches, today, order]);
  const total = columns.reduce((sum, column) => sum + column.cards.length, 0);
  // 결과가 한 건이면 표시할 이유가 없다. 보드 카드에 "먼저 보기"로 붙인다 (관심 공고만 볼 때는 고를 근거가 없다)
  const recommendedIds = useMemo(() => {
    if (!today || total <= 1 || listView !== "results") return new Set<string>();
    return new Set(recommendNotices(matches, search.conditions, today).map((m) => m.notice.id));
  }, [matches, search.conditions, today, total, listView]);
  const selectedNotice = findNotice(search.selectedNoticeId);

  // 최근 본 공고: 본 순서대로(가장 최근이 위) 한 줄 목록. 마감된 공고도 "마감"으로 남긴다
  const recentCards = useMemo(
    () =>
      today
        ? memory.recentNotices.map((recent) =>
            boardCardOf({ notice: notices.find((n) => n.id === recent.id) ?? recent, reasons: [] }, today),
          )
        : [],
    [memory.recentNotices, notices, today],
  );

  // 결과가 0건일 때: 조건 하나를 빼면 접수 중·접수 예정이 몇 건이 되는지 (날짜 있는 공고는 모두 받아 두었으므로 정확하다)
  const removalCounts = useMemo(() => {
    if (!today || total > 0 || listView !== "results") return [];
    return toChips(search.conditions)
      .map((chip) => {
        const { matches: without } = matchNotices(notices, withoutChip(search.conditions, chip), search.unknownTerms);
        const count = toBoardColumns(applyDetails(without, search.details), today)
          .filter((column) => column.key !== "always")
          .reduce((sum, column) => sum + column.cards.length, 0);
        return { chip, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [today, total, listView, search.conditions, search.unknownTerms, search.details, notices]);

  // 응답이 늦으면 알리고 다시 시도할 수 있게 한다
  useEffect(() => {
    if (search.stalled) {
      toast({ message: "응답이 늦어요", action: { label: "다시 시도", onClick: () => latest.current.retry() } });
    }
  }, [search.stalled, toast]);

  // 키 처리기는 상세를 열 때 한 번 붙이므로, 공고 여는 함수는 늘 최신 것을 쓰도록 ref로 넘긴다
  const openNoticeRef = useRef(openNotice);
  openNoticeRef.current = openNotice;

  // 목록 보기 전환의 선택 표시: 선택된 항목 뒤에 흰 바탕 상자를 깔고, 바꾸면 옆으로 미끄러져 옮겨 간다.
  // (선으로 표시하면 바로 아래 구역 제목의 강조선과 겹쳐 보인다)
  // 항목 폭(건수 자릿수)이 바뀌어도 맞추려고 그린 뒤마다 위치를 재고, 같으면 다시 그리지 않는다
  const tabRefs = useRef<Partial<Record<"results" | "recent" | "saved", HTMLButtonElement | null>>>({});
  const [tabMark, setTabMark] = useState<{ left: number; width: number } | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = tabRefs.current[listView];
    if (!el) return;
    const left = el.offsetLeft;
    const width = el.offsetWidth;
    setTabMark((current) => (current?.left === left && current.width === width ? current : { left, width }));
  });

  // 이전·다음 공고: 지금 화면에 보이는 목록(검색 결과·최근·관심)의 순서를 그대로 따른다 (더보기로 펼친 줄까지)
  const neighborOf = (step: -1 | 1): HTMLElement | null => {
    const rows = [...document.querySelectorAll<HTMLElement>("[data-notice-id]")];
    const index = rows.findIndex((row) => row.dataset.noticeId === latest.current.selectedNoticeId);
    return index < 0 ? null : (rows[index + step] ?? null);
  };
  // 이웃 공고를 열고, 목록에서도 그 줄이 보이게 스크롤한다. 열었으면 true
  const stepNotice = (step: -1 | 1): boolean => {
    const next = neighborOf(step);
    if (!next?.dataset.noticeId) return false;
    next.scrollIntoView({ block: "nearest" });
    openNoticeRef.current(next.dataset.noticeId);
    return true;
  };
  const stepRef = useRef(stepNotice);
  stepRef.current = stepNotice;

  // 상세의 < > 버튼을 흐리게 할지: 목록이 그려진 뒤에 이웃이 있는지 본다.
  // 보기 전환·조건·더보기(목록 안쪽 상태)로 줄이 바뀌어도 맞추려고 매 렌더 뒤에 확인하고,
  // 값이 같으면 같은 객체를 돌려줘 다시 그리지 않는다 (무한 렌더 방지)
  const [neighbors, setNeighbors] = useState({ prev: false, next: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!search.selectedNoticeId) return;
    const prev = neighborOf(-1) !== null;
    const next = neighborOf(1) !== null;
    setNeighbors((current) => (current.prev === prev && current.next === next ? current : { prev, next }));
  });

  // 상세가 열려 있을 때 ↑/↓로도 이전·다음 공고를 연다 (글을 쓰는 중이거나 조건 추가 창이 열려 있으면 하지 않는다)
  useEffect(() => {
    if (!search.selectedNoticeId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key !== "ArrowDown" && e.key !== "ArrowUp") || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      if (document.querySelector("[data-add-open]")) return;
      if (stepRef.current(e.key === "ArrowDown" ? 1 : -1)) e.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [search.selectedNoticeId]);

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

  // 결과 화면 → 첫 화면: 목록·조건 칩·작은 로고를 바로 지우지 않고 먼저 흐리게 한 뒤 지운다 (들어올 때의 역순).
  // start가 바뀌는 순간 같은 렌더에서 leaving을 켜야 한 프레임이라도 목록이 사라졌다 나타나지 않는다
  const start = !search.showResults;
  const [prevStart, setPrevStart] = useState(start);
  const [resultsLeaving, setResultsLeaving] = useState(false);
  if (prevStart !== start) {
    setPrevStart(start);
    setResultsLeaving(start);
  }
  useEffect(() => {
    if (!resultsLeaving) return;
    return afterLeave(() => setResultsLeaving(false));
  }, [resultsLeaving]);
  const showResultsArea = !start || resultsLeaving;

  // 조건을 바꾸면 목록을 맨 위부터 보여 준다 (아래까지 내려 본 위치가 남아 있으면 새 결과의 앞부분을 놓친다)
  const listRef = useRef<HTMLDivElement>(null);
  const conditionsKey = JSON.stringify(search.conditions);
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
    // 조건을 바꾸면 최근·관심 보기도 끝낸다 (바꾼 조건의 결과를 보려는 것이므로)
    setListView("results");
  }, [conditionsKey]);

  // 오늘 날짜와 저장된 조건을 확인하기 전에는 그 화면 모양의 스켈레톤을 보여 준다
  if (!today || !search.ready) {
    return search.showResults ? <ResultsSkeleton /> : <StartSkeleton />;
  }

  const filtered = hasConditions(search.conditions) || usedKeywords.length > 0 || hasDetails(search.details);
  // 문장에서 아무것도 알아듣지 못했을 때만 직접 고르는 선택지를 펼친다
  const understoodNothing =
    !hasConditions(search.conditions) && search.unknownTerms.length > 0 && usedKeywords.length === 0;

  // 마감 임박은 목록 맨 위 "7일 안에 마감" 묶음이, 처음으로 돌아가기는 왼쪽 위 서비스 이름이 맡는다
  // 목록 제목(건수)은 화면 낭독기용. 눈에는 목록 위 "검색 결과 N | 관심 N" 전환이 같은 정보를 보여 준다
  const heading = (
    <h1 className="sr-only">
      {recentOnly
        ? `최근 본 공고 ${recentCards.length}건`
        : `${savedOnly ? "관심 공고" : filtered ? "조건에 맞을 수 있는 지원사업" : "전체 지원사업"} ${total}건`}
    </h1>
  );

  // 검색 결과 건수 (최근·관심을 보는 중에도 검색 결과 쪽 건수를 보여 준다)
  const resultsTotal = listView === "results" ? total : countFor(search.details);

  // 목록 보기 전환 버튼 (선택된 쪽만 진하게). 비어 있어도 누를 수 있게 두고, 누르면 가운데에 빈 안내를 보여 준다
  const viewTab = (active: boolean) =>
    `relative flex min-h-9 items-center gap-1.5 rounded-md px-3 text-[15px] transition-colors ${
      active ? "font-bold text-ink" : "text-muted hover:text-ink"
    }`;

  // 목록 바로 위: 검색 결과 / 최근 / 관심 보기 전환
  const listHeader = (
    <div className="flex shrink-0 flex-wrap items-center gap-3 pb-4">
      {heading}
      <div role="group" aria-label="목록 보기" className="relative flex items-center gap-1">
        {tabMark !== null && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 rounded-md bg-surface shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
            style={{ left: tabMark.left, width: tabMark.width }}
          />
        )}
        <button
          ref={(el) => {
            tabRefs.current.results = el;
          }}
          type="button"
          aria-pressed={listView === "results"}
          onClick={() => setListView("results")}
          className={viewTab(listView === "results")}
        >
          검색 결과
          {/* 바꾼 조건의 서버 결과를 기다리는 동안은 건수도 자리만 잡아 둔다 */}
          {search.pending && listView === "results" ? (
            <Skeleton className="inline-block h-4 w-6" />
          ) : (
            <Count value={resultsTotal} />
          )}
        </button>
        <button
          ref={(el) => {
            tabRefs.current.recent = el;
          }}
          type="button"
          aria-pressed={recentOnly}
          onClick={() => setListView("recent")}
          className={viewTab(recentOnly)}
        >
          최근 <Count value={recentCards.length} />
        </button>
        <button
          ref={(el) => {
            tabRefs.current.saved = el;
          }}
          type="button"
          aria-pressed={savedOnly}
          onClick={() => setListView("saved")}
          className={viewTab(savedOnly)}
        >
          관심 <Count value={memory.savedIds.size} />
        </button>
      </div>
      {/* 검색 결과 보기에서만: 구역 안의 순서를 맞춤순 / 마감순으로 바꾼다 (보기 전환보다 작게, 오른쪽 끝에) */}
      {listView === "results" && (
        <div role="group" aria-label="정렬" className="ml-auto flex items-center gap-0.5 rounded-md bg-line/60 p-0.5">
          {(
            [
              ["match", "맞춤순"],
              ["deadline", "마감순"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={order === value}
              onClick={() => setOrder(value)}
              className={`min-h-8 rounded-sm px-3 text-[13px] transition-colors ${
                order === value ? "bg-surface font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {recentOnly && recentCards.length > 0 && (
        <button type="button" onClick={memory.clearRecent} className="ml-auto min-h-9 px-1 text-sm text-muted hover:text-ink">
          기록 지우기
        </button>
      )}
    </div>
  );

  // 최근 본 공고 목록 (본 순서대로)
  const recentList =
    recentCards.length === 0 ? (
      <EmptyState>최근 본 공고가 없어요</EmptyState>
    ) : (
      <ul aria-label="최근 본 공고" className="flex flex-col divide-y divide-line motion-safe:animate-fade-in">
        {recentCards.map((card) => (
          <li key={card.match.notice.id} className="bg-surface">
            <NoticeRow
              card={card}
              recommended={false}
              selected={card.match.notice.id === search.selectedNoticeId}
              viewed={false}
              saved={memory.savedIds.has(card.match.notice.id)}
              onOpen={openNotice}
            />
          </li>
        ))}
      </ul>
    );

  // 머리가 움직이는 시간. 줄이기 설정(prefers-reduced-motion)이면 움직이지 않는다.
  // 첫 화면으로 돌아갈 때는 목록이 먼저 흐려지도록 머리는 조금 늦게(150ms) 내려간다
  const move = `duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${start ? "delay-150" : ""}`;
  // 사라지는 중인 결과 요소: 흐려지고, 누를 수 없게 한다
  const leavingClass = "motion-safe:animate-fade-out pointer-events-none";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* 머리: 첫 화면에서는 화면 가운데쯤, 결과 화면에서는 맨 위. 검색창은 두 화면이 같은 것을 써서 입력한 글이 그대로 남는다 */}
      <div className={`flex shrink-0 flex-col transition-[padding] ${move} ${start ? "pt-[22vh]" : "pt-1"}`}>
        {/* 큰 로고: 첫 화면에서만 펼치고, 검색하면 먼저 빠르게 투명해진 뒤 위아래로 접힌다 (접히는 도중 잘린 글자 조각이 보이지 않게) */}
        <div
          aria-hidden={!start}
          className={`grid motion-reduce:transition-none ${
            start
              ? "grid-rows-[1fr] opacity-100 [transition:grid-template-rows_500ms_cubic-bezier(0.2,0.8,0.2,1)_150ms,opacity_300ms_ease-out_300ms]"
              : "grid-rows-[0fr] opacity-0 [transition:grid-template-rows_500ms_cubic-bezier(0.2,0.8,0.2,1),opacity_120ms_ease-out]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col items-center gap-3 pb-10 text-center">
              {/* 로고 마크 + 서비스명 (마크는 장식이라 화면 낭독기는 이름만 읽는다) */}
              <div className="flex items-center gap-3.5">
                <LogoMark className="h-11 w-auto" />
                {start && <h1 className="text-5xl font-extrabold tracking-tight">혜택톡톡</h1>}
                {!start && <p className="text-5xl font-extrabold tracking-tight">혜택톡톡</p>}
              </div>
              <p className="text-lg text-ink-2">이번 달 정부지원, 한눈에</p>
            </div>
          </div>
        </div>

        {/* 검색창 줄: 가운데를 기준으로 양옆으로 고르게 늘어난다 (목표 폭을 정확히 100%로 두어 끝에서 뚝 멈추지 않게).
            작은 로고는 흐름 밖(absolute)에 두고 왼쪽 여백만 부드럽게 열어 자리를 만든다. 로고가 끼어들며 검색창을 밀지 않게 하기 위함 */}
        <div
          className={`relative mx-auto flex w-full items-center transition-[max-width,padding] ${move} ${
            start ? "max-w-2xl pl-0" : "max-w-full pl-36"
          }`}
        >
          {/* 서비스 이름을 누르면 첫 화면으로. 저장된 조건이 남아 있으면 첫 화면에서 다시 보드로 넘어가므로 지우고 이동한다 */}
          {showResultsArea && (
            <Link
              href="/"
              aria-label="혜택톡톡 첫 화면으로"
              onClick={(event) => {
                event.preventDefault();
                startOver();
              }}
              className={`absolute top-1/2 left-0 flex -translate-y-1/2 items-center gap-2 rounded-sm text-xl font-extrabold tracking-tight hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                resultsLeaving ? leavingClass : "motion-safe:animate-fade-in motion-safe:[animation-delay:300ms]"
              }`}
            >
              <LogoMark className="h-7 w-auto" />
              혜택톡톡
            </Link>
          )}
          <SearchBox size={start ? "large" : "compact"} onSearch={search.search} />
        </div>

        {!showResultsArea ? (
          <StartScreen popular={popular} onSearch={search.search} onOpenNotice={search.openNotice} onShowAll={search.showAll} />
        ) : (
          // 떠오르기 애니메이션은 끝난 뒤에도 이 요소를 별도 쌓임 층으로 만든다. 그 안에 있는 조건 추가 창의 z-50이 갇혀
          // dim과 목록 뒤로 가려지지 않도록, 창이 열리면(data-add-open) 이 요소 자체를 dim 위로 올린다
          <div className={`relative pt-4 has-[[data-add-open]]:z-50 ${resultsLeaving ? leavingClass : "motion-safe:animate-rise"}`}>
            <ConditionBar
              conditions={search.conditions}
              regionChoices={search.regionChoices}
              unknownTerms={search.unknownTerms}
              usedKeywords={usedKeywords}
              understoodFrom={search.understoodFrom}
              onRemove={removeChip}
              onAdd={search.addChip}
              onPickerOpenChange={(open) => (open ? search.holdRequests() : search.releaseRequests())}
              detailChips={toDetailChips(search.details).map((chip) => ({
                key: chip.kind === "localOnly" ? chip.kind : `${chip.kind}-${chip.value}`,
                label: detailChipLabel(chip),
                onRemove: () => search.removeDetailChip(chip),
              }))}
              details={search.details}
              onDetailsChange={search.setDetails}
            />
          </div>
        )}
      </div>

      {/* 목록·패널 영역은 투명도로만 나타나게 한다. 위치 이동(transform) 애니메이션은 끝난 뒤에도 이 영역을 position: fixed의
          기준 상자로 만들어, 화면 전체를 덮어야 할 dim과 떠 있는 상세 패널이 이 영역 안에만 그려진다 */}
      {showResultsArea && (
        <div
          className={`mt-8 flex min-h-0 flex-1 gap-10 ${
            resultsLeaving ? leavingClass : "motion-safe:animate-fade-in motion-safe:[animation-delay:120ms]"
          }`}
        >
          <div className="flex min-w-0 flex-1 flex-col">
          {listHeader}
          <div ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto md:pr-1">
            {understoodNothing && (
              <section aria-labelledby="picker-title" className="mb-8 flex flex-col gap-3 bg-surface p-6">
                <h2 id="picker-title" className="sr-only">
                  직접 골라서 찾기
                </h2>
                <ConditionPicker notices={notices} today={today} onApply={search.applyConditions} />
              </section>
            )}

            {/* 보기(검색 결과·최근·관심)를 바꾸면 목록을 새로 그리며 짧게 페이드한다. 빈 안내가 가운데 오도록 영역 높이를 채운다 */}
            <div key={listView} className="flex min-h-full flex-col motion-safe:animate-fade-in">
            {/* 바꾼 조건의 서버 결과를 기다리는 동안은 목록 전체를 스켈레톤으로 둔다 (칩은 이미 바뀌어 있다) */}
            {recentOnly ? (
              recentList
            ) : search.pending && !savedOnly ? (
              <ListSkeleton />
            ) : total === 0 && savedOnly ? (
              <EmptyState>담은 공고가 없어요</EmptyState>
            ) : total === 0 ? (
              <div className="flex flex-col gap-3 motion-safe:animate-fade-in">
                <div className="flex flex-col gap-4 text-[15px]">
                  <p>맞는 지원사업이 없어요</p>
                  {/* 빼면 몇 건이 되는지 함께 보여 주고, 많이 늘어나는 조건부터 놓는다 */}
                  <div className="flex flex-wrap gap-2">
                    {hasDetails(search.details) && (
                      <button
                        type="button"
                        onClick={() => search.setDetails(EMPTY_DETAILS)}
                        className="flex min-h-11 items-center gap-2 rounded-md bg-surface px-4 hover:bg-primary-tint hover:text-primary"
                      >
                        상세 조건 빼면
                        <span className="text-sm tabular-nums text-muted">{datedCount(matches)}건</span>
                      </button>
                    )}
                    {removalCounts.map(({ chip, count }) => (
                      <button
                        key={`${chip.kind}-${chip.value}`}
                        type="button"
                        onClick={() => removeChip(chip)}
                        className="flex min-h-11 items-center gap-2 rounded-md bg-surface px-4 hover:bg-primary-tint hover:text-primary"
                      >
                        {chipLabel(chip)} 빼면
                        <span className="text-sm tabular-nums text-muted">{count}건</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // 스켈레톤에서 목록으로 바뀔 때 뚝 바뀌지 않게 짧게 페이드한다
              <div className="motion-safe:animate-fade-in">
                <StatusBoard
                  columns={columns}
                  recommendedIds={recommendedIds}
                  alwaysNote={alwaysNote}
                  selectedId={search.selectedNoticeId}
                  viewedIds={memory.viewedIds}
                  savedIds={memory.savedIds}
                  onOpen={openNotice}
                />
              </div>
            )}
            </div>
          </div>
          </div>

          {search.selectedNoticeId ? (
            // 공고 내용을 이미 받아 두었으면 서버 응답을 기다리지 않고 바로 보여 준다. 없을 때만 스켈레톤
            <NoticePanel
              notice={selectedNotice}
              today={today}
              syncedAt={syncedAt}
              onClose={search.closeNotice}
              loading={search.noticeLoading && !selectedNotice}
              saved={selectedNotice ? memory.savedIds.has(selectedNotice.id) : false}
              onToggleSave={selectedNotice ? () => toggleSave(selectedNotice) : undefined}
              onCopyLink={selectedNotice ? () => copyLink(selectedNotice.id) : undefined}
              onPrev={neighbors.prev ? () => stepNotice(-1) : undefined}
              onNext={neighbors.next ? () => stepNotice(1) : undefined}
            />
          ) : (
            // 넓은 화면(1280px 이상)은 상세 자리를 늘 비워 두어, 공고를 열고 닫아도 목록 폭이 바뀌지 않게 한다
            <div className="hidden w-[26rem] shrink-0 flex-col items-center justify-center gap-4 p-10 text-center motion-safe:animate-fade-in xl:flex 2xl:w-[34rem]">
              <span aria-hidden="true" className="trim-line bg-line-strong" />
              <p className="text-base text-muted">공고를 선택하세요</p>
            </div>
          )}
        </div>
      )}

      {/* 고지: 첫 화면 맨 아래에만 둔다 */}
      {!showResultsArea && (
        <footer className="mt-auto flex flex-col items-center gap-1 pt-6 text-center text-xs text-muted motion-safe:animate-fade-in">
          <p>
            정부 공식 서비스가 아니에요. 자격·일정은 공식 공고를 확인하세요.
            {isSample && " · 샘플 데이터"}
          </p>
          <p>검색어는 저장하지 않아요. 관심·열어 본 공고는 이 브라우저에만 남아요.</p>
        </footer>
      )}
    </div>
  );
}
