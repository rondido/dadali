"use client";

// 메인 화면의 검색 상태. 조건은 URL에 두어 새로고침·링크 공유 시 같은 결과가 나오게 한다 (기획서 7-1장)
// URL에 조건이나 all이 있으면 결과 화면, 없으면 첫 화면이다
//
// 낙관적 업데이트와 요청 묶기: 주소를 바꾸면 서버가 페이지를 다시 그려 보내고(상시 공고를 DB에서 다시 조회) 그 뒤에야 URL이 바뀐다.
// - 조건을 바꾸면 화면(칩)에는 바로 반영하고(local), 서버 요청은 모아서 한 번만 보낸다
//   칩 ×·되돌리기는 마지막으로 누른 뒤 잠시(DEBOUNCE_MS) 멈췄을 때, 조건 추가 창은 창을 닫을 때(hold → release)
// - 검색·전체 보기·처음으로는 바로 요청한다
// - 서버 응답이 와서 URL이 따라오면 local을 지운다. 그 전까지 pending이 참이라 목록은 스켈레톤으로 기다린다
// - 공고 열기: 목록의 선택 표시와 패널 자리는 바로 바꾸고(pendingNoticeId), 패널 내용은 서버 응답이 올 때까지 스켈레톤으로 둔다
// - 상세 조건(포함·제외 단어, 전국 대상 제외)은 받아 둔 목록에서 거르므로 서버에 묻지 않고 주소만 바꾼다(history.replaceState)
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  EMPTY_CONDITIONS,
  conditionsFromParams,
  conditionsToParams,
  hasConditions,
  withChip,
  withoutChip,
  type ConditionChip,
  type SearchConditions,
} from "@/domain/search/conditions";
import type { RegionCode } from "@/domain/search/conditionValues";
import {
  EMPTY_DETAILS,
  detailsFromParams,
  withoutDetailChip,
  writeDetails,
  type DetailChip,
  type DetailFilters,
} from "@/domain/search/detailFilters";
import { interpretQuery, type DictionaryEntry } from "@/domain/search/interpretQuery";
import { keywordsFromParams, writeKeywords } from "@/domain/search/keywords";
import { loadSavedConditions, saveConditions } from "./savedConditions";

// 조건 없이 전체 보드를 볼 때 URL에 붙이는 표시
const SHOW_ALL_PARAM = "all";
// 상세 패널로 연 공고 (링크로 공유하면 같은 공고가 열린다)
const NOTICE_PARAM = "notice";
// 칩 ×를 연달아 누를 때 서버 요청을 모으는 시간
const DEBOUNCE_MS = 500;
// 요청을 보내고 이만큼 지나도 응답이 없으면 늦다고 알리고 다시 시도할 수 있게 한다
const STALL_MS = 8000;

// 해석 결과 중 URL에 담지 않는 것. 새로고침하면 사라진다
interface InterpretationNotes {
  regionChoices: RegionCode[];
  query: string | null; // 방금 검색한 문장. 칩이 이 문장에서 나왔다고 알릴 때만 쓰고, 조건을 바꾸면 지운다 (저장하지 않는다)
}

const NO_NOTES: InterpretationNotes = { regionChoices: [], query: null };

// 화면에만 먼저 반영한 상태 (아직 서버에 보내지 않았거나 응답을 기다리는 중)
interface LocalView {
  conditions: SearchConditions;
  showResults: boolean;
  // 조건으로 바꾸지 못한 단어 (주소 kw). 서버가 상시 혜택 전체의 공고명·요약에서 찾는다
  keywords: string[];
}

// 이 상태를 나타내는 주소의 검색 부분 ("region=11&topic=facility", 조건이 없으면 "all=1", 첫 화면이면 "")
function queryOf(view: LocalView, details: DetailFilters): string {
  if (!view.showResults) return "";
  const params = writeKeywords(conditionsToParams(view.conditions), view.keywords);
  if (!hasConditions(view.conditions)) params.set(SHOW_ALL_PARAM, "1");
  return writeDetails(params, details).toString();
}

