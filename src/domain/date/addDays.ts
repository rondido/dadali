import type { IsoDate } from "@/domain/notice/noticeMarkers";

// "YYYY-MM-DD"에 날짜 수를 더한다. UTC로 계산해 시간대·서머타임 영향을 받지 않는다
export function addDays(date: IsoDate, days: number): IsoDate {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
