"use client";

// 서울 기준 "오늘". 서버 렌더링 시각과 어긋나지 않도록(자정 무렵 등) 브라우저에서만 정하고, 그 전에는 null
import { useEffect, useState } from "react";
import { toSeoulDate } from "@/domain/date/seoulDate";
import type { IsoDate } from "@/domain/notice/notice";

// fixed: 테스트에서 오늘을 고정할 때만 넘긴다
export function useSeoulToday(fixed?: IsoDate): IsoDate | null {
  const [today, setToday] = useState<IsoDate | null>(fixed ?? null);
  useEffect(() => {
    if (!fixed) setToday(toSeoulDate(new Date()));
  }, [fixed]);
  return today;
}
