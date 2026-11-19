"use client";

// 첫 화면에서 검색창 아래에 두는 것: 예시 검색어와 전체 보기. 로고와 검색창은 SearchHome 머리에 있고 결과 화면과 같이 쓴다
// (예시는 실제 검색 집계가 아니므로 "인기 검색어"라고 부르지 않는다)

const EXAMPLES = ["서울 카페 인테리어", "창업 지원금", "부산 대학생 월세", "40대 재취업 교육"];

interface StartScreenProps {
  onSearch: (text: string) => void;
  onShowAll: () => void;
}

export default function StartScreen({ onSearch, onShowAll }: StartScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 pt-6 motion-safe:animate-fade-in">
      <ul aria-label="예시 검색어" className="flex flex-wrap justify-center gap-2">
        {/* 처음 열릴 때 왼쪽부터 차례로 떠오른다 */}
        {EXAMPLES.map((example, i) => (
          <li key={example} className="motion-safe:animate-rise" style={{ animationDelay: `${150 + i * 60}ms` }}>
            <button
              type="button"
              onClick={() => onSearch(example)}
              className="min-h-10 rounded-md bg-surface px-4 text-sm text-ink-2 hover:bg-primary-tint hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              {example}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onShowAll}
        className="mt-8 min-h-10 text-sm text-muted underline underline-offset-4 hover:text-ink"
      >
        전체 지원사업 보기
      </button>
    </div>
  );
}
