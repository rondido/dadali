// 검색 문장 해석 사전 (기획서 5-1장). 지명은 시·도와 전국 시·군·구, 나머지는 자주 쓰는 말과 비슷한 말을 묶는다
// 단어가 사전 단어로 시작하면 그 뜻으로 본다 ("카페하는" → 카페). 그래서 흔한 낱말의 앞부분이 되는 짧은 말은 넣지 않는다
// e2e 테스트(e2e/search.spec.ts)가 이 사전을 기준으로 검증하므로 바꿀 때 함께 고친다.
import type { DictionaryEntry } from "@/domain/search/interpretQuery";
import { REGIONS, type AgeGroup, type Industry, type RegionCode, type Target, type Topic } from "@/domain/search/conditionValues";
import { DISTRICTS } from "@/domain/search/districts";

const region = (term: string, value: string, ambiguousWith?: string[]): DictionaryEntry => ({
  term,
  kind: "region",
  value,
  ambiguousWith,
});
// 동네 이름·별칭: 시·도와 시·군·구를 함께 정한다
const place = (term: string, value: RegionCode, district: string): DictionaryEntry => ({
  term,
  kind: "region",
  value,
  district,
});

// "시·군·구"를 뗀 짧은 이름이 흔한 낱말과 같은 곳. 짧은 이름으로는 지역으로 보지 않는다
// (예: "고양이 카페"의 고양, "이천만원"의 이천, "고령자"의 고령, "연수 프로그램"의 연수)
const COMMON_WORDS = new Set([
  "고양", "화성", "양주", "여주", "진주", "구리", "동해", "이천", "수영", "사상", "기장", "연수", "강화", "남동",
  "달성", "수성", "유성", "광산", "동작", "음성", "보은", "공주", "예산", "부여", "장수", "완주", "영광", "강진",
  "진도", "신안", "경주", "상주", "영양", "고령", "양산", "함양", "거창", "남해",
]);

// 시·군·구 이름 ("마포구", 짧게 "마포"). 같은 이름이 여러 시·도에 있으면(중구, 강서구, 고성군 등)
// 시·도 순서(REGIONS)상 앞 시·도로 찾고 나머지를 후보로 띄운다. 후보 어디서든 시·군·구 이름은 같다
function districtEntries(): DictionaryEntry[] {
  const byTerm = new Map<string, { district: string; codes: RegionCode[] }>();
  const add = (term: string, district: string, code: RegionCode) => {
    const found = byTerm.get(term);
    if (!found) byTerm.set(term, { district, codes: [code] });
    else if (found.district === district && !found.codes.includes(code)) found.codes.push(code);
  };

  for (const { value: code, label } of REGIONS) {
    for (const district of DISTRICTS[code]) {
      if (district === "광주시") continue; // 경기 광주시: "광주" 항목이 후보로 띄운다
      add(district, district, code);
      const short = district.slice(0, -1);
      const isRegionLabel = REGIONS.some((r) => r.label === short) || short === label;
      if (short.length >= 2 && !COMMON_WORDS.has(short) && !isRegionLabel) add(short, district, code);
    }
  }

  return [...byTerm].map(([term, { district, codes: [value, ...rest] }]) => ({
    term,
    kind: "region",
    value,
    district,
    ...(rest.length > 0 ? { ambiguousWith: rest } : {}),
  }));
}
const words = <V extends string>(kind: DictionaryEntry["kind"], value: V, terms: string[]): DictionaryEntry[] =>
  terms.map((term) => ({ term, kind, value }));
const age = (value: AgeGroup, terms: string[]) => words("age", value, terms);
const target = (value: Target, terms: string[]) => words("target", value, terms);
const industry = (value: Industry, terms: string[]) => words("industry", value, terms);
const topic = (value: Topic, terms: string[]) => words("topic", value, terms);

