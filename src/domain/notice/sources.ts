// 공고 출처별 표시 이름과 사이트 메인 주소 (원문 주소가 없거나 공식 도메인이 아닐 때 대신 보낼 곳)
export const SOURCE_INFO: Record<string, { name: string; url: string }> = {
  kstartup: { name: "K-Startup", url: "https://www.k-startup.go.kr" },
  gov24: { name: "정부24", url: "https://www.gov.kr" },
  manual: { name: "혜택톡톡", url: "https://www.gov.kr" },
};

export function sourceInfoOf(source: string): { name: string; url: string } {
  return SOURCE_INFO[source] ?? SOURCE_INFO.manual;
}
