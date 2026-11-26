// 목록 줄에서 D-day 아래에 작게 붙이는 실제 날짜. "D-23"보다 날짜가 빨리 와닿는 사람도 있어 함께 보여 준다
// 접수 예정은 언제 시작해 언제 끝나는지가 중요하므로 기간을, 접수 중·마감은 마감일을 쓴다. 상시는 날짜가 없다
import { formatShortDate } from "@/domain/date/formatShortDate";
import type { NoticeSchedule } from "./notice";
import type { NoticeStatus } from "./noticeStatus";

export function rowDateOf(notice: NoticeSchedule, status: NoticeStatus): string | null {
  if (status === "always") return null;
  if (status === "upcoming") {
    if (!notice.applyStart) return null;
    return notice.applyEnd
      ? `${formatShortDate(notice.applyStart)} ~ ${formatShortDate(notice.applyEnd)}`
      : `${formatShortDate(notice.applyStart)} 시작`;
  }
  return notice.applyEnd ? `${formatShortDate(notice.applyEnd)} 마감` : null;
}
