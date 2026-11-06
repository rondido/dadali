// 화면 개발용 샘플 공고. 실제 공고가 아니며, 수집 스크립트와 DB가 준비되면 DB 조회로 바꾼다.
// e2e 테스트(e2e/search.spec.ts, e2e/board.spec.ts)가 이 데이터를 기준으로 검증하므로 바꿀 때 함께 고친다.
// 상태는 2026년 11월 10일 기준으로 고르게 나뉘도록 잡았다.
import type { Notice } from "@/domain/notice/notice";

// 출처 사이트 (기획서 4장 수록 사이트). 샘플 공고는 실제 공고가 아니므로 원문 주소는 공고 목록 페이지 또는 없음(메인으로 이동)
const SOURCES = {
  kstartup: {
    sourceName: "K-Startup",
    sourceUrl: "https://www.k-startup.go.kr",
    detailUrl: "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do",
  },
  gov24: { sourceName: "정부24", sourceUrl: "https://www.gov.kr", detailUrl: null },
  bizinfo: { sourceName: "기업마당", sourceUrl: "https://www.bizinfo.go.kr", detailUrl: null },
  sbiz24: { sourceName: "소상공인24", sourceUrl: "https://www.sbiz24.kr", detailUrl: null },
  g2b: { sourceName: "나라장터", sourceUrl: "https://www.g2b.go.kr", detailUrl: null },
} as const;

type SampleInput = Pick<Notice, "id" | "title" | "categoryId" | "applyStart" | "applyEnd" | "org"> &
  Partial<Pick<Notice, "isAlways" | "summary" | "ageGroups" | "regionCodes" | "industries" | "topics">> & {
    source: keyof typeof SOURCES;
  };

// 맞춤 필터 필드는 비워 두면 전체 대상
function sample({ source, ...input }: SampleInput): Notice {
  return {
    ...SOURCES[source],
    isAlways: false,
    summary: "",
    ageGroups: [],
    regionCodes: [],
    industries: [],
    topics: [],
    ...input,
  };
}

// 샘플 데이터의 "최종 갱신" 시각 (매일 새벽 5시 수집을 흉내 낸다. 실제로는 SyncLog에서 읽는다)
export const SAMPLE_SYNCED_AT = "2026-11-10T05:00:00+09:00";