export const DICTIONARY: DictionaryEntry[] = [
  // 시·도 이름 ("서울특별시", "경기도"처럼 뒤가 붙어도 앞부분으로 찾는다)
  ...REGIONS.filter((r) => r.label !== "광주").map((r) => region(r.label, r.value)),
  region("광주", "29", ["41"]), // 광주광역시 / 경기 광주시
  region("광주광역시", "29"),
  region("충청북도", "43"),
  region("충청남도", "44"),
  region("전라북도", "52"),
  region("전라남도", "46"),
  region("경상북도", "47"),
  region("경상남도", "48"),
  // 시·군·구 (중구·강서구처럼 여러 곳에 있는 이름은 후보를 띄운다)
  ...districtEntries(),
  // 동네 이름과 별칭
  place("망원동", "11", "마포구"),
  place("홍대", "11", "마포구"),
  place("신촌", "11", "서대문구"),
  place("잠실", "11", "송파구"),
  place("여의도", "11", "영등포구"),
  place("판교", "41", "성남시"),
  place("분당", "41", "성남시"),
  place("일산", "41", "고양시"),
  place("동탄", "41", "화성시"),
  place("광교", "41", "수원시"),

  // "아이"는 "아이디어", "아이템"의 앞부분이라 넣지 않는다. "학생"은 대학생일 수도 있어 넣지 않는다
  ...age("child", [
    "아동", "청소년", "어린이", "영유아", "유아", "자녀", "초등", "중학생", "고등학생", "고교생", "미성년",
  ]),
  ...age("youth", ["청년", "대학생", "대학원생", "취준생", "취업준비생", "사회초년생", "젊은"]),
  ...age("middle", ["중장년", "신중년", "중년", "장년"]),
  ...age("senior", ["어르신", "노인", "시니어", "고령", "노년", "경로"]),

  // 대상(가구 상황). "출"·"장"처럼 짧은 말은 다른 낱말의 앞부분이 되어 넣지 않는다
  ...target("parent", ["임신", "임산부", "출산", "출생", "산모", "산후", "난임", "신생아", "육아", "양육", "보육", "아이돌봄"]),
  ...target("disabled", ["장애인", "장애", "발달장애", "휠체어"]),
  ...target("lowincome", ["저소득", "기초생활", "기초수급", "수급자", "차상위", "생계", "의료급여", "취약계층", "긴급복지"]),
  ...target("singleparent", ["한부모", "미혼모", "미혼부", "조손"]),
  ...target("multichild", ["다자녀", "셋째", "다둥이"]),
  ...target("veteran", ["보훈", "국가유공자", "유공자", "참전", "제대군인"]),
  ...target("multicultural", ["다문화", "결혼이민", "이주민", "외국인"]),

  ...industry("retail", [
    "카페", "커피", "식당", "음식점", "요식", "외식", "치킨", "분식", "빵집", "베이커리", "제과", "술집", "주점",
    "호프", "편의점", "마트", "슈퍼", "쇼핑몰", "온라인몰", "스마트스토어", "도매", "소매", "꽃집", "정육점", "반찬",
  ]),
  ...industry("mfg", ["공장", "제조", "생산", "부품", "금형", "뿌리기업"]),
  ...industry("it", ["앱", "어플", "소프트웨어", "개발", "it", "ai", "인공지능", "플랫폼", "데이터", "클라우드", "웹사이트"]),
  ...industry("agri", [
    "귀농", "귀촌", "귀어", "농사", "농업", "농가", "농장", "농민", "축산", "어업", "어민", "수산", "양식장", "임업",
  ]),
  ...industry("culture", [
    "유튜브", "콘텐츠", "디자인", "웹툰", "영상", "공연", "출판", "음악", "게임", "방송", "크리에이터", "예술", "미술",
  ]),
  ...industry("etc", ["미용실", "미용", "네일", "세탁소", "학원", "숙박", "펜션", "헬스장", "택배", "운송"]),

  ...topic("facility", [
    "인테리어", "시설", "리모델링", "간판", "장비", "설비", "개보수", "점포개선", "환경개선", "집기",
  ]),
  ...topic("house", [
    "월세", "전세", "전월세", "주거", "주택", "임대주택", "임차", "보증금", "이사", "내집", "청약", "관리비",
  ]),
  ...topic("fund", ["대출", "자금", "융자", "보증", "이자", "금리", "투자", "대환", "정책자금"]),
  ...topic("job", ["취업", "일자리", "구직", "이직", "채용", "고용", "인건비", "재취업", "인턴", "구인", "실업"]),
  ...topic("startup", ["창업", "귀농", "예비창업", "재창업", "스타트업", "개업"]),
  ...topic("export", ["수출", "해외", "무역", "글로벌", "바이어"]),
  ...topic("edu", ["교육", "강의", "훈련", "연수", "자격증", "멘토링", "아카데미"]),
  ...topic("market", ["마케팅", "판로", "홍보", "광고", "박람회", "전시회", "판매", "브랜드"]),
  ...topic("digital", ["키오스크", "스마트", "디지털", "온라인", "자동화", "전산"]),
];
