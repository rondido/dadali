import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, Jua } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans_KR({
  variable: "--font-plex",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

// 로고(다달이) 전용
const jua = Jua({
  variable: "--font-jua",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

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
      <body className={`${plex.variable} ${jua.variable} antialiased`}>{children}</body>
    </html>
  );
}
