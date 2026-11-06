"use client";

// "+ 조건 추가" (기획서 F04): 문장으로 못 잡은 조건을 직접 고른다
import { useState } from "react";
import { CONDITION_FIELDS, type ConditionChip } from "@/domain/search/conditions";

interface AddConditionProps {
  onAdd: (chip: ConditionChip) => void;
}

export default function AddCondition({ onAdd }: AddConditionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="contents">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="add-condition"
        onClick={() => setOpen((v) => !v)}
        className="min-h-11 shrink-0 whitespace-nowrap rounded-full border border-dashed border-line-strong px-3 text-sm text-ink-2 hover:bg-surface md:min-h-9"
      >
        + 조건 추가
      </button>

      {open && (
        <div id="add-condition" className="flex w-full flex-wrap gap-2 rounded-lg bg-surface p-3 ring-1 ring-line">
          {CONDITION_FIELDS.map((field) => (
            <label key={field.kind} className="flex items-center gap-1.5 text-sm text-ink-2">
              {field.label}
              <select
                value=""
                onChange={(e) => {
                  // 고른 값은 CONDITION_FIELDS의 options 중 하나이므로 그 종류의 칩이 된다
                  onAdd({ kind: field.kind, value: e.target.value } as ConditionChip);
                  setOpen(false);
                }}
                className="min-h-11 rounded border border-line-strong bg-surface px-2 text-ink md:min-h-9"
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
