"use client";

// "+ 조건 추가" (기획서 F04): 문장으로 못 잡은 조건을 직접 고른다
// 열면 화면 전체를 어둡게 덮고(dim), 조건 줄과 선택 창만 그 위로 띄워 고르는 일에만 집중하게 한다.
// 고르는 동안 창은 닫히지 않고 위쪽 조건 칩이 바로 바뀐다. 이미 고른 값을 다시 누르면 뺀다. 완료·바깥 누르기·Esc로 닫는다
// "자세히"를 누르면 상세 조건(포함·제외 단어, 전국 대상 제외)을 고른다. 넓은 화면은 창 오른쪽에 패널로 붙고,
// 그보다 좁으면 창 안에서 펼친다. 이미 쓰고 있으면 열린 채로 시작한다
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CONDITION_FIELDS,
  hasChip,
  type ConditionChip,
  type SearchConditions,
} from "@/domain/search/conditions";
import DetailFields from "@/components/search/DetailFields";
import DistrictOptions from "@/components/search/DistrictOptions";
import { detailCount, hasDetails, type DetailFilters } from "@/domain/search/detailFilters";
import { afterLeave } from "@/hooks/ui/motion";
import { useFocusTrap } from "@/hooks/ui/useFocusTrap";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";

interface AddConditionProps {
  conditions: SearchConditions;
  onAdd: (chip: ConditionChip) => void;
  onRemove: (chip: ConditionChip) => void;
  onOpenChange?: (open: boolean) => void;
  details?: DetailFilters; // 상세 조건 ("자세히")
  onDetailsChange?: (next: DetailFilters) => void;
}

