import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomeView from "@/components/home/HomeView";
import { SAMPLE_DICTIONARY } from "@/data/sampleDictionary";
import { SAMPLE_NOTICES, SAMPLE_SYNCED_AT } from "@/data/sampleNotices";

// Next.js 라우터를 모킹합니다: jsdom에는 App Router가 없어 useRouter·useSearchParams를 그대로 쓸 수 없기 때문
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// page.tsx는 DB를 읽는 서버 컴포넌트라 jsdom에서 그릴 수 없어, 같은 화면 틀(HomeView)에 샘플 공고를 넣어 확인합니다
function renderHome(isSample = false) {
  render(
    <HomeView
      notices={SAMPLE_NOTICES}
      dictionary={SAMPLE_DICTIONARY}
      syncedAt={SAMPLE_SYNCED_AT}
      alwaysNote={null}
      isSample={isSample}
    />,
  );
}

describe("HomeView", () => {
  it("서비스명과 슬로건을 보여줍니다", () => {
    renderHome();

    expect(screen.getByText("혜택톡톡")).toBeInTheDocument();
    expect(screen.getByText("이번 달 정부지원, 한눈에")).toBeInTheDocument();
  });

  it("정부 공식 서비스가 아니라는 고지를 보여줍니다", () => {
    renderHome();

    expect(screen.getByText(/정부 공식 서비스가\s*아니에요/)).toBeInTheDocument();
  });

  it("샘플 데이터일 때만 샘플이라고 알립니다", () => {
    renderHome(true);
    expect(screen.getByText("샘플 데이터예요.")).toBeInTheDocument();
  });

  it("실제 데이터일 때는 샘플 안내를 보여주지 않습니다", () => {
    renderHome(false);
    expect(screen.queryByText("샘플 데이터예요.")).not.toBeInTheDocument();
  });
});
