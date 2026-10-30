// 화면 개발용 샘플 해석 사전. 이후 법정동코드·표준산업분류로 채운 Dictionary 테이블로 바꾼다 (기획서 5-1장, 8장)
// e2e 테스트(e2e/search.spec.ts)가 이 사전을 기준으로 검증하므로 바꿀 때 함께 고친다.
import type { DictionaryEntry } from "@/domain/search/interpretQuery";
import { REGIONS } from "@/domain/search/conditionValues";

const region = (term: string, value: string, ambiguousWith?: string[]): DictionaryEntry => ({
  term,
  kind: "region",
  value,
  ambiguousWith,
});
const age = (term: string, value: string): DictionaryEntry => ({ term, kind: "age", value });
const industry = (term: string, value: string): DictionaryEntry => ({ term, kind: "industry", value });
const topic = (term: string, value: string): DictionaryEntry => ({ term, kind: "topic", value });

export const SAMPLE_DICTIONARY: DictionaryEntry[] = [
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
  // 동·구 이름과 별칭 (실서비스는 법정동코드 전체)
  region("망원동", "11"),
  region("홍대", "11"),
  region("강남", "11"),
  region("분당", "41"),
  region("판교", "41"),
  region("수원", "41"),
  region("해운대", "26"),

  age("청년", "youth"),
  age("대학생", "youth"),
  age("취준생", "youth"),
  age("사회초년생", "youth"),
  age("중장년", "middle"),
  age("신중년", "middle"),
  age("어르신", "senior"),
  age("노인", "senior"),
  age("시니어", "senior"),

  industry("카페", "retail"),
  industry("식당", "retail"),
  industry("음식점", "retail"),
  industry("편의점", "retail"),
  industry("쇼핑몰", "retail"),
  industry("공장", "mfg"),
  industry("제조", "mfg"),
  industry("앱", "it"),
  industry("소프트웨어", "it"),
  industry("개발", "it"),
  industry("귀농", "agri"),
  industry("농사", "agri"),
  industry("어업", "agri"),
  industry("유튜브", "culture"),
  industry("콘텐츠", "culture"),
  industry("디자인", "culture"),
  industry("미용실", "etc"),

  topic("인테리어", "facility"),
  topic("시설", "facility"),
  topic("리모델링", "facility"),
  topic("간판", "facility"),
  topic("장비", "facility"),
  topic("월세", "house"),
  topic("전세", "house"),
  topic("주거", "house"),
  topic("대출", "fund"),
  topic("자금", "fund"),
  topic("융자", "fund"),
  topic("취업", "job"),
  topic("일자리", "job"),
  topic("구직", "job"),
  topic("이직", "job"),
  topic("창업", "startup"),
  topic("귀농", "startup"),
  topic("수출", "export"),
  topic("해외", "export"),
  topic("교육", "edu"),
  topic("강의", "edu"),
  topic("마케팅", "market"),
  topic("판로", "market"),
  topic("홍보", "market"),
  topic("키오스크", "digital"),
  topic("스마트", "digital"),
  topic("디지털", "digital"),
];
