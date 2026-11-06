// 공식 사이트 이동 규칙 (기획서 7장 이동 규칙, 8장 검증 규칙)
// go.kr · or.kr · 지정 예외 도메인만 공식 주소로 본다. 공고 주소가 없거나 공식이 아니면 출처 사이트 메인으로 보낸다
import type { Notice } from "./notice";

// .go.kr · .or.kr이 아니지만 공공기관이 운영하는 도메인 (소상공인24: 소상공인시장진흥공단)
const OFFICIAL_EXCEPTIONS = ["sbiz24.kr"];

function hostOf(url: string): string | null {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? hostname : null;
  } catch {
    return null;
  }
}

const matchesDomain = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

export function isOfficialUrl(url: string): boolean {
  const host = hostOf(url);
  if (!host) return false;
  return host.endsWith(".go.kr") || host.endsWith(".or.kr") || OFFICIAL_EXCEPTIONS.some((d) => matchesDomain(host, d));
}

export interface OfficialLink {
  url: string;
  host: string; // 버튼 아래에 보여줄 도메인 (www. 제외)
  isFallback: boolean; // 원문 공고 대신 출처 사이트 메인으로 보내는지
}

export function officialLinkOf(notice: Pick<Notice, "detailUrl" | "sourceUrl">): OfficialLink {
  const useDetail = notice.detailUrl !== null && isOfficialUrl(notice.detailUrl);
  const url = useDetail ? notice.detailUrl! : notice.sourceUrl;
  return { url, host: (hostOf(url) ?? "").replace(/^www\./, ""), isFallback: !useDetail };
}