export default function AddCondition({ conditions, onAdd, onRemove, onOpenChange, details, onDetailsChange }: AddConditionProps) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // 넓은 화면(1280px 이상)은 조건 추가 창과 자세히 패널을 나란히 둘 자리가 있다
  const wide = useMediaQuery("(min-width: 1280px)");
  // 좁은 화면에서 자세히를 펼치면 본문 맨 아래라 보이지 않을 수 있으므로, 다 펼쳐진 뒤 그 자리로 스크롤한다
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moreOpen || wide) return;
    const timer = setTimeout(() => moreRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 320);
    return () => clearTimeout(timer);
  }, [moreOpen, wide]);
  // 닫을 때 dim과 창이 사라지는 움직임을 보여 준 뒤 지운다. 모아 둔 서버 요청은 닫기 시작할 때 바로 보낸다
  const [leaving, setLeaving] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 창이 열려 있는 동안 Tab 초점이 창 밖(dim 뒤)으로 빠져나가지 않게 한다
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open && !leaving);

  const openPicker = () => {
    setOpen(true);
    setMoreOpen(details ? hasDetails(details) : false);
    onOpenChange?.(true);
  };
  const close = () => {
    if (leaving) return;
    setLeaving(true);
    onOpenChange?.(false);
    triggerRef.current?.focus();
    afterLeave(() => {
      setOpen(false);
      setLeaving(false);
    });
  };

  // Esc 처리기는 열릴 때 한 번 붙이므로, 닫기 함수는 늘 최신 것을 쓰도록 ref로 넘긴다
  const closeRef = useRef(close);
  closeRef.current = close;

  // 열리면 제목으로 초점을 옮기고, Esc로 닫는다
  useEffect(() => {
    if (!open) return;
    // 열리면 창 자체로 초점을 옮긴다 (화면 낭독기는 창 이름 "조건 추가"를 읽는다)
    dialogRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        closeRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open && !leaving}
        aria-controls="add-condition"
        onClick={() => (open ? close() : openPicker())}
        className={`min-h-11 shrink-0 whitespace-nowrap rounded-md px-3 text-sm md:min-h-9 ${
          open && !leaving ? "bg-primary-tint text-primary" : "bg-surface text-ink-2 hover:bg-primary-tint hover:text-primary"
        }`}
      >
        + 조건 추가
      </button>

      {open && (
        <>
          {/* 화면 전체를 덮는 dim. 조건 줄(ConditionBar)은 이보다 위에 떠서 밝게 남는다 */}
          {createPortal(
            <button
              type="button"
              aria-label="조건 추가 닫기"
              tabIndex={-1}
              onClick={close}
              className={`fixed inset-0 z-40 bg-ink/50 ${leaving ? "motion-safe:animate-fade-out" : "motion-safe:animate-fade-in"}`}
            />,
            document.body,
          )}

          {/* 창 묶음: 조건 추가 창과, 넓은 화면에서 "자세히"를 펼치면 그 오른쪽에 붙는 상세 조건 패널 */}
          <div
            ref={dialogRef}
            id="add-condition"
            role="dialog"
            aria-modal="true"
            aria-label="조건 추가"
            tabIndex={-1}
            data-add-open=""
            className={`absolute inset-x-0 top-full z-50 mt-3 flex origin-top-left items-start gap-3 outline-none md:right-auto ${
              leaving ? "motion-safe:animate-pop-out" : "motion-safe:animate-pop-in"
            }`}
          >
            {/* PC(1280px 이상)는 스크롤 없이 한 번에 보이도록 창을 넓히고(선택지 줄 수가 준다) 간격·버튼 높이를 줄이고,
                높이 한도도 화면 높이에서 위쪽 머리만 뺀 만큼으로 늘린다 */}
            <div className="flex max-h-[min(70dvh,44rem)] w-full flex-col overflow-hidden rounded-lg bg-surface shadow-2xl md:w-[44rem] xl:max-h-[calc(100dvh-9rem)] xl:w-[52rem]">
              <div className="relative flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-6 md:p-8 xl:gap-5 xl:p-6">
                {/* 제목은 두지 않는다: 연 버튼에 이미 "+ 조건 추가"라고 쓰여 있다 */}
                {CONDITION_FIELDS.map((field) => (
                  <fieldset key={field.kind} className="flex flex-col gap-3">
                    <legend className="mb-2 text-sm font-semibold text-ink-2 xl:mb-1">{field.label}</legend>
                    <ul className="flex flex-wrap gap-2">
                      {field.options.map((option) => {
                        // 값은 CONDITION_FIELDS의 options 중 하나이므로 그 종류의 칩이 된다
                        // 시·도를 직접 고르면 시·군·구는 비운다 (아래 시·군·구 줄에서 다시 고른다)
                        const chip = (
                          field.kind === "region"
                            ? { kind: field.kind, value: option.value, district: null }
                            : { kind: field.kind, value: option.value }
                        ) as ConditionChip;
                        const pressed = hasChip(conditions, chip);
                        return (
                          <li key={option.value}>
                            <button
                              type="button"
                              aria-pressed={pressed}
                              onClick={() => (pressed ? onRemove(chip) : onAdd(chip))}
                              className={`min-h-11 rounded-md px-4 text-[15px] transition-colors xl:min-h-8 xl:px-3.5 ${
                                pressed ? "bg-primary font-semibold text-on-primary" : "bg-ground text-ink hover:bg-primary-tint hover:text-primary"
                              }`}
                            >
                              {option.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {field.kind === "region" && conditions.region && (
                      <DistrictOptions
                        conditions={conditions}
                        onPick={(district) => onAdd({ kind: "region", value: conditions.region!, district })}
                      />
                    )}
                  </fieldset>
                ))}

                {/* 자세히(상세 조건), 좁은 화면: 본문 맨 아래에서 위아래로 펼친다 (버튼은 아래 완료 줄에 있다).
                    접혀 있을 때는 자리(간격)도 차지하지 않게 한다 */}
                {details && onDetailsChange && !wide && (
                  <div
                    ref={moreRef}
                    id="add-condition-more"
                    className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
                      moreOpen ? "grid-rows-[1fr]" : "-mt-8 grid-rows-[0fr]"
                    }`}
                  >
                    {/* 접혀 있을 때는 안의 입력칸으로 초점이 가지 않게 한다 */}
                    <div className="overflow-hidden px-0.5" inert={!moreOpen}>
                      <div className="pt-1 pb-1">
                        <DetailFields details={details} onChange={onDetailsChange} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 아래 고정 줄: 왼쪽 자세히(스크롤과 상관없이 늘 보인다), 오른쪽 완료 */}
              <div className="flex shrink-0 items-center justify-between gap-3 px-6 pt-3 pb-6 md:px-8 xl:px-6 xl:pb-4">
                {details && onDetailsChange ? (
                  <button
                    type="button"
                    aria-expanded={moreOpen}
                    aria-controls="add-condition-more"
                    onClick={() => setMoreOpen((v) => !v)}
                    className={`-ml-1 flex min-h-11 items-center gap-1.5 rounded-md px-1 text-[15px] font-semibold hover:text-primary ${
                      moreOpen ? "text-primary" : "text-ink-2"
                    }`}
                  >
                    자세히
                    {detailCount(details) > 0 && <span className="tabular-nums text-primary">{detailCount(details)}</span>}
                    {/* 좁은 화면: 위(펼치기)·아래(접기), 넓은 화면: 오른쪽(패널 열기)·왼쪽(닫기) */}
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className={`size-4 transition-transform motion-reduce:transition-none ${
                        wide ? (moreOpen ? "rotate-90" : "-rotate-90") : moreOpen ? "" : "rotate-180"
                      }`}
                    >
                      <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={close}
                  className="min-h-12 rounded-md bg-primary px-8 font-semibold text-on-primary hover:bg-primary-hover"
                >
                  완료
                </button>
              </div>
            </div>

            {/* 넓은 화면의 자세히 패널: 조건 추가 창 오른쪽에 붙어 열린다 */}
            {wide && moreOpen && details && onDetailsChange && (
              // 제목·닫기 버튼은 두지 않는다: 연 버튼에 이미 "자세히"라고 쓰여 있고, 그 버튼을 다시 누르면 닫힌다
              <section
                id="add-condition-more"
                aria-label="자세히"
                className="flex max-h-[calc(100dvh-11rem)] w-[22rem] shrink-0 flex-col overflow-y-auto rounded-lg bg-surface p-7 shadow-2xl motion-safe:animate-panel-in"
              >
                <DetailFields details={details} onChange={onDetailsChange} />
              </section>
            )}
          </div>
        </>
      )}
    </>
  );
}
