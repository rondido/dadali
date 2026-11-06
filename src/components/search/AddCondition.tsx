"use client";

// "+ 조건 추가" (기획서 F04): 문장으로 못 잡은 조건을 직접 고른다
import { useState } from "react";
import { AGE_GROUPS, INDUSTRIES, REGIONS, TOPICS } from "@/domain/search/conditionValues";
import type { ConditionChip } from "@/domain/search/conditions";

interface AddConditionProps {
  onAdd: (chip: ConditionChip) => void;
}

const FIELDS = [
  { kind: "region", label: "지역", options: REGIONS },
  { kind: "age", label: "나이대", options: AGE_GROUPS },
  { kind: "biz", label: "하는 일", options: INDUSTRIES },
  { kind: "topic", label: "관심", options: TOPICS },
] as const;

export default function AddCondition({ onAdd }: AddConditionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="contents">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="add-condition"
        onClick={() => setOpen((v) => !v)}
        className="min-h-9 rounded-full border border-dashed border-line-strong px-3 text-sm text-ink-2 hover:bg-surface"
      >
        + 조건 추가
      </button>

      {open && (
        <div id="add-condition" className="flex w-full flex-wrap gap-2 rounded-lg bg-surface p-3 ring-1 ring-line">
          {FIELDS.map((field) => (
            <label key={field.kind} className="flex items-center gap-1.5 text-sm text-ink-2">
              {field.label}
              <select
                value=""
                onChange={(e) => {
                  // 고른 값은 FIELDS의 options 중 하나이므로 그 종류의 칩이 된다
                  onAdd({ kind: field.kind, value: e.target.value } as ConditionChip);
                  setOpen(false);
                }}
                className="min-h-9 rounded border border-line-strong bg-surface px-2 text-ink"
              >
                <option value="" disabled>
                  선택
                </option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
