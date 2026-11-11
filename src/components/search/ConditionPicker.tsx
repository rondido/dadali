"use client";

// 선택형 찾기: 문장에서 조건을 하나도 찾지 못했을 때 지역·나이대·하는 일·관심을 눌러 고르게 한다
// 입력창과 같은 조건 값을 쓰므로 칩·URL·저장도 그대로 이어진다
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
          <legend className="text-sm font-medium text-ink-2">{field.label}</legend>
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
                    className={`min-h-11 rounded-md border px-4 text-sm ${
                      pressed
                        ? "border-primary bg-primary text-on-primary"
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
        className="min-h-11 self-start rounded-md bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-2"
      >
        {ready ? `지원사업 ${count.toLocaleString()}건 보기` : "지원사업 보기"}
      </button>
    </div>
  );
}
