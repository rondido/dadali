import { render, screen } from "@testing-library/react";
import { describe, expect, it, test } from "vitest";
import CalendarLegend from "./CalendarLegend";

describe("CalendarLegend", () => {
  test.each(["개인 혜택", "창업", "기업·소상공인", "공공사업"])("분야 '%s'의 색 안내를 보여줍니다", (name) => {
    render(<CalendarLegend />);

    expect(screen.getByText(name)).toBeInTheDocument();
  });

  it("진한 색은 마감일, 연한 색은 시작일이라는 안내를 보여줍니다", () => {
    render(<CalendarLegend />);

    expect(screen.getByText("진한 색 마감일")).toBeInTheDocument();
    expect(screen.getByText("연한 색 시작일")).toBeInTheDocument();
  });
});
