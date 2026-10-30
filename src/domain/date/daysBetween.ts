import type { IsoDate } from "@/domain/notice/notice";

const DAY_MS = 24 * 60 * 60 * 1000;

// "YYYY-MM-DD"를 UTC 자정으로 읽어 시간대·서머타임 영향 없이 날짜 수만 센다
function toUtcMs(date: IsoDate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

// from에서 to까지 며칠인지 (to가 앞이면 음수)
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}
