// 서비스 기준 시간대는 한국(Asia/Seoul). 사용자 기기 시간대와 상관없이 같은 "오늘"을 쓴다.
import type { IsoDate } from "@/domain/notice/notice";

// en-CA 로케일은 날짜를 "YYYY-MM-DD"로 표기한다
const seoulDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toSeoulDate(instant: Date): IsoDate {
  return seoulDateFormat.format(instant);
}

const seoulDateTimeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// "최종 갱신" 표시용: "11월 10일 05:00" (서울 기준)
export function formatSeoulDateTime(instant: Date): string {
  const parts = Object.fromEntries(seoulDateTimeFormat.formatToParts(instant).map((p) => [p.type, p.value]));
  return `${parts.month} ${parts.day}일 ${parts.hour}:${parts.minute}`;
}
