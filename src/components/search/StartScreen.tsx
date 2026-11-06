"use client";

// 첫 화면 (기획서 P01): 검색창 하나에 집중한다. 저장 안 함 고지와 짧은 예시 문장, 현재 공고 현황 한 줄만 함께 둔다 (F01, F11)
import SearchBox from "@/components/search/SearchBox";
import type { IsoDate, Notice } from "@/domain/notice/notice";
import { summarizeNotices } from "@/domain/notice/noticeStatus";

const EXAMPLES = ["서울 카페 인테리어", "창업 지원금", "부산 대학생 월세", "40대 재취업 교육"];

interface StartScreenProps {
  notices: Notice[];
  today: IsoDate;
  onSearch: (text: string) => void;
  onShowAll: () => void;
}

export default function StartScreen({ notices, today, onSearch, onShowAll }: StartScreenProps) {
  const summary = summarizeNotices(notices, today);

  return (
    <div className="flex min-h-full flex-col items-center justify-center pb-[10vh]">
      <div className="flex w-full max-w-2xl flex-col items-center gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">혜택톡톡</h1>
          <p className="text-lg text-ink-2">이번 달 정부지원, 한눈에</p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <SearchBox size="large" onSearch={onSearch} />
          <p className="text-center text-sm text-muted">입력한 문장은 조건을 찾는 데만 쓰고 저장하지 않아요.</p>
        </div>

        <ul aria-label="예시 문장" className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => onSearch(example)}
                className="min-h-11 rounded-full border border-line-strong bg-surface px-4 text-sm text-ink hover:bg-ground"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>

        <p className="flex flex-wrap items-center justify-center gap-x-3 text-sm text-ink-2">
          <span>
            지금 진행 중 {summary.ongoing}건 · 이번 주 마감{" "}
            <strong className="text-danger">{summary.closingThisWeek}건</strong>
          </span>
          <button type="button" onClick={onShowAll} className="min-h-11 underline underline-offset-2 hover:text-ink">
            전체 지원사업 보기
          </button>
        </p>
      </div>
    </div>
  );
}
