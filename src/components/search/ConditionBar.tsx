"use client";

// "이렇게 이해했어요" 해석 칩 줄 (기획서 F03, 5-1장 칩 규칙)
// 지역·나이대·하는 일은 진한 칩, 관심 주제는 테두리 칩. ×를 누르면 그 자리에서 다시 거른다
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
}

const quote = (words: string[]) => words.map((w) => `'${w}'`).join(", ");

export default function ConditionBar({
  conditions,
  regionChoices,
  unknownTerms,
  usedKeywords,
  onRemove,
  onAdd,
}: ConditionBarProps) {
  const chips = toChips(conditions);
  const notUnderstood = unknownTerms.filter((t) => !usedKeywords.includes(t));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink">이렇게 이해했어요</span>
        <ul aria-label="검색 조건" className="contents">
          {chips.map((chip) => {
            const label = chipLabel(chip);
            const strong = chip.kind !== "topic";
            return (
              <li
                key={`${chip.kind}-${chip.value}`}
                className={`flex min-h-9 items-center gap-1.5 rounded-full pl-3 text-sm ${
                  strong ? "bg-ink text-surface" : "border border-ink bg-surface text-ink"
                }`}
              >
                <span className={`text-[11px] ${strong ? "text-line" : "text-muted"}`}>{CHIP_KIND_LABEL[chip.kind]}</span>
                {label}
                <button
                  type="button"
                  aria-label={`${label} 조건 빼기`}
                  onClick={() => onRemove(chip)}
                  className="flex size-9 items-center justify-center rounded-full text-base leading-none hover:opacity-70"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
        {chips.length === 0 && <span className="text-sm text-muted">조건 없이 전체 공고를 보여드려요</span>}
        <AddCondition onAdd={onAdd} />
      </div>

      {regionChoices.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
          <span>다른 지역을 말씀하셨나요?</span>
          {regionChoices.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onAdd({ kind: "region", value: code })}
              className="min-h-9 rounded-full border border-line-strong bg-surface px-3 hover:bg-ground"
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
