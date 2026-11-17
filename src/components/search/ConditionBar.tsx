"use client";

// "이렇게 이해했어요" 해석 칩 줄 (기획서 F03, 5-1장 칩 규칙)
// 지역·나이대·하는 일은 진한 칩, 관심 주제는 테두리 칩으로 모양만으로 구분한다 (종류 이름은 화면 낭독기에만). ×를 누르면 그 자리에서 다시 거른다
// PC는 칩을 여러 줄로 감싸고, 모바일은 칩을 가로 스크롤 한 줄로 두어 보드 자리를 넓힌다
import { useState, type ReactNode } from "react";
import AddCondition from "@/components/search/AddCondition";
import { regionLabel, type RegionCode } from "@/domain/search/conditionValues";
import { CHIP_KIND_LABEL, chipLabel, toChips, type ConditionChip, type SearchConditions } from "@/domain/search/conditions";
import type { DetailFilters } from "@/domain/search/detailFilters";
import { josa } from "@/domain/text/josa";
import { afterLeave } from "@/hooks/ui/motion";

interface ConditionBarProps {
  conditions: SearchConditions;
  regionChoices: RegionCode[];
  unknownTerms: string[];
  usedKeywords: string[];
  onRemove: (chip: ConditionChip) => void;
  onAdd: (chip: ConditionChip) => void;
  onPickerOpenChange?: (open: boolean) => void; // 조건 추가 창을 열고 닫을 때 (열려 있는 동안 서버 요청을 모은다)
  trailing?: ReactNode; // 칩 줄 끝에 함께 놓을 내용 (결과 건수·관심·링크 복사). 모바일에서는 다음 줄 오른쪽으로 내린다
  understoodFrom?: string | null; // 방금 검색한 문장. 있으면 칩이 이 문장에서 나왔다고 한 번 알려 준다
  detailChips?: { key: string; label: string; onRemove: () => void }[]; // 상세 조건 칩 (회색, 기본 조건 칩 뒤)
  details?: DetailFilters; // 조건 추가 창의 "자세히"에서 고른다
  onDetailsChange?: (next: DetailFilters) => void;
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
  onPickerOpenChange,
  trailing,
  understoodFrom = null,
  detailChips = [],
  details,
  onDetailsChange,
}: ConditionBarProps) {
  const chips = toChips(conditions);
  // 빼는 중인 칩: 폭이 줄며 사라지는 움직임을 보여 준 뒤 실제로 뺀다 (옆 칩이 순간 이동하지 않게)
  const [removing, setRemoving] = useState<string[]>([]);
  const removeWithMotion = (chip: ConditionChip, key: string) => {
    if (removing.includes(key)) return;
    setRemoving((current) => [...current, key]);
    afterLeave(() => {
      setRemoving((current) => current.filter((k) => k !== key));
      onRemove(chip);
    });
  };
  const notUnderstood = unknownTerms.filter((t) => !usedKeywords.includes(t));

  return (
    // 조건 추가 창이 열리면(data-add-open) 이 줄 전체를 dim 위로 띄워, 고르는 대로 바뀌는 칩이 밝게 보이게 한다
    <div className="relative flex flex-col gap-2 has-[[data-add-open]]:z-50">
      {/* 검색 직후에만: 칩이 내 문장에서 나왔다는 것을 알려 준다. 칩을 바꾸면 사라진다 */}
      {understoodFrom ? (
        <p className="text-[13px] text-muted motion-safe:animate-fade-in">
          &lsquo;<span className="text-ink-2">{understoodFrom}</span>&rsquo; 검색 조건
        </p>
      ) : (
        <span className="sr-only">검색 조건</span>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {chips.length > 0 && (
          <ul
            aria-label="검색 조건"
            className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none md:flex-none md:flex-wrap md:overflow-visible"
          >
            {chips.map((chip) => {
              const label = chipLabel(chip);
              const strong = chip.kind !== "topic";
              const key = `${chip.kind}-${chip.value}`;
              return (
                <li
                  key={key}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-md pl-3 text-sm md:min-h-9 ${
                    strong ? "bg-primary text-on-primary" : "bg-primary-tint text-primary"
                  } ${removing.includes(key) ? "pointer-events-none motion-safe:animate-chip-out" : "motion-safe:animate-chip-in"}`}
                >
                  <span className="sr-only">{CHIP_KIND_LABEL[chip.kind]}</span>
                  {label}
                  <button
                    type="button"
                    aria-label={`${label} 조건 빼기`}
                    onClick={() => removeWithMotion(chip, key)}
                    className="flex size-11 items-center justify-center rounded-md text-base leading-none hover:opacity-70 md:size-9"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {/* 상세 조건 칩: 기본 조건과 구분되게 흰 바탕 회색 글자. 받아 둔 목록에서 거르므로 빼면 바로 바뀐다 */}
        {detailChips.length > 0 && (
          <ul aria-label="상세 조건" className="flex shrink-0 flex-wrap items-center gap-2">
            {detailChips.map((chip) => (
              <li
                key={chip.key}
                className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-md bg-surface pl-3 text-sm text-ink-2 motion-safe:animate-chip-in md:min-h-9"
              >
                {chip.label}
                <button
                  type="button"
                  aria-label={`${chip.label} 빼기`}
                  onClick={chip.onRemove}
                  className="flex size-11 items-center justify-center rounded-md text-base leading-none hover:opacity-70 md:size-9"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <AddCondition
          conditions={conditions}
          onAdd={onAdd}
          onRemove={onRemove}
          onOpenChange={onPickerOpenChange}
          details={details}
          onDetailsChange={onDetailsChange}
        />
        {/* 모바일은 칩 줄이 좁으므로 건수·버튼을 다음 줄 오른쪽으로 내린다 */}
        {trailing && <div className="flex w-full items-center justify-end gap-3 md:ml-auto md:w-auto">{trailing}</div>}
      </div>

      {regionChoices.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2 motion-safe:animate-fade-in">
          <span>다른 지역</span>
          {regionChoices.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onAdd({ kind: "region", value: code })}
              className="min-h-11 rounded-md bg-surface px-3 hover:bg-primary-tint md:min-h-9"
            >
              {regionLabel(code)}
            </button>
          ))}
        </div>
      )}

      {usedKeywords.length > 0 && (
        <p className="text-sm text-ink-2 motion-safe:animate-fade-in">
          {quote(usedKeywords)}
          {josa(lastWord(usedKeywords), "이", "가")} 들어간 공고만 보여요
        </p>
      )}
      {notUnderstood.length > 0 && (
        <p className="text-sm text-ink-2 motion-safe:animate-fade-in">
          {quote(notUnderstood)}
          {josa(lastWord(notUnderstood), "은", "는")} 조건으로 찾지 못했어요
        </p>
      )}
    </div>
  );
}