export const SAMPLE_NOTICES: Notice[] = [
  // 진행 중 (마감 7일 안: 빨간 D-day)
  sample({
    id: "s25", title: "샘플 서울 소상공인 점포 환경개선 지원", categoryId: "C03", org: "서울신용보증재단", source: "sbiz24",
    applyStart: "2026-10-28", applyEnd: "2026-11-11",
    summary: "점포 인테리어·간판 교체 비용 일부 지원", regionCodes: ["11"], industries: ["retail"], topics: ["facility"],
  }),
  sample({
    id: "s22", title: "샘플 수출 바우처 추가 모집", categoryId: "C03", org: "중소벤처기업진흥공단", source: "bizinfo",
    applyStart: "2026-11-01", applyEnd: "2026-11-14",
    summary: "해외 마케팅·통번역 비용을 바우처로 지원", topics: ["export", "market"],
  }),
  sample({
    id: "s07", title: "샘플 하루 접수 사업", categoryId: "C01", org: "행정안전부", source: "gov24",
    applyStart: "2026-11-13", applyEnd: "2026-11-13",
  }),
  sample({
    id: "s01", title: "샘플 창업 사업화 지원 모집", categoryId: "C02", org: "창업진흥원", source: "kstartup",
    applyStart: "2026-11-02", applyEnd: "2026-11-20",
    summary: "예비·초기 창업자 사업화 자금 최대 1억 원", ageGroups: ["youth", "middle"], topics: ["startup", "fund"],
  }),
  sample({
    id: "s02", title: "샘플 소상공인 경영 바우처", categoryId: "C03", org: "소상공인시장진흥공단", source: "sbiz24",
    applyStart: "2026-11-03", applyEnd: "2026-11-20",
    summary: "공과금·보험료 등 경영비 바우처 지원", industries: ["retail", "etc"], topics: ["fund"],
  }),
  sample({
    id: "s03", title: "샘플 청년 주거 지원", categoryId: "C01", org: "국토교통부", source: "gov24",
    applyStart: "2026-10-26", applyEnd: "2026-11-20",
    summary: "무주택 청년 월세 월 최대 20만 원 지원", ageGroups: ["youth"], topics: ["house"],
  }),
  sample({
    id: "s04", title: "샘플 중소기업 수출 지원", categoryId: "C03", org: "KOTRA", source: "bizinfo",
    applyStart: "2026-11-04", applyEnd: "2026-11-20",
    summary: "해외 전시회 참가비와 바이어 발굴 지원", industries: ["mfg", "it"], topics: ["export"],
  }),
  sample({
    id: "s19", title: "샘플 경력단절 재취업 지원", categoryId: "C01", org: "고용노동부", source: "gov24",
    applyStart: "2026-10-30", applyEnd: "2026-11-24",
    summary: "복직 준비 직업훈련과 취업 상담", ageGroups: ["middle"], topics: ["job", "edu"],
  }),
  sample({
    id: "s20", title: "샘플 물품 구매 입찰", categoryId: "C04", org: "조달청", source: "g2b",
    applyStart: "2026-10-30", applyEnd: "2026-11-25",
  }),
  sample({
    id: "s21", title: "샘플 재창업 패키지", categoryId: "C02", org: "창업진흥원", source: "kstartup",
    applyStart: "2026-10-30", applyEnd: "2026-11-26",
    summary: "재도전 기업인 사업화 자금과 멘토링", ageGroups: ["middle"], topics: ["startup", "fund"],
  }),
  sample({
    id: "s09", title: "샘플 어르신 돌봄 지원", categoryId: "C01", org: "보건복지부", source: "gov24",
    applyStart: "2026-10-21", applyEnd: "2026-11-27",
    summary: "혼자 사는 어르신 방문 돌봄 서비스", ageGroups: ["senior"],
  }),
  sample({
    id: "s26", title: "샘플 부산 청년 창업 공간 입주", categoryId: "C02", org: "부산경제진흥원", source: "kstartup",
    applyStart: "2026-11-02", applyEnd: "2026-12-04",
    summary: "청년 창업자 사무 공간과 장비 무상 제공", ageGroups: ["youth"], regionCodes: ["26"], topics: ["startup", "facility"],
  }),

  // 진행 예정
  sample({
    id: "s05", title: "샘플 공공 용역 입찰", categoryId: "C04", org: "조달청", source: "g2b",
    applyStart: "2026-11-20", applyEnd: "2026-12-04",
  }),
  sample({
    id: "s27", title: "샘플 스마트상점 기술 보급", categoryId: "C03", org: "소상공인시장진흥공단", source: "sbiz24",
    applyStart: "2026-11-12", applyEnd: "2026-12-12",
    summary: "키오스크·서빙로봇 등 스마트 기술 도입비 지원", industries: ["retail"], topics: ["digital", "facility"],
  }),

  // 이미 마감 (보드에 나오지 않음)
  sample({
    id: "s06", title: "샘플 지난 창업 교육", categoryId: "C02", org: "창업진흥원", source: "kstartup",
    applyStart: "2026-10-19", applyEnd: "2026-11-05", topics: ["startup", "edu"],
  }),
  sample({
    id: "s08", title: "샘플 스마트공장 지원", categoryId: "C03", org: "중소벤처기업부", source: "bizinfo",
    applyStart: "2026-10-12", applyEnd: "2026-10-30", industries: ["mfg"], topics: ["digital"],
  }),

  // 상시 모집
  sample({
    id: "s10", title: "샘플 상시 정책자금", categoryId: "C03", org: "소상공인시장진흥공단", source: "sbiz24",
    applyStart: null, applyEnd: null, isAlways: true,
    summary: "소상공인 운영자금 저금리 융자", topics: ["fund"],
  }),
  sample({
    id: "s23", title: "샘플 청년 마음건강 바우처", categoryId: "C01", org: "보건복지부", source: "gov24",
    applyStart: null, applyEnd: null, isAlways: true,
    summary: "청년 심리 상담 바우처", ageGroups: ["youth"],
  }),
  sample({
    id: "s24", title: "샘플 창업 멘토링 상담", categoryId: "C02", org: "창업진흥원", source: "kstartup",
    applyStart: null, applyEnd: null, isAlways: true,
    summary: "창업 전문가 1:1 멘토링", topics: ["startup", "edu"],
  }),
];
