import { Suspense } from "react";
import SearchHome from "@/components/search/SearchHome";
import { SAMPLE_DICTIONARY } from "@/data/sampleDictionary";
import { SAMPLE_NOTICES, SAMPLE_SYNCED_AT } from "@/data/sampleNotices";

export default function Home() {
  return (
    // 화면 전체 높이(100vh)에 맞춘다. 모바일 주소창 높이 변화까지 따라가도록 지원하는 브라우저에서는 100dvh를 쓴다
    <main className="mx-auto flex h-screen max-w-7xl flex-col gap-3 overflow-hidden px-4 py-3 supports-[height:100dvh]:h-dvh">
      {/* 검색 조건을 URL(useSearchParams)에서 읽으므로 Suspense로 감싼다 */}
      <Suspense fallback={<div className="min-h-0 flex-1 rounded-lg bg-surface" aria-busy="true" />}>
        <SearchHome notices={SAMPLE_NOTICES} dictionary={SAMPLE_DICTIONARY} syncedAt={SAMPLE_SYNCED_AT} />
      </Suspense>

      <footer className="shrink-0 text-xs text-muted">
        정확한 자격과 일정은 각 공식 사이트 공고를 따르며, 혜택톡톡은 정부 공식 서비스가 아닙니다.
        {/* 수집 스크립트와 DB가 준비되기 전까지 샘플 공고와 샘플 사전으로 보여준다 */}
        <span className="ml-1">샘플 데이터로 보여주는 화면입니다.</span>
      </footer>
    </main>
  );
}
