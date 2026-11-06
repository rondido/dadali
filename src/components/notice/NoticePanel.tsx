"use client";

// 공고 상세 패널 (기획서 P04, F08·F10·F12). 보드를 떠나지 않고 카드 옆(PC) 또는 아래에서 올라오는 시트(모바일)로 연다
// 위에서부터: 남은 기간(D-day·기간 달력) → 대상 → 출처 → 원문 공고 보기. 이동 전 확인 창은 두지 않는다
import { useEffect, useRef } from "react";
import PeriodCalendar from "@/components/notice/PeriodCalendar";
import { CATEGORIES, colorTokenOf } from "@/domain/category/categories";
import { formatShortDate } from "@/domain/date/formatShortDate";
import { formatSeoulDateTime } from "@/domain/date/seoulDate";
import type { IsoDate, Notice } from "@/domain/notice/notice";
import { officialLinkOf } from "@/domain/notice/officialLink";
import { STATUS_LABEL, noticeStatusOf, periodProgressOf, statusBadgeOf } from "@/domain/notice/noticeStatus";
import { targetsOf } from "@/domain/notice/noticeTargets";

interface NoticePanelProps {
  notice: Notice | null; // URL의 공고를 찾지 못하면 null
  today: IsoDate;
  syncedAt: string; // 데이터 최종 갱신 시각 (ISO)
  onClose: () => void;
}

function TargetRow({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-14 shrink-0 text-muted">{label}</dt>
      <dd className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span key={v} className="rounded border border-line px-1.5 py-0.5 text-xs text-ink-2">
            {v}
          </span>
        ))}
      </dd>
    </div>
  );
}

export default function NoticePanel({ notice, today, syncedAt, onClose }: NoticePanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // 열리거나 다른 공고로 바뀌면 제목으로 초점을 옮겨 화면 낭독기가 새 내용을 읽게 한다
  useEffect(() => {
    headingRef.current?.focus();
  }, [notice?.id]);

  // Esc로 닫기
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const status = notice ? noticeStatusOf(notice, today) : null;
  const badge = notice ? statusBadgeOf(notice, today) : null;
  const progress = notice ? periodProgressOf(notice, today) : null;
  const link = notice ? officialLinkOf(notice) : null;
  const targets = notice ? targetsOf(notice) : null;

  return (
    <>
      {/* 모바일: 뒤 보드를 흐리게 덮고, 누르면 닫는다 */}
      <button
        type="button"
        aria-label="상세 닫기"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-30 bg-ink/30 md:hidden"
      />

      <aside
        aria-labelledby="notice-panel-title"
        className={`fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col rounded-t-2xl bg-surface shadow-xl md:static md:z-auto md:max-h-none md:w-[26rem] md:shrink-0 md:rounded-lg md:shadow-none md:ring-1 md:ring-line xl:w-[34rem] ${
          notice ? `tone-${colorTokenOf(notice.categoryId)}` : ""
        }`}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong md:hidden" />

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-1.5 pt-1 text-xs text-ink-2">
              {notice && (
                <>
                  <span aria-hidden="true" className="cat-dot" />
                  {CATEGORIES.find((c) => c.id === notice.categoryId)?.name} · {status && STATUS_LABEL[status]}
                </>
              )}
            </p>
            <button
              type="button"
              aria-label="상세 닫기"
              onClick={onClose}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl text-ink-2 hover:bg-ground"
            >
              ×
            </button>
          </div>

          {!notice || !badge || !targets ? (
            <h2 id="notice-panel-title" ref={headingRef} tabIndex={-1} className="text-lg font-bold outline-none">
              공고를 찾을 수 없어요
            </h2>
          ) : (
            <>
              <div className="-mt-3 flex flex-col gap-1">
                <h2 id="notice-panel-title" ref={headingRef} tabIndex={-1} className="text-lg font-bold leading-snug outline-none">
                  {notice.title}
                </h2>
                <p className="text-sm text-muted">{notice.org}</p>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <strong className={`text-3xl font-extrabold ${badge.urgent ? "text-danger" : "text-ink"}`}>
                  {notice.isAlways ? "상시 모집" : badge.label}
                </strong>
                {progress && (
                  <span className="text-sm text-ink-2">
                    {progress.total}일 중 {progress.day}일째
                  </span>
                )}
                {notice.applyStart && notice.applyEnd && (
                  <span className="text-sm text-muted">
                    {formatShortDate(notice.applyStart)} ~ {formatShortDate(notice.applyEnd)}
                  </span>
                )}
              </div>

              {notice.applyStart && notice.applyEnd && (
                <PeriodCalendar start={notice.applyStart} end={notice.applyEnd} today={today} />
              )}

              {notice.summary && <p className="text-sm text-ink">{notice.summary}</p>}

              <dl aria-label="대상" className="flex flex-col gap-2 text-sm">
                <TargetRow label="지역" values={targets.regions} />
                <TargetRow label="나이대" values={targets.ages} />
                <TargetRow label="업종" values={targets.industries} />
                <TargetRow label="주제" values={targets.topics} />
              </dl>

              <p className="text-sm text-ink-2">세부 자격과 나이 기준은 원문 공고에서 확인하세요.</p>
              <p className="text-xs text-muted">
                출처 {notice.sourceName} · 최종 갱신 {formatSeoulDateTime(new Date(syncedAt))}
              </p>
            </>
          )}
        </div>

        {/* 원문 이동 버튼은 내용이 길어도 늘 보이게 아래에 고정한다 */}
        {notice && link && (
          <div className="shrink-0 border-t border-line p-4">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-1 rounded-lg bg-ink px-4 font-semibold text-surface hover:bg-ink-2"
            >
              {link.isFallback ? `${notice.sourceName}에서 공고 찾기` : "원문 공고 보기"}
              <span aria-hidden="true">↗</span>
              <span className="sr-only">(새 탭)</span>
            </a>
            <p className="mt-1.5 text-center text-xs text-muted">
              {link.host}
              {link.isFallback && " · 원문 주소가 없어 사이트 첫 화면으로 이동해요"}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