export function useSearch(dictionary: DictionaryEntry[]) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const urlConditions = useMemo(() => conditionsFromParams(params), [params]);
  const urlKeywords = useMemo(() => keywordsFromParams(params), [params]);
  const urlNoticeId = params.get(NOTICE_PARAM);
  const urlShowResults = hasConditions(urlConditions) || params.has(SHOW_ALL_PARAM) || urlNoticeId !== null;

  const [local, setLocal] = useState<LocalView | null>(null);
  // 상세 조건: 주소 값이 기준이고, 바꾼 직후 주소가 따라오기 전까지는 화면 값(localDetails)을 쓴다
  const urlDetails = useMemo(() => detailsFromParams(params), [params]);
  const [localDetails, setLocalDetails] = useState<DetailFilters | null>(null);
  const details = localDetails ?? urlDetails;
  // 모아 두었다가 나중에 보내는 요청(send)도 그때의 최신 상세 조건을 쓰게 한다
  const detailsRef = useRef(details);
  detailsRef.current = details;
  const conditions = local?.conditions ?? urlConditions;
  const showResults = local?.showResults ?? urlShowResults;
  const keywords = local?.keywords ?? urlKeywords;
  // 방금 누른 공고 (주소가 아직 따라오지 않음)
  const [pendingNoticeId, setPendingNoticeId] = useState<string | null>(null);
  // 조건을 바꾸면 열려 있던 패널은 닫는다 (새 결과에 그 공고가 없을 수 있다)
  const selectedNoticeId = pendingNoticeId ?? (local ? null : urlNoticeId);
  const noticeLoading = pendingNoticeId !== null && pendingNoticeId !== urlNoticeId;

  const [notes, setNotes] = useState<InterpretationNotes>(NO_NOTES);
  // 이 화면에서 패널을 열어 방문 기록이 하나 쌓였는지. 그렇다면 닫을 때 뒤로 가서 기록을 되돌린다
  const openedHere = useRef(false);

  // 요청 묶기: 아직 보내지 않은 local이 있는지(dirty), 조건 추가 창이 열려 있어 보내기를 미루는지(held)
  const latest = useRef<LocalView | null>(null);
  const dirty = useRef(false);
  const held = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // 응답이 늦는지 (마지막으로 보낸 주소는 다시 시도할 때 쓴다)
  const [stalled, setStalled] = useState(false);
  const lastSent = useRef<string | null>(null);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearStall = () => {
    if (stallTimer.current) clearTimeout(stallTimer.current);
    stallTimer.current = null;
  };

  // 주소를 바꾸는 요청은 모두 여기로: 서버 응답을 기다리는 동안 늦는지 지켜본다
  const navigateTo = (url: string, method: "push" | "replace") => {
    lastSent.current = url;
    clearStall();
    // 지금 주소와 같으면 주소가 바뀌지 않아 응답을 알 수 없으므로 지켜보지 않는다
    const current = params.size > 0 ? `${pathname}?${params}` : pathname;
    if (url !== current) stallTimer.current = setTimeout(() => setStalled(true), STALL_MS);
    startTransition(() => router[method](url, { scroll: false }));
  };

  // 주소가 바뀌었고(서버 응답이 왔거나 뒤로 가기) 더 보낼 것이 없으면 화면 상태를 URL에 맡긴다
  useEffect(() => {
    if (!dirty.current) setLocal(null);
    setLocalDetails(null);
    // 누른 공고가 주소에 담기면(서버 응답이 오면) 주소 값에 맡긴다. 뒤로 가기 등으로 다른 주소가 되어도 마찬가지
    setPendingNoticeId(null);
    clearStall();
    setStalled(false);
  }, [params]);

  useEffect(
    () => () => {
      clearTimer();
      clearStall();
    },
    [],
  );

  // 주소에 조건이 없으면 저장된 조건이 있는지 본 뒤에 화면을 정한다 (첫 화면이 잠깐 보였다 사라지지 않게)
  const [checkedSaved, setCheckedSaved] = useState(false);
  useEffect(() => {
    if (params.size === 0) {
      const saved = loadSavedConditions();
      if (saved) {
        router.replace(`${pathname}?${conditionsToParams(saved)}`, { scroll: false });
        return;
      }
    }
    setCheckedSaved(true);
    // 처음 열 때 한 번만 확인한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 모아 둔 상태를 서버에 보낸다. 지금 주소와 같으면(빼고 바로 되돌린 경우) 요청하지 않고 화면만 URL로 돌린다
  const send = (method: "push" | "replace") => {
    clearTimer();
    const view = latest.current;
    dirty.current = false;
    if (!view) return;
    const query = queryOf(view, detailsRef.current);
    const current = new URLSearchParams(params);
    current.delete(NOTICE_PARAM);
    if (query === current.toString() && !urlNoticeId) {
      setLocal(null);
      return;
    }
    navigateTo(query ? `${pathname}?${query}` : pathname, method);
  };

  // 화면에 바로 반영하고, when에 따라 지금 보내거나(now) 잠시 모았다가(later) 보낸다
  const change = (view: LocalView, when: "now" | "later", method: "push" | "replace") => {
    openedHere.current = false;
    setPendingNoticeId(null);
    setNotes((current) => (current.query ? { ...current, query: null } : current));
    if (view.showResults) saveConditions(view.conditions);
    latest.current = view;
    dirty.current = true;
    setLocal(view);
    clearTimer();
    if (when === "now") send(method);
    else if (!held.current) timer.current = setTimeout(() => send("replace"), DEBOUNCE_MS);
  };

  // 상세 조건을 바꾼다. 서버에 묻지 않고 화면과 주소만 바꾼다 (기록을 쌓지 않는다)
  const setDetails = (next: DetailFilters) => {
    setLocalDetails(next);
    const base = local ? new URLSearchParams(queryOf(local, EMPTY_DETAILS)) : new URLSearchParams(params);
    const nextParams = writeDetails(base, next);
    if (!local && urlNoticeId) nextParams.set(NOTICE_PARAM, urlNoticeId);
    const query = nextParams.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  };

  // 조건 칩을 바꿔도 남은 단어는 그대로 둔다. 새로 검색하거나 직접 고르면 바꾼다
  const go = (
    next: SearchConditions,
    when: "now" | "later" = "now",
    method: "push" | "replace" = "push",
    nextKeywords: string[] = keywords,
  ) => change({ conditions: next, showResults: true, keywords: nextKeywords }, when, method);

  return {
    ready: checkedSaved || params.size > 0,
    // 바꾼 조건이 아직 서버 결과에 반영되지 않았다 (목록은 이 동안 스켈레톤으로 기다린다)
    pending: local !== null && local.showResults,
    // 응답이 늦다. 다시 시도하면 마지막 요청을 다시 보낸다
    stalled,
    retry() {
      setStalled(false);
      if (lastSent.current) navigateTo(lastSent.current, "replace");
    },
    understoodFrom: notes.query,
    showResults,
    conditions,
    regionChoices: notes.regionChoices.filter((code) => code !== conditions.region),
    unknownTerms: keywords,

    // 문장을 해석해 조건을 바꾼다. 문장 자체는 남기지 않고, 조건으로 바꾸지 못한 단어만 주소(kw)에 담는다
    search(text: string) {
      const result = interpretQuery(text, dictionary);
      go(result.conditions, "now", "push", result.unknownTerms);
      setNotes({ regionChoices: result.regionChoices, query: text.trim() });
    },
    // 직접 고른 조건으로 찾는다. 해석한 문장이 없으므로 안내도 비운다
    applyConditions(next: SearchConditions) {
      setNotes(NO_NOTES);
      go(next, "now", "push", []);
    },
    // 칩 ×: 칩은 바로 빼고, 서버 요청은 연달아 누르는 동안 모은다
    removeChip(chip: ConditionChip) {
      go(withoutChip(conditions, chip), "later", "replace");
    },
    // "+ 조건 추가"나 지역 후보에서 고른 조건
    addChip(chip: ConditionChip) {
      go(withChip(conditions, chip), "later", "replace");
    },
    // 조건 추가 창이 열려 있는 동안은 요청을 보내지 않고 모은다. 창을 닫으면 한 번에 보낸다
    holdRequests() {
      held.current = true;
      clearTimer();
    },
    releaseRequests() {
      held.current = false;
      if (dirty.current) send("replace");
    },
    selectedNoticeId,
    // 선택한 공고의 서버 응답을 기다리는 중 (패널은 스켈레톤)
    noticeLoading,
    // 카드를 누르면 상세 패널을 연다. 이미 열려 있으면 기록을 쌓지 않고 내용만 바꾼다
    // 낙관적으로 열지 않고 서버 응답 뒤에 열린다. 모아 둔 조건 변경이 있으면 같은 요청에 함께 담는다
    openNotice(id: string) {
      const view = { conditions, showResults: true, keywords };
      const nextParams = new URLSearchParams(queryOf(view, details));
      nextParams.set(NOTICE_PARAM, id);
      clearTimer();
      dirty.current = false;
      setPendingNoticeId(id);
      const url = `${pathname}?${nextParams}`;
      if (urlNoticeId === null) openedHere.current = true;
      navigateTo(url, urlNoticeId === null ? "push" : "replace");
    },
    closeNotice() {
      setPendingNoticeId(null);
      if (openedHere.current) {
        openedHere.current = false;
        router.back();
        return;
      }
      const nextParams = new URLSearchParams(params);
      nextParams.delete(NOTICE_PARAM);
      router.replace(`${pathname}?${nextParams}`, { scroll: false });
    },
    showAll() {
      setNotes(NO_NOTES);
      go(EMPTY_CONDITIONS, "now", "push", []);
    },
    // 저장된 조건을 지우고 첫 화면으로 (전환은 바로 시작한다)
    details,
    setDetails,
    removeDetailChip(chip: DetailChip) {
      setDetails(withoutDetailChip(details, chip));
    },
    startOver() {
      setNotes(NO_NOTES);
      saveConditions(EMPTY_CONDITIONS);
      change({ conditions: EMPTY_CONDITIONS, showResults: false, keywords: [] }, "now", "push");
    },
  };
}
