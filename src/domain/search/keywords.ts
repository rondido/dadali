// 남은 단어: 문장에서 조건으로 바꾸지 못한 단어. 공고명·지원 내용 요약에서 찾아 결과를 좁힌다 (기획서 F07)
// 주소(kw)에 담아 서버에 보낸다. 상시 혜택은 일부만 받아 오므로, 서버가 전체에서 그 단어가 든 혜택을 찾아 보내야 한다
import { normalizeWords } from "./detailFilters";

const KEYWORD_PARAM = "kw";

export function keywordsFromParams(params: URLSearchParams): string[] {
  return normalizeWords((params.get(KEYWORD_PARAM) ?? "").split(","));
}

// 주소의 검색 부분에 남은 단어를 덧붙인다 (없으면 지운다)
export function writeKeywords(params: URLSearchParams, keywords: string[]): URLSearchParams {
  const next = new URLSearchParams(params);
  const words = normalizeWords(keywords);
  if (words.length > 0) next.set(KEYWORD_PARAM, words.join(","));
  else next.delete(KEYWORD_PARAM);
  return next;
}
