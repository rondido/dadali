// 검색 조건 (해석 칩)과 URL 주소 사이의 변환 (기획서 7-1장 저장과 공유)
// 예: /?region=11&age=youth&biz=retail&topic=facility. 입력 문장은 URL에 넣지 않는다
import {
  ageLabel,
  industryLabel,
  regionLabel,
  topicLabel,
  isAgeGroup,
  isIndustry,
  isRegionCode,
  isTopic,
  type AgeGroup,
  type Industry,
  type RegionCode,
  type Topic,
} from "./conditionValues";

export interface SearchConditions {
  region: RegionCode | null; // null = 전국
  age: AgeGroup | null;
  biz: Industry | null;
  topics: Topic[]; // 주제끼리는 "또는"
}

export const EMPTY_CONDITIONS: SearchConditions = { region: null, age: null, biz: null, topics: [] };

export function hasConditions(conditions: SearchConditions): boolean {
  return (
    conditions.region !== null || conditions.age !== null || conditions.biz !== null || conditions.topics.length > 0
  );
}

// 칩 하나 = 조건 하나. 지역·나이대·하는 일은 하나만, 관심 주제는 여러 개
export type ConditionChip =
  | { kind: "region"; value: RegionCode }
  | { kind: "age"; value: AgeGroup }
  | { kind: "biz"; value: Industry }
  | { kind: "topic"; value: Topic };

// 칩마다 작게 붙이는 종류 이름 (기획서 5-1장 칩 규칙)
export const CHIP_KIND_LABEL: Record<ConditionChip["kind"], string> = {
  region: "지역",
  age: "나이대",
  biz: "하는 일",
  topic: "관심",
};

export function chipLabel(chip: ConditionChip): string {
  if (chip.kind === "region") return regionLabel(chip.value);
  if (chip.kind === "age") return ageLabel(chip.value);
  if (chip.kind === "biz") return industryLabel(chip.value);
  return topicLabel(chip.value);
}

// 칩 순서: 지역 → 나이대 → 하는 일 → 관심 주제
export function toChips(conditions: SearchConditions): ConditionChip[] {
  const chips: ConditionChip[] = [];
  if (conditions.region) chips.push({ kind: "region", value: conditions.region });
  if (conditions.age) chips.push({ kind: "age", value: conditions.age });
  if (conditions.biz) chips.push({ kind: "biz", value: conditions.biz });
  for (const topic of conditions.topics) chips.push({ kind: "topic", value: topic });
  return chips;
}

export function withoutChip(conditions: SearchConditions, chip: ConditionChip): SearchConditions {
  if (chip.kind === "topic") return { ...conditions, topics: conditions.topics.filter((t) => t !== chip.value) };
  return { ...conditions, [chip.kind]: null };
}

// 지역·나이대·하는 일은 바꾸고, 관심 주제는 더한다
export function withChip(conditions: SearchConditions, chip: ConditionChip): SearchConditions {
  if (chip.kind === "topic") {
    return conditions.topics.includes(chip.value)
      ? conditions
      : { ...conditions, topics: [...conditions.topics, chip.value] };
  }
  return { ...conditions, [chip.kind]: chip.value };
}

// 알 수 없는 값은 버린다 (손으로 고친 주소, 예전 형식의 공유 링크)
export function conditionsFromParams(params: URLSearchParams): SearchConditions {
  const region = params.get("region");
  const age = params.get("age");
  const biz = params.get("biz");
  const topics = (params.get("topic") ?? "").split(",").filter(isTopic);

  return {
    region: isRegionCode(region) ? region : null,
    age: isAgeGroup(age) ? age : null,
    biz: isIndustry(biz) ? biz : null,
    topics: [...new Set(topics)],
  };
}

export function conditionsToParams(conditions: SearchConditions): URLSearchParams {
  const params = new URLSearchParams();
  if (conditions.region) params.set("region", conditions.region);
  if (conditions.age) params.set("age", conditions.age);
  if (conditions.biz) params.set("biz", conditions.biz);
  if (conditions.topics.length > 0) params.set("topic", conditions.topics.join(","));
  return params;
}
