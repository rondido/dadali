// 검색 결과 중 먼저 볼 공고를 고른다. 자격을 판정하지 않고 "조건과 얼마나 분명히 맞는지"와 "얼마나 급한지"로만 줄 세운다
// 대상이 비어 있는 공고는 검색에는 통과하지만(전체 대상), 조건과 분명히 맞은 것이 아니므로 여기서는 세지 않는다
import type { IsoDate } from "@/domain/notice/notice";
import { noticeStatusOf, type NoticeStatus } from "@/domain/notice/noticeStatus";
import { ageLabel, industryLabel, regionLabel, topicLabel } from "./conditionValues";
import type { SearchConditions } from "./conditions";
import type { NoticeMatch } from "./matchNotices";

export const RECOMMEND_COUNT = 3;

// 지금 낼 수 있는 공고 → 곧 열리는 공고 → 언제든 낼 수 있는 상시 공고 순서
const STATUS_ORDER: Record<Exclude<NoticeStatus, "closed">, number> = { closing: 0, open: 0, upcoming: 1, always: 2 };

function explicitReasons({ notice }: NoticeMatch, conditions: SearchConditions): string[] {
  const reasons: string[] = [];
  if (conditions.region && notice.regionCodes.includes(conditions.region)) reasons.push(regionLabel(conditions.region));
  if (conditions.age && notice.ageGroups.includes(conditions.age)) reasons.push(ageLabel(conditions.age));
  if (conditions.biz && notice.industries.includes(conditions.biz)) reasons.push(industryLabel(conditions.biz));
  for (const topic of conditions.topics) {
    if (notice.topics.includes(topic)) reasons.push(topicLabel(topic));
  }
  return reasons;
}

// 같은 상태끼리 비교하는 날짜: 곧 열리는 공고는 시작일, 나머지는 마감일 (마감일이 없으면 뒤로)
function urgencyDate({ notice }: NoticeMatch, status: NoticeStatus): string {
  return (status === "upcoming" ? notice.applyStart : notice.applyEnd) ?? "9999";
}

// 조건과 분명히 맞은 부분이 있는 공고만 골라 reasons를 그 부분으로 바꿔 돌려준다
export function recommendNotices(
  matches: NoticeMatch[],
  conditions: SearchConditions,
  today: IsoDate,
  count: number = RECOMMEND_COUNT,
): NoticeMatch[] {
  return matches
    .flatMap((match) => {
      const status = noticeStatusOf(match.notice, today);
      if (status === "closed") return [];
      const reasons = explicitReasons(match, conditions);
      return reasons.length > 0 ? [{ match, reasons, order: STATUS_ORDER[status], date: urgencyDate(match, status) }] : [];
    })
    .sort(
      (a, b) =>
        b.reasons.length - a.reasons.length ||
        a.order - b.order ||
        a.date.localeCompare(b.date) ||
        a.match.notice.title.localeCompare(b.match.notice.title, "ko"),
    )
    .slice(0, count)
    .map(({ match, reasons }) => ({ ...match, reasons }));
}
