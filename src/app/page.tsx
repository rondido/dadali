import NoticeDashboard from "@/components/home/NoticeDashboard";
import { SAMPLE_NOTICES } from "@/data/sampleNotices";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex items-baseline gap-3">
        <p className="text-4xl font-extrabold leading-none tracking-tight">다달이</p>
        <p className="text-ink-2">이번 달 정부지원, 한눈에</p>
      </header>

      {/* 수집 스크립트와 DB가 준비되기 전까지 샘플 공고로 보여준다 */}
      <p className="text-sm text-muted">샘플 데이터로 보여주는 화면입니다.</p>
      <NoticeDashboard notices={SAMPLE_NOTICES} />

      <footer className="text-sm text-muted">
        정확한 자격과 일정은 각 공식 사이트 공고를 따르며, 다달이는 정부 공식 서비스가 아닙니다.
      </footer>
    </main>
  );
}
