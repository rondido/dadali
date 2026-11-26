// 검색 조건 (해석 칩)과 URL 주소 사이의 변환 (기획서 7-1장 저장과 공유)
// 예: /?region=11&gu=마포구&age=youth&biz=retail&topic=facility. 입력 문장은 URL에 넣지 않는다
import {
  AGE_GROUPS,
  INDUSTRIES,
  REGIONS,
  TARGETS,
  TOPICS,
  ageLabel,
  industryLabel,
  regionLabel,
  targetLabel,
  topicLabel,
  isAgeGroup,
  isIndustry,
  isRegionCode,
  isTarget,
  isTopic,
  type AgeGroup,
  type Industry,
  type RegionCode,
  type Target,
  type Topic,
} from "./conditionValues";
import { isDistrictOf } from "./districts";

export interface SearchConditions {
  region: RegionCode | null; // null = 전국
  // 시·도 아래 시·군·구 ("마포구"). 문장에 적었을 때만 정한다. 다른 시·군·구 기관의 공고를 뺀다
  district: string | null;
  age: AgeGroup | null;
  // 대상(가구 상황): 임신·출산·육아, 장애인, 저소득 등. 나이대처럼 하나만 고른다
  target: Target | null;
  biz: Industry | null;
  topics: Topic[]; // 주제끼리는 "또는"
}

export const EMPTY_CONDITIONS: SearchConditions = { region: null, district: null, age: null, target: null, biz: null, topics: [] };

export function hasConditions(conditions: SearchConditions): boolean {
  return (
    conditions.region !== null ||
    conditions.age !== null ||
    conditions.target !== null ||
    conditions.biz !== null || conditions.topics.length > 0
  );
}

// 칩 하나 = 조건 하나. 지역·나이대·하는 일은 하나만, 관심 주제는 여러 개
export type ConditionChip =
  // district: 문자열이면 그 시·군·구로, null이면 시·군·구를 비우고, 없으면 지금 시·군·구를 (그 시·도에 있을 때) 남긴다
  | { kind: "region"; value: RegionCode; district?: string | null }
  | { kind: "age"; value: AgeGroup }
  | { kind: "target"; value: Target }
  | { kind: "biz"; value: Industry }
  | { kind: "topic"; value: Topic };

// 칩마다 작게 붙이는 종류 이름 (기획서 5-1장 칩 규칙)
export const CHIP_KIND_LABEL: Record<ConditionChip["kind"], string> = {
  region: "지역",
  age: "나이대",
  target: "대상",
  biz: "하는 일",
  topic: "주제",
};

export function chipLabel(chip: ConditionChip): string {
  if (chip.kind === "region") return chip.district ? `${regionLabel(chip.value)} ${chip.district}` : regionLabel(chip.value);
  if (chip.kind === "age") return ageLabel(chip.value);
  if (chip.kind === "target") return targetLabel(chip.value);
  if (chip.kind === "biz") return industryLabel(chip.value);
  return topicLabel(chip.value);
}

// 칩 순서: 지역 → 나이대 → 대상 → 하는 일 → 관심 주제
export function toChips(conditions: SearchConditions): ConditionChip[] {
  const chips: ConditionChip[] = [];
  if (conditions.region) {
    chips.push({ kind: "region", value: conditions.region, ...(conditions.district ? { district: conditions.district } : {}) });
  }
  if (conditions.age) chips.push({ kind: "age", value: conditions.age });
  if (conditions.target) chips.push({ kind: "target", value: conditions.target });
  if (conditions.biz) chips.push({ kind: "biz", value: conditions.biz });
  for (const topic of conditions.topics) chips.push({ kind: "topic", value: topic });
  return chips;
}

// 조건을 직접 고르는 화면("+ 조건 추가", 첫 화면 선택형)이 함께 쓰는 항목 순서와 선택지
export const CONDITION_FIELDS = [
  { kind: "region", label: CHIP_KIND_LABEL.region, options: REGIONS },
  { kind: "age", label: CHIP_KIND_LABEL.age, options: AGE_GROUPS },
  { kind: "target", label: CHIP_KIND_LABEL.target, options: TARGETS },
  { kind: "biz", label: CHIP_KIND_LABEL.biz, options: INDUSTRIES },
  { kind: "topic", label: CHIP_KIND_LABEL.topic, options: TOPICS },
] as const;

export function hasChip(conditions: SearchConditions, chip: ConditionChip): boolean {
  if (chip.kind === "topic") return conditions.topics.includes(chip.value);
  return conditions[chip.kind] === chip.value;
}

// 고른 값을 다시 누르면 빼고, 아니면 고른다
export function toggleChip(conditions: SearchConditions, chip: ConditionChip): SearchConditions {
  return hasChip(conditions, chip) ? withoutChip(conditions, chip) : withChip(conditions, chip);
}

export function withoutChip(conditions: SearchConditions, chip: ConditionChip): SearchConditions {
  if (chip.kind === "topic") return { ...conditions, topics: conditions.topics.filter((t) => t !== chip.value) };
  if (chip.kind === "region") return { ...conditions, region: null, district: null };
  return { ...conditions, [chip.kind]: null };
}

// 지역·나이대·하는 일은 바꾸고, 관심 주제는 더한다
export function withChip(conditions: SearchConditions, chip: ConditionChip): SearchConditions {
  if (chip.kind === "topic") {
    return conditions.topics.includes(chip.value)
      ? conditions
      : { ...conditions, topics: [...conditions.topics, chip.value] };
  }
  // 다른 시·도로 바꾸면 그 시·도에도 같은 이름이 있을 때만 시·군·구를 남긴다 (지역 후보 고르기: 중구 서울 → 부산)
  if (chip.kind === "region") {
    const district = chip.district !== undefined ? chip.district : conditions.district;
    return { ...conditions, region: chip.value, district: isDistrictOf(chip.value, district) ? district : null };
  }
  return { ...conditions, [chip.kind]: chip.value };
}

// 알 수 없는 값은 버린다 (손으로 고친 주소, 예전 형식의 공유 링크)
export function conditionsFromParams(params: URLSearchParams): SearchConditions {
  const region = params.get("region");
  const age = params.get("age");
  const biz = params.get("biz");
  const target = params.get("target");
  const topics = (params.get("topic") ?? "").split(",").filter(isTopic);
  const district = params.get("gu");
  const validRegion = isRegionCode(region) ? region : null;

  return {
    region: validRegion,
    district: validRegion && isDistrictOf(validRegion, district) ? district : null,
    age: isAgeGroup(age) ? age : null,
    target: isTarget(target) ? target : null,
    biz: isIndustry(biz) ? biz : null,
    topics: [...new Set(topics)],
  };
}

export function conditionsToParams(conditions: SearchConditions): URLSearchParams {
  const params = new URLSearchParams();
  if (conditions.region) params.set("region", conditions.region);
  if (conditions.region && conditions.district) params.set("gu", conditions.district);
  if (conditions.age) params.set("age", conditions.age);
  if (conditions.target) params.set("target", conditions.target);
  if (conditions.biz) params.set("biz", conditions.biz);
  if (conditions.topics.length > 0) params.set("topic", conditions.topics.join(","));
  return params;
}
