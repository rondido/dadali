"use client";

// 공고 상세 패널 (기획서 P04, F08·F10·F12). 보드를 떠나지 않고 카드 옆(1280px 이상), 보드 위 오른쪽(태블릿), 아래에서 올라오는 시트(모바일)로 연다
// 위에서부터: 남은 기간(D-day·남은 날 띠) → 요약 → 대상 → 출처 → 원문 공고 보기. 이동 전 확인 창은 두지 않는다
import { useEffect, useRef, useState } from "react";
import DeadlineStrip, { showsDeadlineStrip } from "@/components/notice/DeadlineStrip";
import SaveButton from "@/components/notice/SaveButton";
import { formatShortDate } from "@/domain/date/formatShortDate";
import { formatSeoulDateTime } from "@/domain/date/seoulDate";
import type { IsoDate, Notice } from "@/domain/notice/notice";
import { officialLinkOf } from "@/domain/notice/officialLink";
import { noticeStatusOf, statusBadgeOf } from "@/domain/notice/noticeStatus";
import { targetsOf } from "@/domain/notice/noticeTargets";
import { PanelBodySkeleton, PanelHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { afterLeave } from "@/hooks/ui/motion";
import { useFocusTrap } from "@/hooks/ui/useFocusTrap";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";

interface NoticePanelProps {
  notice: Notice | null; // URL의 공고를 찾지 못하면 null
  today: IsoDate;
  syncedAt: string | null; // 데이터 최종 갱신 시각 (ISO). 수집 기록이 없으면 null
  onClose: () => void;
  loading?: boolean; // 보여 줄 공고 내용이 아직 없다 (패널 자리는 열고 내용은 스켈레톤)
  saved?: boolean; // 관심 공고에 담았는지
  onToggleSave?: () => void;
  onCopyLink?: () => void; // 이 공고 링크 복사
  onPrev?: () => void; // 목록의 이전 공고 (없으면 버튼을 흐리게)
  onNext?: () => void; // 목록의 다음 공고
}

function TargetRow({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-14 shrink-0 pt-0.5 text-muted">{label}</dt>
      <dd className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span key={v} className="text-trim rounded-sm bg-surface px-2 py-1.5 text-[13px] text-ink-2">
            {v}
          </span>
        ))}
      </dd>
    </div>
  );
}

