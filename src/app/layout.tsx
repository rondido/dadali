import type { Metadata } from "next";
// Pretendard 가변 폰트. 글자 범위별로 나뉜 파일 중 화면에 쓰인 글자의 파일만 내려받는다
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "다달이 - 내게 맞는 정부지원사업",
  description:
    "이번 달 정부지원, 한눈에. 내 상황을 적으면 조건에 맞을 수 있는 정부·공공 지원사업을 진행 예정·진행 중·상시로 나눠 보여드려요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
