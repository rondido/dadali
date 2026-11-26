// 메인 화면 틀: 검색·보드(SearchHome)와 하단 고지. 공고는 서버(app/page.tsx)가 읽어 넘겨준다
import { Suspense } from "react";
import SearchHome from "@/components/search/SearchHome";
import { ToastProvider } from "@/components/ui/Toast";
import type { PopularNotice } from "@/db/homeData";
import type { Notice } from "@/domain/notice/notice";
import type { DictionaryEntry } from "@/domain/search/interpretQuery";

interface HomeViewProps {
  notices: Notice[];
  dictionary: DictionaryEntry[];
  syncedAt: string | null;
  alwaysNote: string | null;
  isSample: boolean;
  popular: PopularNotice[];
}

export default function HomeView({ notices, dictionary, syncedAt, alwaysNote, isSample, popular }: HomeViewProps) {
  return (
    // 화면 전체 높이(100vh)에 맞추고 페이지 자체는 스크롤하지 않는다 (목록과 상세만 각자 스크롤). 모바일 주소창 높이 변화까지 따라가도록 지원하는 브라우저에서는 100dvh를 쓴다
    <main className="relative mx-auto flex h-screen max-w-[90rem] md:px-10 flex-col gap-4 overflow-hidden px-5 pt-6 pb-4 supports-[height:100dvh]:h-dvh">
      {/* 검색 조건을 URL(useSearchParams)에서 읽으므로 Suspense로 감싼다 */}
      <ToastProvider>
        <Suspense fallback={<div className="min-h-0 flex-1" aria-busy="true" />}>
          <SearchHome
            notices={notices}
            dictionary={dictionary}
            syncedAt={syncedAt}
            alwaysNote={alwaysNote}
            isSample={isSample}
            popular={popular}
          />
        </Suspense>
      </ToastProvider>
      {/* 고지(공식 서비스 아님·저장 안내)는 화면 아래에 늘 붙여 두지 않고 첫 화면 맨 아래에만 둔다 (SearchHome) */}
    </main>
  );
}
