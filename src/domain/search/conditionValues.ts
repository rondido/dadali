// 해석 칩이 가질 수 있는 값 (기획서 7-1장). 칩·URL·데이터 필터가 모두 같은 값을 쓴다.

// 나이대 4개 그룹. 상한이 사업마다 달라 화면에는 숫자를 쓰지 않는다
// 아동·청소년(만 18세 이하)은 아이를 위한 혜택을 찾는 보호자도 쓴다
export const AGE_GROUPS = [
  { value: "child", label: "아동·청소년" },
  { value: "youth", label: "청년" },
  { value: "middle", label: "중장년" },
  { value: "senior", label: "어르신" },
] as const;

// 대상(가구 상황): 신청 자격이 특정 처지의 사람·가구로 정해진 혜택. "출산", "장애인"처럼 짧게 찾는 말이 여기에 걸린다
export const TARGETS = [
  { value: "parent", label: "임신·출산·육아" },
  { value: "disabled", label: "장애인" },
  { value: "lowincome", label: "저소득" },
  { value: "singleparent", label: "한부모" },
  { value: "multichild", label: "다자녀" },
  { value: "veteran", label: "보훈" },
  { value: "multicultural", label: "다문화" },
] as const;

// 업종 묶음 6개 (사업자일 때만)
export const INDUSTRIES = [
  { value: "mfg", label: "제조" },
  { value: "it", label: "IT·지식서비스" },
  { value: "retail", label: "도소매·음식" },
  { value: "agri", label: "농림어업" },
  { value: "culture", label: "문화·콘텐츠" },
  { value: "etc", label: "기타" },
] as const;

// 관심 주제
export const TOPICS = [
  { value: "facility", label: "시설·인테리어" },
  { value: "house", label: "주거" },
  { value: "fund", label: "자금·대출" },
  { value: "job", label: "일자리" },
  { value: "startup", label: "창업" },
  { value: "export", label: "수출" },
  { value: "edu", label: "교육" },
  { value: "market", label: "판로·마케팅" },
  { value: "digital", label: "디지털 전환" },
] as const;

// 시·도 17곳. 코드는 법정동코드 앞 2자리 (공공데이터와 같은 체계)
export const REGIONS = [
  { value: "11", label: "서울" },
  { value: "26", label: "부산" },
  { value: "27", label: "대구" },
  { value: "28", label: "인천" },
  { value: "29", label: "광주" },
  { value: "30", label: "대전" },
  { value: "31", label: "울산" },
  { value: "36", label: "세종" },
  { value: "41", label: "경기" },
  { value: "51", label: "강원" },
  { value: "43", label: "충북" },
  { value: "44", label: "충남" },
  { value: "52", label: "전북" },
  { value: "46", label: "전남" },
  { value: "47", label: "경북" },
  { value: "48", label: "경남" },
  { value: "50", label: "제주" },
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number]["value"];
export type Target = (typeof TARGETS)[number]["value"];
export type Industry = (typeof INDUSTRIES)[number]["value"];
export type Topic = (typeof TOPICS)[number]["value"];
export type RegionCode = (typeof REGIONS)[number]["value"];

interface Option<V extends string> {
  value: V;
  label: string;
}

function labelIn<V extends string>(options: readonly Option<V>[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function isIn<V extends string>(options: readonly Option<V>[], value: string | null): value is V {
  return options.some((o) => o.value === value);
}

export const regionLabel = (code: string) => labelIn(REGIONS, code);
export const ageLabel = (value: string) => labelIn(AGE_GROUPS, value);
export const targetLabel = (value: string) => labelIn(TARGETS, value);
export const industryLabel = (value: string) => labelIn(INDUSTRIES, value);
export const topicLabel = (value: string) => labelIn(TOPICS, value);

export const isRegionCode = (value: string | null): value is RegionCode => isIn(REGIONS, value);
export const isAgeGroup = (value: string | null): value is AgeGroup => isIn(AGE_GROUPS, value);
export const isTarget = (value: string | null): value is Target => isIn(TARGETS, value);
export const isIndustry = (value: string | null): value is Industry => isIn(INDUSTRIES, value);
export const isTopic = (value: string | null): value is Topic => isIn(TOPICS, value);
