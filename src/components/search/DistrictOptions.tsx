"use client";

// 지역 선택지 아래에 펼치는 시·군·구 선택지 (조건 추가 창, 선택형 찾기)
// 시·도를 골랐을 때만 그 시·도의 시·군·구를 보여준다. 들여 쓴 작은 버튼 줄로 시·도 아래 단계임을 보인다
// 고른 시·군·구를 다시 누르면 시·군·구만 빼고 시·도는 남긴다
import { regionLabel } from "@/domain/search/conditionValues";
import type { SearchConditions } from "@/domain/search/conditions";
import { DISTRICTS } from "@/domain/search/districts";

interface DistrictOptionsProps {
  conditions: SearchConditions;
  onPick: (district: string | null) => void;
}

export default function DistrictOptions({ conditions, onPick }: DistrictOptionsProps) {
  const { region, district } = conditions;
  if (region === null || DISTRICTS[region].length === 0) return null;

  return (
    <ul
      // 시·도를 바꾸면 새로 펼쳐지는 움직임을 다시 보여준다
      key={region}
      aria-label={`${regionLabel(region)} 시·군·구`}
      className="ml-1 flex flex-wrap gap-1.5 border-l-2 border-line pl-3 motion-safe:animate-fade-in"
    >
      {[...DISTRICTS[region]].sort((a, b) => a.localeCompare(b, "ko")).map((name) => {
        const pressed = district === name;
        return (
          <li key={name}>
            <button
              type="button"
              aria-pressed={pressed}
              onClick={() => onPick(pressed ? null : name)}
              className={`min-h-10 rounded-md px-3 text-sm transition-colors md:min-h-9 xl:min-h-8 xl:px-2.5 ${
                pressed ? "bg-primary font-semibold text-on-primary" : "bg-ground text-ink-2 hover:bg-primary-tint hover:text-primary"
              }`}
            >
              {name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
