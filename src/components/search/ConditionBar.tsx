"use client";

// "이렇게 이해했어요" 해석 칩 줄 (기획서 F03, 5-1장 칩 규칙)
// 지역·나이대·하는 일은 진한 칩, 관심 주제는 테두리 칩으로 모양만으로 구분한다 (종류 이름은 화면 낭독기에만). ×를 누르면 그 자리에서 다시 거른다
// PC는 칩과 건수를 한 줄에, 모바일은 칩을 가로 스크롤 한 줄로 두어 보드 자리를 넓힌다
import type { ReactNode } from "react";
import AddCondition from "@/components/search/AddCondition";
import { regionLabel, type RegionCode } from "@/domain/search/conditionValues";
import { CHIP_KIND_LABEL, chipLabel, toChips, type ConditionChip, type SearchConditions } from "@/domain/search/conditions";
import { josa } from "@/domain/text/josa";

interface ConditionBarProps {
  conditions: SearchConditions;
  regionChoices: RegionCode[];
  unknownTerms: string[];
  usedKeywords: string[];
  onRemove: (chip: ConditionChip) => void;
  onAdd: (chip: ConditionChip) => void;
  trailing?: ReactNode; // 칩 줄 끝에 함께 놓을 내용 (결과 건수)
}

const quote = (words: string[]) => words.map((w) => `'${w}'`).join(", ");
// 여러 단어면 마지막 단어의 받침으로 조사를 고른다 ('복직'이, '고양이'가)
const lastWord = (words: string[]) => words[words.length - 1] ?? "";

export default function ConditionBar({
  conditions,
  regionChoices,
  unknownTerms,
  usedKeywords,
  onRemove,
  onAdd,
  trailing,
}: ConditionBarProps) {
  const chips = toChips(conditions);
  const notUnderstood = unknownTerms.filter((t) => !usedKeywords.includes(t));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="sr-only">이렇게 이해했어요</span>
        {chips.length > 0 && (
          <ul
            aria-label="검색 조건"
            className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none md:flex-none md:flex-wrap md:overflow-visible"
          >
            {chips.map((chip) => {
              const label = chipLabel(chip);
              const strong = chip.kind !== "topic";
              return (
                <li
                  key={`${chip.kind}-${chip.value}`}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md pl-3 text-sm md:min-h-9 ${
                    strong ? "bg-primary text-on-primary" : "border border-primary bg-surface text-primary"
                  }`}
                >
                  <span className="sr-only">{CHIP_KIND_LABEL[chip.kind]}</span>
                  {label}
                  <button
                    type="button"
                    aria-label={`${label} 조건 빼기`}
                    onClick={() => onRemove(chip)}
                    className="flex size-11 items-center justify-center rounded-full text-base leading-none hover:opacity-70 md:size-9"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <AddCondition onAdd={onAdd} />
        {trailing}
      </div>

      {regionChoices.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
          <span>혹시 이 지역인가요?</span>
          {regionChoices.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onAdd({ kind: "region", value: code })}
              className="min-h-11 rounded-md border border-line-strong bg-surface px-3 hover:bg-ground md:min-h-9"
            >
              {regionLabel(code)}
            </button>
          ))}
        </div>
      )}

      {usedKeywords.length > 0 && (
        <p className="text-sm text-ink-2">
          {quote(usedKeywords)}
          {josa(lastWord(usedKeywords), "이", "가")} 들어간 지원사업만 보여 드려요.
        </p>
      )}
      {notUnderstood.length > 0 && (
        <p className="text-sm text-ink-2">
          {quote(notUnderstood)}
          {josa(lastWord(notUnderstood), "은", "는")} 알아듣지 못했어요.
        </p>
      )}
    </div>
  );
}
