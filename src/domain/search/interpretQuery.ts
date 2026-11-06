// 자유 입력 문장을 검색 조건으로 바꾸는 사전 규칙 해석 (기획서 5-1장)
// 사전은 인자로 받는다: 지금은 샘플 사전, 이후 Dictionary 테이블(법정동코드·표준산업분류)로 바꾼다
import { isAgeGroup, isIndustry, isRegionCode, isTopic, type AgeGroup, type RegionCode } from "./conditionValues";
import { EMPTY_CONDITIONS, type SearchConditions } from "./conditions";

export interface DictionaryEntry {
  term: string;
  kind: "region" | "age" | "industry" | "topic";
  value: string;
  // 같은 단어가 가리킬 수 있는 다른 지역 (예: 광주 → 광주광역시 / 경기 광주시)
  ambiguousWith?: string[];
}

export interface Interpretation {
  conditions: SearchConditions;
  // 사용자에게 고르게 할 지역 후보: 뜻이 둘인 지명, 또는 두 번째 이후로 나온 지역 (첫 번째 지역은 conditions에 들어간다)
  regionChoices: RegionCode[];
  // 조건으로 바꾸지 못한 단어 (공고명·요약 검색과 "이해하지 못했어요" 안내에 쓴다)
  unknownTerms: string[];
}

// 단어 끝에서 떼어낼 조사·어미. 긴 것부터 맞춘다
// "이"는 "고양이"처럼 이름 끝 글자인 경우가 많아 떼지 않는다
const ENDINGS = [
  "에서는", "인데요", "이에요", "에서", "인데", "예요", "이고", "으로", "하는", "해요", "이랑",
  "랑", "와", "과", "을", "를", "은", "는", "가", "도", "에", "로", "의", "요",
];

// 조건과 상관없는 흔한 말. 못 알아들은 단어로 세지 않는다
const STOPWORDS = new Set([
  "지원", "지원금", "지원사업", "사업", "혜택", "정부", "있나요", "있어요", "있을까요", "있는", "받을", "수",
  "하는", "하고", "하려고", "운영", "중", "저", "제가", "나", "내", "가게", "뭐", "어떤", "알려줘", "찾아줘",
  "싶어요", "싶은", "준비", "살", "세", "명", "곳",
]);

// "32살", "65세" → 나이, "40대" → 연령대. 찾은 부분은 문장에서 지운다
const AGE_YEARS = /(\d{1,3})\s*(?:살|세)/;
const AGE_DECADE = /([1-9])0\s*대/;

function ageFromYears(years: number): AgeGroup {
  if (years < 40) return "youth";
  if (years < 65) return "middle";
  return "senior";
}

function takeNumericAge(text: string): { age: AgeGroup | null; rest: string } {
  const years = text.match(AGE_YEARS);
  if (years) return { age: ageFromYears(Number(years[1])), rest: text.replace(years[0], " ") };
  const decade = text.match(AGE_DECADE);
  if (decade) return { age: ageFromYears(Number(decade[1]) * 10), rest: text.replace(decade[0], " ") };
  return { age: null, rest: text };
}

// 떼고 나서 두 글자 이상 남을 때만 뗀다 ("휴가"의 "가"는 조사가 아니다)
function stripEnding(word: string): string {
  const ending = ENDINGS.find((e) => word.length - e.length >= 2 && word.endsWith(e));
  return ending ? word.slice(0, -ending.length) : word;
}

// 단어가 사전 단어로 시작하면 그 사전 단어를 고른다 ("서울에서" → "서울", "카페하는" → "카페"). 가장 긴 것을 고른다
function lookUp(word: string, dictionary: DictionaryEntry[]): DictionaryEntry[] {
  let best = "";
  for (const entry of dictionary) {
    if (word.startsWith(entry.term) && entry.term.length > best.length) best = entry.term;
  }
  return best ? dictionary.filter((e) => e.term === best) : [];
}

export function interpretQuery(text: string, dictionary: DictionaryEntry[]): Interpretation {
  const normalizedDictionary = dictionary.map((e) => ({ ...e, term: e.term.toLowerCase() }));
  const { age: numericAge, rest } = takeNumericAge(text.toLowerCase());
  const words = rest.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  const conditions: SearchConditions = { ...EMPTY_CONDITIONS, age: numericAge, topics: [] };
  const regionChoices: RegionCode[] = [];
  const unknownTerms: string[] = [];

  const addRegion = (entry: DictionaryEntry) => {
    const candidates = [entry.value, ...(entry.ambiguousWith ?? [])].filter(isRegionCode);
    if (conditions.region === null) {
      conditions.region = candidates[0] ?? null;
      // 뜻이 둘인 지명이면 첫 번째로 찾되, 나머지를 고를 수 있게 한다
      if (candidates.length > 1) regionChoices.push(...candidates);
      return;
    }
    for (const code of candidates) {
      if (!regionChoices.includes(code)) regionChoices.push(code);
    }
  };

  for (const word of words) {
    const entries = lookUp(word, normalizedDictionary);
    if (entries.length === 0) {
      // "32살인데"에서 나이를 지우고 남은 "인데"처럼 조사·어미만 남은 조각은 버린다
      if (ENDINGS.includes(word)) continue;
      const stem = stripEnding(word);
      if (stem.length >= 2 && !STOPWORDS.has(stem) && !STOPWORDS.has(word) && !unknownTerms.includes(stem)) {
        unknownTerms.push(stem);
      }
      continue;
    }
    for (const entry of entries) {
      if (entry.kind === "region") addRegion(entry);
      if (entry.kind === "age" && conditions.age === null && isAgeGroup(entry.value)) conditions.age = entry.value;
      if (entry.kind === "industry" && conditions.biz === null && isIndustry(entry.value)) conditions.biz = entry.value;
      if (entry.kind === "topic" && isTopic(entry.value) && !conditions.topics.includes(entry.value)) {
        conditions.topics.push(entry.value);
      }
    }
  }

  // 선택된 지역 하나뿐인 후보 목록은 고를 것이 없으므로 비운다
  const choices = regionChoices.length === 1 && regionChoices[0] === conditions.region ? [] : regionChoices;
  return { conditions, regionChoices: choices, unknownTerms };
}
