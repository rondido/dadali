"use client";

// "이렇게 이해했어요" 해석 칩 줄 (기획서 F03, 5-1장 칩 규칙)
// 지역·나이대·하는 일은 진한 칩, 관심 주제는 테두리 칩. ×를 누르면 그 자리에서 다시 거른다
// PC는 칩과 건수를 한 줄에, 모바일은 칩을 가로 스크롤 한 줄로 두어 보드 자리를 넓힌다
import type { ReactNode } from "react";
import AddCondition from "@/components/search/AddCondition";
import { regionLabel, type RegionCode } from "@/domain/search/conditionValues";
import { CHIP_KIND_LABEL, chipLabel, toChips, type ConditionChip, type SearchConditions } from "@/domain/search/conditions";

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
        <span className="sr-only text-sm font-semibold text-ink md:not-sr-only">이렇게 이해했어요</span>
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
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full pl-3 text-sm md:min-h-9 ${
                    strong ? "bg-ink text-surface" : "border border-ink bg-surface text-ink"
                  }`}
                >
                  <span className={`text-xs ${strong ? "text-line" : "text-muted"}`}>{CHIP_KIND_LABEL[chip.kind]}</span>
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
        {chips.length === 0 && <span className="text-sm text-muted">조건 없이 전체 공고를 보여드려요</span>}
        <AddCondition onAdd={onAdd} />
        {trailing}
      </div>

      {regionChoices.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
          <span>다른 지역을 말씀하셨나요?</span>
          {regionChoices.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onAdd({ kind: "region", value: code })}
              className="min-h-11 rounded-full border border-line-strong bg-surface px-3 hover:bg-ground md:min-h-9"
            >
              {regionLabel(code)}
            </button>
          ))}
        </div>
      )}

      {usedKeywords.length > 0 && (
        <p className="text-sm text-ink-2">{quote(usedKeywords)}는 공고명과 지원 내용에서 찾았어요.</p>
      )}
      {notUnderstood.length > 0 && (
        <p className="text-sm text-ink-2">
          {quote(notUnderstood)}는 이해하지 못했어요. &quot;+ 조건 추가&quot;로 직접 골라 보세요.
        </p>
      )}
    </div>
  );
}
