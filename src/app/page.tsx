// 임시 첫 화면. 메인 달력은 개발 순서 4단계에서 이 자리에 들어옵니다.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6">
      <p className="font-logo text-5xl leading-none">다달이</p>
      <p className="text-lg text-ink-2">이번 달 정부지원, 한눈에</p>
      <p className="text-sm text-muted">
        개발 준비 중입니다. 정확한 자격과 일정은 각 공식 사이트 공고를 따르며, 다달이는 정부 공식 서비스가
        아닙니다.
      </p>
    </main>
  );
}
