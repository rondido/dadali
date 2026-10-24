// 화면 개발용 샘플 공고. 실제 공고가 아니며, 수집 스크립트와 DB가 준비되면 DB 조회로 바꾼다.
// e2e 테스트(e2e/calendar.spec.ts)가 이 데이터를 기준으로 검증하므로 바꿀 때 함께 고친다.
import type { NoticeSchedule } from "@/domain/notice/noticeMarkers";

export const SAMPLE_NOTICES: NoticeSchedule[] = [
  // 11월 20일: 마감 4건 + 시작 1건 → 3건만 보이고 "+2건"
  { id: "s01", title: "샘플 창업 사업화 지원 모집", categoryId: "C02", applyStart: "2026-11-02", applyEnd: "2026-11-20", isAlways: false },
  { id: "s02", title: "샘플 소상공인 경영 바우처", categoryId: "C03", applyStart: "2026-11-03", applyEnd: "2026-11-20", isAlways: false },
  { id: "s03", title: "샘플 청년 주거 지원", categoryId: "C01", applyStart: "2026-10-26", applyEnd: "2026-11-20", isAlways: false },
  { id: "s04", title: "샘플 중소기업 수출 지원", categoryId: "C03", applyStart: "2026-11-04", applyEnd: "2026-11-20", isAlways: false },
  { id: "s05", title: "샘플 공공 용역 입찰", categoryId: "C04", applyStart: "2026-11-20", applyEnd: "2026-12-04", isAlways: false },

  // 이미 마감된 공고 (11월 10일 기준) → 흐리게
  { id: "s06", title: "샘플 지난 창업 교육", categoryId: "C02", applyStart: "2026-10-19", applyEnd: "2026-11-05", isAlways: false },

  // 시작일과 마감일이 같은 날 → 마감 칩 하나
  { id: "s07", title: "샘플 하루 접수 사업", categoryId: "C01", applyStart: "2026-11-13", applyEnd: "2026-11-13", isAlways: false },

  // 10월 공고
  { id: "s09", title: "샘플 어르신 돌봄 지원", categoryId: "C01", applyStart: "2026-10-21", applyEnd: "2026-11-27", isAlways: false },

  // 10월 30일: 공고가 몰린 날. 마감 9건 + 시작 3건 → 3건만 보이고 "+9건"
  { id: "s08", title: "샘플 스마트공장 지원", categoryId: "C03", applyStart: "2026-10-12", applyEnd: "2026-10-30", isAlways: false },
  { id: "s11", title: "샘플 관광 벤처 공모", categoryId: "C03", applyStart: "2026-10-05", applyEnd: "2026-10-30", isAlways: false },
  { id: "s12", title: "샘플 농식품 창업 지원", categoryId: "C02", applyStart: "2026-10-06", applyEnd: "2026-10-30", isAlways: false },
  { id: "s13", title: "샘플 디자인 바우처", categoryId: "C03", applyStart: "2026-10-07", applyEnd: "2026-10-30", isAlways: false },
  { id: "s14", title: "샘플 문화 콘텐츠 제작 지원", categoryId: "C03", applyStart: "2026-10-08", applyEnd: "2026-10-30", isAlways: false },
  { id: "s15", title: "샘플 신혼부부 전세 지원", categoryId: "C01", applyStart: "2026-10-13", applyEnd: "2026-10-30", isAlways: false },
  { id: "s16", title: "샘플 연구개발 과제 공모", categoryId: "C03", applyStart: "2026-10-14", applyEnd: "2026-10-30", isAlways: false },
  { id: "s17", title: "샘플 청년 창업 사관학교", categoryId: "C02", applyStart: "2026-10-15", applyEnd: "2026-10-30", isAlways: false },
  { id: "s18", title: "샘플 학교 급식 납품 입찰", categoryId: "C04", applyStart: "2026-10-16", applyEnd: "2026-10-30", isAlways: false },
  { id: "s19", title: "샘플 경력단절 재취업 지원", categoryId: "C01", applyStart: "2026-10-30", applyEnd: "2026-11-24", isAlways: false },
  { id: "s20", title: "샘플 물품 구매 입찰", categoryId: "C04", applyStart: "2026-10-30", applyEnd: "2026-11-25", isAlways: false },
  { id: "s21", title: "샘플 재창업 패키지", categoryId: "C02", applyStart: "2026-10-30", applyEnd: "2026-11-26", isAlways: false },

  // 마감 임박 (11월 10일 기준 D-4)
  { id: "s22", title: "샘플 수출 바우처 추가 모집", categoryId: "C03", applyStart: "2026-11-01", applyEnd: "2026-11-14", isAlways: false },

  // 상시 모집 → 달력에는 나오지 않고 칸반 "상시 모집" 열에 나옴
  { id: "s10", title: "샘플 상시 정책자금", categoryId: "C03", applyStart: null, applyEnd: null, isAlways: true },
  { id: "s23", title: "샘플 청년 마음건강 바우처", categoryId: "C01", applyStart: null, applyEnd: null, isAlways: true },
  { id: "s24", title: "샘플 창업 멘토링 상담", categoryId: "C02", applyStart: null, applyEnd: null, isAlways: true },
];
