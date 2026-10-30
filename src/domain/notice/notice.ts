// 공고 데이터 모양과 공통 규칙 (기획서 8장 Notice). 보드·상세 등 어떤 뷰에서도 같은 타입을 쓴다.
import type { AgeGroup, Industry, Topic } from "@/domain/search/conditionValues";

// 날짜는 "YYYY-MM-DD" 문자열 (DB date 컬럼 값 그대로, 시간대 변환 없음)
export type IsoDate = string;

// 접수 상태 판단에 필요한 공고 정보만 담는다
export interface NoticeSchedule {
  id: string;
  title: string;
  categoryId: string;
  applyStart: IsoDate | null;
  applyEnd: IsoDate | null;
  isAlways: boolean;
}

// 보드·검색에 쓰는 공고. 맞춤 필터 필드가 비어 있으면 전체 대상이다
export interface Notice extends NoticeSchedule {
  org: string; // 주관기관
  summary: string; // 지원 내용 요약 (summary_text)
  ageGroups: AgeGroup[];
  regionCodes: string[]; // 시·도 코드, 비면 전국
  industries: Industry[];
  topics: Topic[];
}

// 마감일이 오늘보다 앞이면 마감된 공고 (보드에서 빼고 "진행 중" 수에서도 뺀다)
// "YYYY-MM-DD"는 문자열 비교가 날짜 비교와 같다
export function isNoticeClosed(notice: Pick<NoticeSchedule, "applyEnd">, today: IsoDate): boolean {
  return notice.applyEnd !== null && notice.applyEnd < today;
}
