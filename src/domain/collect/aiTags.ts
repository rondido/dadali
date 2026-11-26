// AI 태깅 (검색 정확도 개선): 공고 원문을 Claude에 주고 검색용 태그(지역·나이대·업종·주제)를 받는다
// 수집 규칙(kstartup.ts, gov24.ts)이 비워 둔 태그가 "전체 대상"으로 통과해 검색 결과에 관련 없는 공고가 섞이는 문제를 줄인다
import { createHash } from "node:crypto";
import { z } from "zod";
import { AGE_GROUPS, INDUSTRIES, REGIONS, TOPICS } from "@/domain/search/conditionValues";
import type { NoticeRecord } from "./record";

const values = <T extends { value: string }>(options: readonly T[]) =>
  options.map((o) => o.value) as [T["value"], ...T["value"][]];

export const AiTagsSchema = z.object({
  regions: z.array(z.enum(values(REGIONS))),
  ages: z.array(z.enum(values(AGE_GROUPS))),
  minors_only: z.boolean(),
  industries: z.array(z.enum(values(INDUSTRIES))),
  topics: z.array(z.enum(values(TOPICS))),
});
export type AiTags = z.infer<typeof AiTagsSchema>;

// 기간 있는 공고(접수 예정·접수 중 열, 사람들이 가장 먼저 보는 것)는 정확한 모델, 1만 건이 넘는 상시 혜택은 저렴한 모델
// 50건 비교 시험에서 정한 배분 (예산 $5 안에서 처음 전체 태깅 약 $1.2)
export const TAG_MODEL_DATED = "claude-opus-5-5";
export const TAG_MODEL_ALWAYS = "claude-haiku-5-5";

export function tagModelOf(isAlways: boolean): string {
  return isAlways ? TAG_MODEL_ALWAYS : TAG_MODEL_DATED;
}

export const TAG_SYSTEM_PROMPT = `너는 한국 정부·공공 지원사업을 검색용 태그로 분류한다. 공고 원문만 근거로 쓰고, 원문에 없는 조건을 짐작해 넣지 않는다.

regions: 신청할 수 있는 사람의 거주지·사업장이 특정 시·도로 제한될 때만 그 시·도 코드. 전국 대상이거나 제한이 없으면 빈 배열.
  시·군·구, 구청, 시청, 지역 센터가 운영해 그 지역 주민·사업자만 대상이면 해당 시·도 코드를 넣는다.
  코드: ${REGIONS.map((r) => `${r.value} ${r.label}`).join(", ")}.
ages: 신청 자격에 나이 제한이 있을 때만. child = 만 18세 이하(영유아·아동·청소년·초중고생), youth = 대략 만 19~39세(청년), middle = 40~64세(중장년·신중년), senior = 65세 이상(노인·어르신).
  혜택을 받는 사람의 나이로 정한다. 보호자가 대신 신청하더라도 혜택이 아이에게 가면 child.
  나이 범위가 여러 그룹에 걸치면 해당 그룹을 모두 넣는다 (예: 고등학생·대학생 장학금 = child, youth). 나이 제한이 없으면 빈 배열.
minors_only: 대상이 만 18세 이하뿐이면 true. 그 경우 ages는 child 하나.
industries: 특정 업종 종사자·사업자만 대상일 때만. mfg 제조, it IT·지식서비스, retail 도소매·음식, agri 농림어업, culture 문화·콘텐츠, etc 그 밖의 특정 업종. 업종 제한이 없으면 빈 배열.
topics: 지원 내용의 성격(여러 개 가능). facility 시설·인테리어·장비, house 주거, fund 현금·보조금·대출·융자·보험료 지원, job 일자리·취업, startup 창업, export 수출·해외진출, edu 교육·훈련·멘토링·컨설팅, market 판로·마케팅·홍보, digital 디지털 전환·스마트화. 어느 것에도 맞지 않으면 빈 배열.`;

// 태깅에 쓰는 원문 필드. 조회수처럼 매번 바뀌는 값은 빼야 지문(contentHash)이 내용이 바뀔 때만 달라진다
const TAG_FIELDS: Record<NoticeRecord["source"], string[]> = {
  kstartup: [
    "biz_pbanc_nm", "pbanc_ntrp_nm", "supt_biz_clsfc", "supt_regin", "aply_trgt", "aply_trgt_ctnt",
    "aply_excl_trgt_ctnt", "biz_trgt_age", "biz_enyy", "pbanc_ctnt",
  ],
  gov24: [
    "서비스명", "소관기관명", "소관기관유형", "서비스분야", "사용자구분", "지원유형", "서비스목적요약",
    "지원대상", "선정기준", "지원내용",
  ],
};

const FIELD_MAX = 1500; // 한 필드가 아주 길어도 비용이 튀지 않게 자른다

export function tagInputOf(source: NoticeRecord["source"], raw: Record<string, unknown>): string {
  return TAG_FIELDS[source]
    .map((key) => [key, raw[key]] as const)
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .map(([key, value]) => `${key}: ${String(value).replace(/\s+/g, " ").trim().slice(0, FIELD_MAX)}`)
    .join("\n");
}

// 태깅 입력의 지문. 이 값이 그대로면 다시 태깅하지 않고, 수집이 AI 태그를 덮어쓰지 않는다
export function contentHashOf(source: NoticeRecord["source"], raw: Record<string, unknown>): string {
  return createHash("sha1").update(tagInputOf(source, raw)).digest("hex");
}

const sorted = <T extends string>(list: T[]) => [...new Set(list)].sort();

// 모델 답을 저장할 모양으로 다듬는다
// - 네 나이대를 모두 붙인 건 "나이 제한 없음"과 같다 (빈 배열 = 전체 대상 규칙에 맞춘다)
// - 미성년자 전용이면 나이대는 아동·청소년 하나다
export function normalizeAiTags(tags: AiTags): AiTags {
  const ages: AiTags["ages"] = tags.minors_only
    ? ["child"]
    : new Set(tags.ages).size === AGE_GROUPS.length
      ? []
      : sorted(tags.ages);
  return {
    regions: sorted(tags.regions),
    ages,
    minors_only: tags.minors_only,
    industries: sorted(tags.industries),
    topics: sorted(tags.topics),
  };
}
