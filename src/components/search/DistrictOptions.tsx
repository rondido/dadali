"use client";

// 지역 선택지 아래에 펼치는 시·군·구 선택지 (조건 추가 창, 선택형 찾기)
// 시·도를 골랐을 때만 그 시·도의 시·군·구를 보여준다.
// 시·도 아래 단계임을 선(테두리) 대신 연한 면으로 묶어 보이고, 시·도 버튼(회색 바탕·파란 블록)과 달리
// 바탕 없는 글자 버튼을 고정 열 격자로 줄 맞춰 훑어보기 쉽게 한다. 선택은 흰 바탕 + 파란 굵은 글자.
// 맨 앞 "○○ 전체"는 시·군·구를 고르지 않은 상태다 (누르면 시·군·구만 빼고 시·도는 남긴다)
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

  const options: { label: string; value: string | null }[] = [
    { label: `${regionLabel(region)} 전체`, value: null },
    ...[...DISTRICTS[region]].sort((a, b) => a.localeCompare(b, "ko")).map((name) => ({ label: name, value: name })),
  ];

  return (
    <ul
      // 시·도를 바꾸면 새로 펼쳐지는 움직임을 다시 보여준다
      key={region}
      aria-label={`${regionLabel(region)} 시·군·구`}
      className="grid grid-cols-3 gap-1 bg-ground p-2 motion-safe:animate-fade-in sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-9 xl:p-1.5"
    >
      {options.map(({ label, value }) => {
        const pressed = (district ?? null) === value;
        return (
          <li key={label}>
            <button
              type="button"
              aria-pressed={pressed}
              // 고른 시·군·구를 다시 누르면 시·도 전체로 돌아간다
              onClick={() => onPick(pressed ? null : value)}
              className={`flex min-h-10 w-full items-center justify-center rounded-md px-1.5 text-sm whitespace-nowrap transition-colors md:min-h-9 xl:min-h-7 ${
                pressed ? "bg-surface font-semibold text-primary shadow-sm" : "text-ink-2 hover:bg-surface hover:text-primary"
              }`}
            >
              {label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
