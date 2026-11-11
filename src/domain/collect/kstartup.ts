// K-Startup 지원사업 공고 → 혜택톡톡 공고 (기획서 13장 다달이 분류 매핑)
import type { AgeGroup, RegionCode, Topic } from "@/domain/search/conditionValues";
import { parseCompactDate } from "./dates";
import { cleanText, toSummary, unique, type NoticeRecord } from "./record";
import { sidoCodesOf } from "./regions";

const KSTARTUP_HOME = "https://www.k-startup.go.kr";

// 지원 분야 → 관심 주제. 모든 K-Startup 공고에는 "창업"을 붙인다
// "시설ㆍ공간ㆍ보육"은 창업 공간 입주라 "시설·인테리어"(점포 시설)와 뜻이 달라 붙이지 않는다
const TOPICS_BY_FIELD: Record<string, Topic[]> = {
  사업화: ["fund"],
  정책자금: ["fund"],
  "융자ㆍ보증": ["fund"],
  "멘토링ㆍ컨설팅ㆍ교육": ["edu"],
  창업교육: ["edu"],
  "판로ㆍ해외진출": ["market", "export"],
  글로벌: ["export"],
  인력: ["job"],
};

// 대상 연령 구간 → 나이대. "만 40세 이상"은 어르신까지 포함한다. 세 나이대가 모두 맞으면 전체 대상(빈 배열)
function ageGroupsOf(value: string): AgeGroup[] {
  const groups = new Set<AgeGroup>();
  for (const band of value.split(",").map((s) => s.trim())) {
    if (band.includes("20세 미만") || band.includes("39세 이하")) groups.add("youth");
    if (band.includes("40세 이상")) {
      groups.add("middle");
      groups.add("senior");
    }
  }
  return groups.size === 3 ? [] : [...groups];
}

// "전국"이 하나라도 있으면 전국(빈 배열)
function regionCodesOf(value: string): RegionCode[] {
  const names = value.split(",").map((s) => s.trim()).filter(Boolean);
  if (names.length === 0 || names.includes("전국")) return [];
  return unique(names.flatMap(sidoCodesOf));
}

// 공고 내용이 "~에서 다음과 같이 공고하오니 신청하시기 바랍니다" 같은 인사말뿐이면 신청 대상 설명을 요약으로 쓴다
const BOILERPLATE = /(공고하오니|공고합니다|신청하시기 바랍니다|바랍니다\.?$)/;

function summaryOf(item: Record<string, unknown>): string | null {
  const content = cleanText(item.pbanc_ctnt);
  const target = cleanText(item.aply_trgt_ctnt);
  if (content && !(BOILERPLATE.test(content) && content.length < 120 && target)) return toSummary(content);
  return toSummary(target || content);
}

export function fromKstartup(item: Record<string, unknown>): NoticeRecord {
  const applyStart = parseCompactDate(item.pbanc_rcpt_bgng_dt);
  const applyEnd = parseCompactDate(item.pbanc_rcpt_end_dt);
  const fields = cleanText(item.supt_biz_clsfc).split(",").map((s) => s.trim());

  return {
    source: "kstartup",
    sourceId: String(item.pbanc_sn ?? item.id),
    title: cleanText(item.biz_pbanc_nm),
    org: cleanText(item.pbanc_ntrp_nm) || cleanText(item.sprv_inst) || "K-Startup",
    categoryId: "C02",
    applyStart,
    applyEnd,
    isAlways: false,
    // 접수 기간은 항상 날짜로 오므로, 읽지 못하면 확인이 필요한 공고다
    parseStatus: applyStart && applyEnd ? "ok" : "check",
    detailUrl: cleanText(item.detl_pg_url) || KSTARTUP_HOME,
    summaryText: summaryOf(item),
    topics: unique<Topic>(["startup", ...fields.flatMap((f) => TOPICS_BY_FIELD[f] ?? [])]),
    ageGroups: ageGroupsOf(cleanText(item.biz_trgt_age)),
    regionCodes: regionCodesOf(cleanText(item.supt_regin)),
    industries: [],
    rawPayload: item,
  };
}
