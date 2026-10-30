// 공고 카드 (기획서 5장 카드 구성): 분야 태그, 상태 배지, 공고명, 주관기관, 접수 기간, 기간 막대, 왜 걸렸는지 태그
// 끌어 옮길 수 있는 것처럼 보이지 않게 손잡이를 두지 않는다
import { AlwaysIcon, EndIcon, StartIcon } from "@/components/icons/ScheduleIcons";
import { CATEGORIES, colorTokenOf } from "@/domain/category/categories";
import { formatShortDate } from "@/domain/date/formatShortDate";
import type { BoardCard } from "@/hooks/board/boardColumns";

export default function NoticeCard({ card }: { card: BoardCard }) {
  const { match, badge, urgent, progress } = card;
  const { notice, reasons } = match;
  const categoryName = CATEGORIES.find((c) => c.id === notice.categoryId)?.name;

  return (
    <article className="rounded-md border border-line bg-surface p-3 text-sm">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-ink-2">
          <span aria-hidden="true" className={`cat-dot tone-${colorTokenOf(notice.categoryId)}`} />
          {categoryName}
        </span>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 font-semibold ${
            urgent ? "bg-danger-tint text-danger" : "bg-ground text-ink-2"
          }`}
        >
          {badge}
        </span>
      </div>

      <h4 className="mt-1.5 font-medium leading-snug text-ink">{notice.title}</h4>
      <p className="mt-0.5 text-xs text-muted">{notice.org}</p>

      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {notice.isAlways ? (
          <span className="flex items-center gap-1">
            <AlwaysIcon className="card-icon" />
            상시 모집
          </span>
        ) : (
          <>
            {notice.applyStart && (
              <span className="flex items-center gap-1">
                <StartIcon className="card-icon" />
                <span className="sr-only">시작</span>
                {formatShortDate(notice.applyStart)}
              </span>
            )}
            {notice.applyEnd && (
              <span className="flex items-center gap-1">
                <EndIcon className="card-icon" />
                <span className="sr-only">마감</span>
                {formatShortDate(notice.applyEnd)}
              </span>
            )}
          </>
        )}
      </p>

      {progress && (
        <div
          role="meter"
          aria-label="접수 기간 중 지난 날"
          aria-valuemin={1}
          aria-valuemax={progress.total}
          aria-valuenow={progress.day}
          aria-valuetext={`${progress.total}일 중 ${progress.day}일째`}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
        >
          <div
            className={`h-full rounded-full ${urgent ? "bg-danger" : "bg-ink-2"}`}
            style={{ width: `${(progress.day / progress.total) * 100}%` }}
          />
        </div>
      )}

      {reasons.length > 0 && (
        <ul aria-label="검색 조건과 맞은 부분" className="mt-2 flex flex-wrap gap-1">
          {reasons.map((reason) => (
            <li key={reason} className="rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-2">
              {reason}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
