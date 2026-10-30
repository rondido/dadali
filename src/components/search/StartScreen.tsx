"use client";

// 첫 화면 (기획서 P01): 큰 입력창, 예시 문장 4개, 저장 안 함 고지, 이번 주 마감 미리보기 (F01, F11)
import NoticeCard from "@/components/board/NoticeCard";
import SearchBox from "@/components/search/SearchBox";
import type { IsoDate, Notice } from "@/domain/notice/notice";
import { closingThisWeek, summarizeNotices } from "@/domain/notice/noticeStatus";
import { toBoardColumns } from "@/hooks/board/boardColumns";

const EXAMPLES = [
  "서울에서 카페 하는 32살인데 가게 인테리어 지원 있나요?",
  "창업 지원금",
  "부산 사는 대학생 월세 지원",
  "40대 재취업 교육",
];

const PREVIEW_COUNT = 3;

interface StartScreenProps {
  notices: Notice[];
  today: IsoDate;
  onSearch: (text: string) => void;
  onShowAll: () => void;
  onOpenNotice: (id: string) => void;
}

export default function StartScreen({ notices, today, onSearch, onShowAll, onOpenNotice }: StartScreenProps) {
  const summary = summarizeNotices(notices, today);
  const closing = closingThisWeek(notices, today).slice(0, PREVIEW_COUNT);
  // 미리보기 카드도 보드와 같은 배지·기간 막대를 쓴다
  const previewCards = toBoardColumns(
    closing.map((notice) => ({ notice, reasons: [] })),
    today,
  ).flatMap((column) => column.cards);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="search-title" className="flex flex-col gap-3">
        <h1 id="search-title" className="text-2xl font-bold">
          내 상황에 맞는 지원사업 찾기
        </h1>
        <p className="text-ink-2">사는 곳, 나이, 하는 일, 필요한 것을 적으면 조건에 맞을 수 있는 지원사업을 찾아드려요.</p>
        <SearchBox size="large" onSearch={onSearch} />
        <p className="text-sm text-muted">입력한 문장은 조건을 찾는 데만 쓰고 저장하지 않아요.</p>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink-2">이렇게 적어 보세요</p>
          <ul className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => onSearch(example)}
                  className="min-h-11 rounded-full border border-line-strong bg-surface px-4 text-left text-sm text-ink hover:bg-ground"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="closing-title" className="flex flex-col gap-3">
        <h2 id="closing-title" className="flex flex-wrap items-baseline gap-x-3 text-lg font-bold">
          이번 주 마감
          <span className="text-sm font-normal text-muted">
            지금 전국에서 진행 중 {summary.ongoing}건 · 이번 주 마감 {summary.closingThisWeek}건
          </span>
        </h2>
        {previewCards.length === 0 ? (
          <p className="text-sm text-muted">이번 주에 마감하는 공고가 없어요.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-3">
            {previewCards.map((card) => (
              <li key={card.match.notice.id}>
                <NoticeCard card={card} selected={false} onOpen={onOpenNotice} />
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onShowAll}
          className="min-h-11 self-start rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium hover:bg-ground"
        >
          전체 지원사업 보기
        </button>
      </section>
    </div>
  );
}
