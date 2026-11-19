// 스켈레톤: 내용이 들어올 자리를 같은 모양의 회색 막대로 먼저 보여 준다.
// 화면 낭독기에는 막대 대신 "불러오는 중"만 한 번 읽히게 하고(aria-busy), 움직임 줄이기 설정이면 깜빡이지 않는다

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block rounded-sm bg-line motion-safe:animate-pulse ${className}`} />;
}

// 공고 목록 한 줄 (NoticeRow와 같은 여백·배치: 머리말, 공고명, 레이블, 오른쪽 D-day)
function NoticeRowSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <div className="flex items-center gap-6 bg-surface px-5 py-5 sm:gap-10 sm:px-7 sm:py-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className={`h-4 ${titleWidth}`} />
        <div className="mt-1.5 flex gap-1.5">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <Skeleton className="h-5 w-12 shrink-0" />
    </div>
  );
}

// 줄마다 공고명 길이를 달리해 실제 목록처럼 보이게 한다
const TITLE_WIDTHS = ["w-3/5", "w-2/5", "w-1/2", "w-2/3"];

// 공고 목록: 구역 제목(강조선·이름·건수)과 줄 몇 개
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">공고를 불러오는 중</span>
      <div className="flex flex-col gap-3 pt-2 pb-3">
        <Skeleton className="h-0.75 w-7" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
      <div className="flex flex-col divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <NoticeRowSkeleton key={i} titleWidth={TITLE_WIDTHS[i % TITLE_WIDTHS.length]} />
        ))}
      </div>
    </div>
  );
}

// 처음 로딩, 결과 화면: 로고·검색창 줄, 조건 칩 줄, 목록
export function ResultsSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-1 flex-col gap-8 overflow-hidden pt-1">
      <span className="sr-only">불러오는 중</span>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-6">
          <Skeleton className="h-7 w-32 shrink-0" />
          <Skeleton className="h-11 flex-1 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      </div>
      <div className="min-w-0 xl:pr-114 2xl:pr-146">
        <ListSkeleton />
      </div>
    </div>
  );
}

// 상세 패널 머리말 자리 (기관·강조선)
export function PanelHeaderSkeleton() {
  return (
    <>
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-0.75 w-7" />
    </>
  );
}

// 상세 패널 본문 자리 (NoticePanel과 같은 순서: 공고명, D-day·남은 날 띠, 요약, 대상)
export function PanelBodySkeleton() {
  return (
    <div aria-busy="true" className="-mt-3 flex flex-col gap-6">
      <span className="sr-only">공고를 불러오는 중</span>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-2.5 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-col gap-4 bg-ground p-5">
        {["w-12", "w-16", "w-24"].map((width) => (
          <div key={width} className="flex gap-3">
            <Skeleton className="h-4 w-10 bg-line-strong/40" />
            <Skeleton className={`h-6 ${width} bg-surface`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 처음 로딩, 첫 화면: 큰 로고·소개·검색창 자리
export function StartSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col items-center pt-[22vh]">
      <span className="sr-only">불러오는 중</span>
      <div className="flex flex-col items-center gap-3 pb-10">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className="h-15 w-full max-w-2xl rounded-lg" />
    </div>
  );
}
