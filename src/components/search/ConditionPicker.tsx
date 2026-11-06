"use client";

// 첫 화면 선택형 찾기: 문장을 쓰지 않아도 지역·나이대·하는 일·관심을 눌러 고르면 결과로 간다
// 입력창과 같은 조건 값을 쓰므로 결과 화면의 칩·URL·저장도 그대로 이어진다
import { useState } from "react";
import type { IsoDate, Notice } from "@/domain/notice/notice";
import { noticeStatusOf } from "@/domain/notice/noticeStatus";
import {
  CONDITION_FIELDS,
  EMPTY_CONDITIONS,
  hasChip,
  hasConditions,
  toggleChip,
  type ConditionChip,
  type SearchConditions,
} from "@/domain/search/conditions";
import { matchNotices } from "@/domain/search/matchNotices";

// 자격 판단을 대신하지 않도록 기준이 사업마다 다른 항목에 안내를 붙인다 (기획서 7-1장)
const FIELD_HINTS: Partial<Record<ConditionChip["kind"], string>> = {
  age: "기준은 사업마다 달라요",
  biz: "사업을 하고 있다면 골라 주세요",
  topic: "여러 개 고를 수 있어요",
};

interface ConditionPickerProps {
  notices: Notice[];
  today: IsoDate;
  onApply: (conditions: SearchConditions) => void;
}

export default function ConditionPicker({ notices, today, onApply }: ConditionPickerProps) {
  const [selected, setSelected] = useState<SearchConditions>(EMPTY_CONDITIONS);

  const ready = hasConditions(selected);
  const count = matchNotices(notices, selected).matches.filter(
    ({ notice }) => noticeStatusOf(notice, today) !== "closed",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {CONDITION_FIELDS.map((field) => (
        <fieldset key={field.kind} className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-ink-2">
            {field.label}
            {FIELD_HINTS[field.kind] && (
              <span className="ml-2 text-xs font-normal text-muted">{FIELD_HINTS[field.kind]}</span>
            )}
          </legend>
          <ul className="flex flex-wrap gap-2">
            {field.options.map((option) => {
              // 값은 CONDITION_FIELDS의 options 중 하나이므로 그 종류의 칩이 된다
              const chip = { kind: field.kind, value: option.value } as ConditionChip;
              const pressed = hasChip(selected, chip);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => setSelected((current) => toggleChip(current, chip))}
                    className={`min-h-11 rounded-full border px-4 text-sm ${
                      pressed
                        ? "border-ink bg-ink text-surface"
                        : "border-line-strong bg-surface text-ink hover:bg-ground"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}

      <button
        type="button"
        disabled={!ready}
        onClick={() => onApply(selected)}
        className="min-h-11 self-start rounded-lg bg-ink px-5 font-semibold text-surface hover:bg-ink-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-2"
      >
        {ready ? `맞을 수 있는 지원사업 ${count}건 보기` : "조건을 하나 이상 골라 주세요"}
      </button>
    </div>
  );
}
