// 공고의 대상 태그 (기획서 5장 공고 상세 "대상 태그"). 빈 값은 전체 대상이므로 "전국", "전 연령"으로 보여준다
import { ageLabel, industryLabel, regionLabel, targetLabel, topicLabel } from "@/domain/search/conditionValues";
import type { Notice } from "./notice";

export interface NoticeTargets {
  regions: string[];
  ages: string[];
  targets: string[]; // 대상(가구 상황). 정해진 처지가 없으면 비운다
  industries: string[]; // 업종 제한이 없으면 비운다 (개인 혜택은 업종과 상관없음)
  topics: string[];
}

export function targetsOf(notice: Pick<Notice, "regionCodes" | "ageGroups" | "targets" | "industries" | "topics">): NoticeTargets {
  return {
    regions: notice.regionCodes.length > 0 ? notice.regionCodes.map(regionLabel) : ["전국"],
    ages: notice.ageGroups.length > 0 ? notice.ageGroups.map(ageLabel) : ["전 연령"],
    targets: (notice.targets ?? []).map(targetLabel),
    industries: notice.industries.map(industryLabel),
    topics: notice.topics.map(topicLabel),
  };
}
