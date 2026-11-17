"use client";

// 이 브라우저에만 남기는 공고 기록: 최근 본 공고(목록에서 제목을 흐리게, "최근" 보기)와 관심 공고(별표로 담아 "관심" 보기).
// 검색어는 남기지 않는다. 저장소가 막힌 환경(사생활 보호 모드 등)에서는 이번 방문 동안만 기억하고 조용히 넘어간다
//
// 공고 내용까지 함께 저장한다. 상시 공고는 서버가 검색 조건으로 걸러 보내므로, 조건이 바뀌면
// 지금 받은 목록에 없을 수 있어서다. 화면에서는 지금 받은 목록에 있으면 그 최신 내용을 쓴다
import { useCallback, useEffect, useState } from "react";
import type { Notice } from "@/domain/notice/notice";

const RECENT_KEY = "dadali:recent";
const SAVED_KEY = "dadali:saved";
// 이전 버전에서 남긴 열어 본 공고 ID 목록 (이제 RECENT_KEY로 대신한다). 읽지 않고 지우기만 한다
const LEGACY_VIEWED_KEY = "dadali:viewed";
// 최근 본 공고는 최근 것만 남긴다
const RECENT_LIMIT = 20;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장하지 못해도 이번 방문 동안은 화면 상태로 기억한다
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 지우지 못해도 화면 상태는 비운다
  }
}

export function useNoticeMemory() {
  const [recent, setRecent] = useState<Notice[]>([]); // 가장 최근에 본 것이 앞
  const [saved, setSaved] = useState<Notice[]>([]);

  // 브라우저에서만 읽는다 (서버에서 그린 첫 화면과 어긋나지 않게 처음에는 비워 둔다)
  useEffect(() => {
    setRecent(read<Notice[]>(RECENT_KEY, []));
    setSaved(read<Notice[]>(SAVED_KEY, []));
    remove(LEGACY_VIEWED_KEY);
  }, []);

  // 본 공고를 맨 앞으로 옮긴다 (이미 있으면 자리만 바꾼다)
  const markViewed = useCallback((notice: Notice) => {
    setRecent((current) => {
      const next = [notice, ...current.filter((n) => n.id !== notice.id)].slice(0, RECENT_LIMIT);
      write(RECENT_KEY, next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    remove(RECENT_KEY);
    setRecent([]);
  }, []);

  // 담았으면 빼고, 아니면 담는다. 담았는지(true)를 돌려준다
  const toggleSaved = useCallback(
    (notice: Notice): boolean => {
      const wasSaved = saved.some((n) => n.id === notice.id);
      const next = wasSaved ? saved.filter((n) => n.id !== notice.id) : [...saved, notice];
      write(SAVED_KEY, next);
      setSaved(next);
      return !wasSaved;
    },
    [saved],
  );

  return {
    viewedIds: new Set(recent.map((n) => n.id)),
    recentNotices: recent,
    savedIds: new Set(saved.map((n) => n.id)),
    savedNotices: saved,
    markViewed,
    clearRecent,
    toggleSaved,
  };
}
