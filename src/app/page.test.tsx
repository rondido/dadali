import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HomeView from "@/components/home/HomeView";
import { DICTIONARY } from "@/data/dictionary";
import { SAMPLE_NOTICES, SAMPLE_SYNCED_AT } from "@/data/sampleNotices";

// Next.js 라우터를 모킹합니다: jsdom에는 App Router가 없어 useRouter·useSearchParams를 그대로 쓸 수 없기 때문
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// page.tsx는 DB를 읽는 서버 컴포넌트라 jsdom에서 그릴 수 없어, 같은 화면 틀(HomeView)에 샘플 공고를 넣어 확인합니다
function renderHome(isSample = false, popular: { id: string; title: string }[] = []) {
  render(
    <HomeView
      notices={SAMPLE_NOTICES}
      dictionary={DICTIONARY}
      syncedAt={SAMPLE_SYNCED_AT}
      alwaysNote={null}
      isSample={isSample}
      popular={popular}
    />,
  );
}

const POPULAR = [
  { id: "p1", title: "국민내일배움카드" },
  { id: "p2", title: "근로·자녀장려금" },
  { id: "p3", title: "국민취업지원제도" },
  { id: "p4", title: "내집마련 디딤돌 대출" },
];

describe("HomeView", () => {
  it("첫 화면에는 서비스명과 검색창, 예시 검색어만 보여줍니다", () => {
    renderHome();

    expect(screen.getByRole("heading", { level: 1, name: "혜택톡톡" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "내 상황" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "예시 검색어" })).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("많이 찾는 혜택이 있으면 예시 검색어 대신 그 4건을 보여줍니다", () => {
    renderHome(false, POPULAR);

    const list = screen.getByRole("list", { name: "많이 찾는 혜택" });
    expect(list).toHaveTextContent("국민내일배움카드");
    expect(screen.getAllByRole("button", { name: /국민|근로|내집/ })).toHaveLength(4);
    expect(screen.queryByRole("list", { name: "예시 검색어" })).not.toBeInTheDocument();
  });

  it("많이 찾는 혜택을 누르면 검색 결과를 열고 그 공고의 상세를 엽니다", async () => {
    push.mockClear();
    renderHome(false, POPULAR);

    await userEvent.click(screen.getByRole("button", { name: "국민취업지원제도" }));

    expect(push).toHaveBeenCalledWith(expect.stringContaining("notice=p3"), expect.anything());
  });

  it("정부 공식 서비스가 아니라는 고지를 보여줍니다", () => {
    renderHome();

    expect(screen.getByText(/정부 공식 서비스가 아니에요/)).toBeInTheDocument();
  });

  it("샘플 데이터일 때만 샘플이라고 알립니다", () => {
    renderHome(true);
    expect(screen.getByText(/샘플 데이터/)).toBeInTheDocument();
  });

  it("실제 데이터일 때는 샘플 안내를 보여주지 않습니다", () => {
    renderHome(false);
    expect(screen.queryByText(/샘플 데이터/)).not.toBeInTheDocument();
  });
});
