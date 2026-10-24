import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("서비스명과 슬로건을 보여줍니다", () => {
    render(<Home />);

    expect(screen.getByText("다달이")).toBeInTheDocument();
    expect(screen.getByText("이번 달 정부지원, 한눈에")).toBeInTheDocument();
  });

  it("정부 공식 서비스가 아니라는 고지를 보여줍니다", () => {
    render(<Home />);

    expect(screen.getByText(/정부 공식 서비스가\s*아닙니다/)).toBeInTheDocument();
  });
});
