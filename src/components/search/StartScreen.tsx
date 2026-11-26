"use client";

// 첫 화면에서 검색창 아래에 두는 것: 많이 찾는 혜택 4건(없으면 예시 검색어)과 전체 보기. 로고와 검색창은 SearchHome 머리에 있고 결과 화면과 같이 쓴다
// 많이 찾는 혜택은 출처 사이트 조회수 상위 공고다(국민내일배움카드 등). 누르면 그 공고의 상세를 바로 연다:
// 처음 온 사람이 검색어를 고민하기 전에 "이런 걸 받을 수 있구나"를 먼저 만나게 한다
// (우리 서비스의 검색 집계가 아니므로 "인기 검색어"라고 부르지 않는다)
import type { PopularNotice } from "@/db/homeData";

// 조회수를 모를 때(샘플 데이터) 대신 보여 주는 예시 검색어
const EXAMPLES = ["서울 카페 인테리어", "창업 지원금", "부산 대학생 월세", "40대 재취업 교육"];

interface StartScreenProps {
  popular?: PopularNotice[];
  onSearch: (text: string) => void;
  onOpenNotice: (id: string) => void;
  onShowAll: () => void;
}

const chipClass =
  "min-h-10 rounded-md bg-surface px-4 text-sm text-ink-2 hover:bg-primary-tint hover:text-primary focus-visible:outline-2 focus-visible:outline-primary";

export default function StartScreen({ popular = [], onSearch, onOpenNotice, onShowAll }: StartScreenProps) {
  const items =
    popular.length > 0
      ? popular.map((notice) => ({ key: notice.id, label: notice.title, onClick: () => onOpenNotice(notice.id) }))
      : EXAMPLES.map((example) => ({ key: example, label: example, onClick: () => onSearch(example) }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 pt-6 motion-safe:animate-fade-in">
      <ul aria-label={popular.length > 0 ? "많이 찾는 혜택" : "예시 검색어"} className="flex flex-wrap justify-center gap-2">
        {/* 처음 열릴 때 왼쪽부터 차례로 떠오른다 */}
        {items.map((item, i) => (
          <li key={item.key} className="motion-safe:animate-rise" style={{ animationDelay: `${150 + i * 60}ms` }}>
            <button type="button" onClick={item.onClick} className={chipClass}>
              {item.label}
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