export default function NoticePanel({ notice, today, syncedAt, onClose, loading = false, saved = false, onToggleSave, onCopyLink, onPrev, onNext }: NoticePanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  // 넓은 화면(1280px 이상)은 목록 옆에 붙어 있는 영역이고, 그보다 좁으면 목록 위에 떠 있는 창이다.
  // 떠 있을 때만 대화 상자로 알리고 Tab 초점을 패널 안에 가둔다 (뒤 목록으로 초점이 빠져나가지 않게)
  const docked = useMediaQuery("(min-width: 1280px)");
  const asideRef = useRef<HTMLElement>(null);
  useFocusTrap(asideRef, !docked);
  // 닫을 때 바로 지우지 않고 사라지는 움직임(모바일은 아래로, 넓은 화면은 오른쪽으로)을 보여 준 뒤 닫는다
  // (뒤로 가기로 닫히면 주소가 먼저 바뀌므로 움직임 없이 사라진다)
  const [leaving, setLeaving] = useState(false);
  const close = () => {
    if (leaving) return;
    setLeaving(true);
    afterLeave(onClose);
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  // 내용이 들어오거나 다른 공고로 바뀌면 제목으로 초점을 옮겨 화면 낭독기가 새 내용을 읽게 한다
  useEffect(() => {
    if (!loading) headingRef.current?.focus();
  }, [notice?.id, loading]);

  // Esc로 닫기
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const badge = notice ? statusBadgeOf(notice, today) : null;
  // 이미 접수 중이면 시작일은 중요하지 않다. 마감까지 남은 날만 보여주고, 접수 예정이면 기간을 글자로 보여준다
  const status = notice ? noticeStatusOf(notice, today) : null;
  const ongoing = status === "open" || status === "closing";
  const strip = ongoing && notice?.applyEnd ? showsDeadlineStrip(today, notice.applyEnd) : false;
  const link = notice ? officialLinkOf(notice) : null;
  const targets = notice ? targetsOf(notice) : null;

  return (
    <>
      {/* 보드 옆에 둘 자리가 없는 화면: 뒤 보드를 흐리게 덮고, 누르면 닫는다 */}
      <button
        type="button"
        aria-label="상세 닫기"
        tabIndex={-1}
        onClick={close}
        className={`fixed inset-0 z-30 bg-ink/30 xl:hidden ${leaving ? "motion-safe:animate-fade-out" : "motion-safe:animate-fade-in"}`}
      />

      <aside
        ref={asideRef}
        role={docked ? undefined : "dialog"}
        aria-modal={docked ? undefined : true}
        aria-labelledby="notice-panel-title"
        aria-keyshortcuts="ArrowUp ArrowDown"
        className={`fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col rounded-t-lg bg-surface shadow-xl md:inset-x-auto md:inset-y-4 md:right-4 md:max-h-none md:w-[26rem] md:rounded-lg xl:static xl:z-auto xl:rounded-none xl:shrink-0 xl:shadow-none 2xl:w-[34rem] ${
          leaving
            ? "motion-safe:animate-sheet-out md:motion-safe:animate-panel-out"
            : "motion-safe:animate-sheet-in md:motion-safe:animate-panel-in"
        }`}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-sm bg-line-strong md:hidden" />

        {/* 다른 공고로 바꾸면 내용을 새로 그려 스크롤을 맨 위로 돌린다. 투명해졌다 나타나면 흰 패널이 깜박여 보이므로 페이드는 하지 않는다 */}
        <div key={notice?.id ?? "none"} className="relative flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-8">
          {/* 머리말(기관) → 강조선 → 공고명 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-2.5 pt-2.5">
              {loading ? (
                <PanelHeaderSkeleton />
              ) : (
                notice && (
                  <>
                    <p className="text-[13px] font-medium text-primary">{notice.org}</p>
                    <span aria-hidden="true" className="trim-line bg-primary" />
                  </>
                )
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {/* 이전·다음 공고: 패널을 닫지 않고 목록을 넘겨 본다 (모바일 포함). 키보드는 ↑/↓도 된다.
                  끝에 닿으면 흐리게만 한다 (금지 커서는 쓰지 않는다). 닫기와는 간격을 두어 잘못 누르지 않게 한다 */}
              {(onPrev || onNext) && (
                <div className="mr-2 flex items-center">
                  {[
                    { label: "이전 공고", onClick: onPrev, path: "m12.5 5-5 5 5 5" },
                    { label: "다음 공고", onClick: onNext, path: "m7.5 5 5 5-5 5" },
                  ].map(({ label, onClick, path }) => (
                    <button
                      key={label}
                      type="button"
                      aria-label={label}
                      title={label}
                      disabled={!onClick}
                      onClick={onClick}
                      className="flex size-11 items-center justify-center rounded-md text-ink-2 hover:bg-ground hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-5">
                        <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                aria-label="상세 닫기"
                onClick={close}
                className="flex size-11 shrink-0 items-center justify-center rounded-md text-xl text-ink-2 hover:bg-ground"
              >
                ×
              </button>
            </div>
          </div>

          {loading ? (
            <PanelBodySkeleton />
          ) : !notice || !badge || !targets ? (
            <h2 id="notice-panel-title" ref={headingRef} tabIndex={-1} className="text-lg font-bold outline-none">
              지원사업을 찾을 수 없어요
            </h2>
          ) : (
            <>
              <div className="-mt-3 flex flex-col gap-2">
                <h2 id="notice-panel-title" ref={headingRef} tabIndex={-1} className="text-2xl font-bold leading-snug tracking-tight outline-none">
                  {notice.title}
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <strong className={`text-[26px] font-bold tracking-tight ${badge.urgent ? "text-danger" : "text-ink"}`}>
                    {notice.isAlways ? "상시 접수" : badge.label}
                  </strong>
                  {status === "upcoming" && notice.applyStart && notice.applyEnd ? (
                    <span className="text-sm tabular-nums text-muted">
                      {formatShortDate(notice.applyStart)} ~ {formatShortDate(notice.applyEnd)}
                    </span>
                  ) : (
                    !strip &&
                    !notice.isAlways &&
                    notice.applyEnd && (
                      <span className="text-sm tabular-nums text-muted">{formatShortDate(notice.applyEnd)} 마감</span>
                    )
                  )}
                </div>
                {strip && notice.applyEnd && <DeadlineStrip today={today} end={notice.applyEnd} />}
              </div>

              {notice.summary && <p className="text-[15px] leading-relaxed text-ink">{notice.summary}</p>}

              <dl aria-label="대상" className="flex flex-col gap-4 bg-ground p-5 text-sm">
                <TargetRow label="지역" values={targets.regions} />
                <TargetRow label="나이대" values={targets.ages} />
                <TargetRow label="업종" values={targets.industries} />
                <TargetRow label="주제" values={targets.topics} />
              </dl>

              {/* 출처·갱신 줄 끝에 링크 복사: 부가 기능이라 아래 버튼 줄과 나눠 덜 눈에 띄게 둔다 */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span><span className="sr-only">출처 </span>{notice.sourceName}</span>
                <span>갱신 {syncedAt ? formatSeoulDateTime(new Date(syncedAt)) : "기록 없음"}</span>
                {onCopyLink && (
                  <button
                    type="button"
                    onClick={onCopyLink}
                    className="ml-auto min-h-8 rounded-sm px-1 font-medium text-ink-2 underline-offset-4 hover:text-primary hover:underline"
                  >
                    링크 복사
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* 원문 이동 버튼은 내용이 길어도 늘 보이게 아래에 고정한다. 선 대신 위쪽 그림자로 스크롤되는 내용과 나눈다 */}
        {/* 불러오는 동안은 버튼 자리만 잡아 두어, 내용이 들어올 때 높이가 튀지 않게 한다 */}
        {loading && (
          <div className="shrink-0 px-6 pt-4 pb-6 md:px-8">
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        )}
        {/* 보고 나서 하는 일(관심 담기, 원문 보기)은 아래 한 줄에 모은다 */}
        {!loading && notice && link && (
          <div className="flex shrink-0 gap-2 px-6 pt-4 pb-6 md:px-8 shadow-[0_-12px_16px_-12px_rgb(22_24_29/0.12)]">
            {onToggleSave && <SaveButton saved={saved} title={notice.title} onToggle={onToggleSave} />}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-md bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover"
            >
              {link.isFallback ? `${notice.sourceName}에서 찾아보기` : "공식 사이트에서 보기"}
              <span aria-hidden="true">↗</span>
              <span className="sr-only">(새 탭)</span>
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
