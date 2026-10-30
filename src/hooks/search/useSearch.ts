"use client";

// 메인 화면의 검색 상태. 조건은 URL에 두어 새로고침·링크 공유 시 같은 결과가 나오게 한다 (기획서 7-1장)
// URL에 조건이나 all이 있으면 결과 화면, 없으면 첫 화면이다
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { interpretQuery, type DictionaryEntry } from "@/domain/search/interpretQuery";
import { loadSavedConditions, saveConditions } from "./savedConditions";

// 조건 없이 전체 보드를 볼 때 URL에 붙이는 표시
const SHOW_ALL_PARAM = "all";
// 상세 패널로 연 공고 (링크로 공유하면 같은 공고가 열린다)
const NOTICE_PARAM = "notice";

// 해석 결과 중 URL에 담지 않는 것. 새로고침하면 사라진다
interface InterpretationNotes {
  regionChoices: RegionCode[];
  unknownTerms: string[];
}

const NO_NOTES: InterpretationNotes = { regionChoices: [], unknownTerms: [] };

export function useSearch(dictionary: DictionaryEntry[]) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const conditions = useMemo(() => conditionsFromParams(params), [params]);
  const selectedNoticeId = params.get(NOTICE_PARAM);
  const showResults = hasConditions(conditions) || params.has(SHOW_ALL_PARAM) || selectedNoticeId !== null;
  const [notes, setNotes] = useState<InterpretationNotes>(NO_NOTES);
  // 이 화면에서 패널을 열어 방문 기록이 하나 쌓였는지. 그렇다면 닫을 때 뒤로 가서 기록을 되돌린다
  const openedHere = useRef(false);

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

  // 조건이 바뀌면 열려 있던 패널은 닫는다 (새 결과에 그 공고가 없을 수 있다)
  const go = (next: SearchConditions, method: "push" | "replace" = "push") => {
    openedHere.current = false;
    saveConditions(next);
    const nextParams = conditionsToParams(next);
    if (!hasConditions(next)) nextParams.set(SHOW_ALL_PARAM, "1");
    router[method](`${pathname}?${nextParams}`, { scroll: false });
  };

  return {
    ready: checkedSaved || params.size > 0,
    showResults,
    conditions,
    regionChoices: notes.regionChoices.filter((code) => code !== conditions.region),
    unknownTerms: notes.unknownTerms,

    // 문장을 해석해 조건을 바꾼다. 문장 자체는 어디에도 남기지 않는다
    search(text: string) {
      const result = interpretQuery(text, dictionary);
      setNotes({ regionChoices: result.regionChoices, unknownTerms: result.unknownTerms });
      go(result.conditions);
    },
    // 칩 ×: 그 자리에서 다시 거른다
    removeChip(chip: ConditionChip) {
      go(withoutChip(conditions, chip), "replace");
    },
    // "+ 조건 추가"나 지역 후보에서 고른 조건
    addChip(chip: ConditionChip) {
      go(withChip(conditions, chip), "replace");
    },
    selectedNoticeId,
    // 카드를 누르면 상세 패널을 연다. 이미 열려 있으면 기록을 쌓지 않고 내용만 바꾼다
    openNotice(id: string) {
      const nextParams = new URLSearchParams(params);
      if (!hasConditions(conditions)) nextParams.set(SHOW_ALL_PARAM, "1");
      nextParams.set(NOTICE_PARAM, id);
      const url = `${pathname}?${nextParams}`;
      if (selectedNoticeId === null) {
        openedHere.current = true;
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    closeNotice() {
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
      go(EMPTY_CONDITIONS);
    },
    // 저장된 조건을 지우고 첫 화면으로
    startOver() {
      setNotes(NO_NOTES);
      saveConditions(EMPTY_CONDITIONS);
      router.push(pathname, { scroll: false });
    },
  };
}
