// 마지막 검색 조건을 브라우저에 저장해 다음 방문 때 첫 화면을 건너뛰고 보드를 연다 (기획서 F09)
// 입력 문장은 저장하지 않고 조건 값만 저장한다. 저장소가 막힌 환경(사생활 보호 모드 등)에서는 조용히 넘어간다
import { conditionsFromParams, conditionsToParams, hasConditions, type SearchConditions } from "@/domain/search/conditions";

const STORAGE_KEY = "dadali:conditions";

export function loadSavedConditions(): SearchConditions | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const conditions = conditionsFromParams(new URLSearchParams(saved));
    return hasConditions(conditions) ? conditions : null;
  } catch {
    return null;
  }
}

export function saveConditions(conditions: SearchConditions): void {
  try {
    if (hasConditions(conditions)) {
      window.localStorage.setItem(STORAGE_KEY, conditionsToParams(conditions).toString());
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // 저장하지 못해도 이번 방문의 검색에는 지장이 없다
  }
}
