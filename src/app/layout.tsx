import type { Metadata } from "next";
// Pretendard 가변 폰트. 글자 범위별로 나뉜 파일 중 화면에 쓰인 글자의 파일만 내려받는다
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "다달이 - 정부지원 달력",
  description: "이번 달 정부지원, 한눈에. 정부·공공 지원사업 공고를 마감일 달력으로 모아 보고 공식 사이트로 바로 이동하세요.",
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
