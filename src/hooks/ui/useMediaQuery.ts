"use client";

// 화면 폭 조건(미디어 쿼리)이 맞는지. 서버에서 그릴 때와 첫 화면에서는 false로 시작한다
import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
