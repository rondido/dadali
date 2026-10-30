"use client";

// 메인 화면의 검색 상태. 조건은 URL에 두어 새로고침·링크 공유 시 같은 결과가 나오게 한다 (기획서 7-1장)
// URL에 조건이나 all이 있으면 결과 화면, 없으면 첫 화면이다
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  const showResults = hasConditions(conditions) || params.has(SHOW_ALL_PARAM);
  const [notes, setNotes] = useState<InterpretationNotes>(NO_NOTES);

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

  const go = (next: SearchConditions, method: "push" | "replace" = "push") => {
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
