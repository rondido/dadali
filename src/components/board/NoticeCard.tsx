// 공고 카드 (기획서 5장 카드 구성): 분야 태그, 상태 배지, 공고명, 주관기관, 접수 기간, 기간 막대, 왜 걸렸는지 태그
// 끌어 옮길 수 있는 것처럼 보이지 않게 손잡이를 두지 않는다. 카드 어디를 눌러도 상세 패널이 열린다 (제목 버튼을 카드 전체로 늘림)
// 읽는 순서: 상태(배지) → 공고명(가장 크게) → 기관·기간(작게) → 맞은 조건
import { CATEGORIES, colorTokenOf } from "@/domain/category/categories";
import { formatShortDate } from "@/domain/date/formatShortDate";
import type { Notice } from "@/domain/notice/notice";
import type { BoardCard } from "@/hooks/board/boardColumns";

// 대상을 정하지 않아 통과한 공고에 붙는 태그. 조건과 실제로 맞은 태그와 구분해 흐리게 보여준다
const PASS_THROUGH_REASONS = new Set(["전국"]);

interface NoticeCardProps {
  card: BoardCard;
  recommended: boolean; // 조건과 분명히 맞아 먼저 볼 만한 공고
  selected: boolean;
  onOpen: (id: string) => void;
}

// 아이콘 대신 글자로: "10.28 – 11.11", "~ 11.11", "11.12부터", "상시 모집"
function periodText(notice: Notice): string {
  if (notice.isAlways) return "상시 모집";
  const { applyStart: start, applyEnd: end } = notice;
  if (start && end) return `${formatShortDate(start)} – ${formatShortDate(end)}`;
  if (end) return `~ ${formatShortDate(end)}`;
  if (start) return `${formatShortDate(start)}부터`;
  return "";
}

export default function NoticeCard({ card, recommended, selected, onOpen }: NoticeCardProps) {
  const { match, badge, urgent, progress } = card;
  const { notice, reasons } = match;
  const categoryName = CATEGORIES.find((c) => c.id === notice.categoryId)?.name;
  const period = periodText(notice);

  return (
    <article
      className={`relative rounded-lg border bg-surface p-3 text-sm transition-colors hover:border-line-strong has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-primary ${
        selected ? "border-primary ring-2 ring-primary" : "border-line"
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 text-muted">
          <span aria-hidden="true" className={`cat-dot shrink-0 tone-${colorTokenOf(notice.categoryId)}`} />
          <span className="truncate">{categoryName}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 tabular-nums">
          {recommended && (
            <span className="rounded-sm bg-primary-tint px-1.5 py-0.5 font-semibold text-primary">먼저 보기</span>
          )}
          <span
            className={`rounded-sm px-1.5 py-0.5 font-semibold ${
              urgent ? "bg-danger-tint text-danger" : "bg-ground text-ink-2"
            }`}
          >
            {badge}
          </span>
        </span>
      </div>

      <h4 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-tight text-ink">
        <button
          type="button"
          data-notice-id={notice.id}
          aria-expanded={selected}
          onClick={() => onOpen(notice.id)}
          className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        >
          {notice.title}
        </button>
      </h4>

      <p className="mt-1 text-xs text-muted">
        {notice.org}
        {period && (
          <>
            <span aria-hidden="true" className="mx-1.5 text-line-strong">
              |
            </span>
            <span className="sr-only">접수 기간 </span>
            <span className="tabular-nums">{period}</span>
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
          className="mt-2 h-1 overflow-hidden rounded-full bg-line"
        >
          <div
            className={`h-full rounded-full ${urgent ? "bg-danger" : "bg-primary"}`}
            style={{ width: `${(progress.day / progress.total) * 100}%` }}
          />
        </div>
      )}

      {reasons.length > 0 && (
        <ul aria-label="검색 조건과 맞은 부분" className="mt-2 flex flex-wrap gap-1">
          {reasons.map((reason) => (
            <li
              key={reason}
              className={`rounded-sm px-1.5 py-0.5 text-xs ${
                PASS_THROUGH_REASONS.has(reason) ? "bg-ground text-muted" : "bg-primary-tint font-medium text-primary"
              }`}
            >
              {reason}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
