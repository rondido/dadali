// 메인 화면 틀: 검색·보드(SearchHome)와 하단 고지. 공고는 서버(app/page.tsx)가 읽어 넘겨준다
import { Suspense } from "react";
import SearchHome from "@/components/search/SearchHome";
import type { Notice } from "@/domain/notice/notice";
import type { DictionaryEntry } from "@/domain/search/interpretQuery";

interface HomeViewProps {
  notices: Notice[];
  dictionary: DictionaryEntry[];
  syncedAt: string | null;
  alwaysNote: string | null;
  isSample: boolean;
}

export default function HomeView({ notices, dictionary, syncedAt, alwaysNote, isSample }: HomeViewProps) {
  return (
    // 화면 전체 높이(100vh)에 맞춘다. 모바일 주소창 높이 변화까지 따라가도록 지원하는 브라우저에서는 100dvh를 쓴다
    <main className="mx-auto flex h-screen max-w-7xl flex-col gap-3 overflow-hidden px-4 py-3 supports-[height:100dvh]:h-dvh">
      {/* 검색 조건을 URL(useSearchParams)에서 읽으므로 Suspense로 감싼다 */}
      <Suspense fallback={<div className="min-h-0 flex-1 rounded-lg bg-surface" aria-busy="true" />}>
        <SearchHome notices={notices} dictionary={dictionary} syncedAt={syncedAt} alwaysNote={alwaysNote} />
      </Suspense>

      <footer className="shrink-0 text-xs text-muted">
        혜택톡톡은 정부 공식 서비스가 아니에요. 자격과 일정은 각 공식 사이트 기준이에요.
        {isSample && <span className="ml-1">샘플 데이터예요.</span>}
      </footer>
    </main>
  );
}
