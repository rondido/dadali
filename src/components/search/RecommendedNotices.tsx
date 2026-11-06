// 검색 결과 위 "먼저 볼 공고". 같은 공고가 아래 보드에도 있으므로 카드를 다시 그리지 않고 한 줄 요약만 보여준다
// 눌렀을 때 보드 카드처럼 상세 패널을 연다. 화면 높이를 적게 쓰도록 PC에서는 가로로 놓는다
import type { IsoDate } from "@/domain/notice/notice";
import { statusBadgeOf } from "@/domain/notice/noticeStatus";
import type { NoticeMatch } from "@/domain/search/matchNotices";

interface RecommendedNoticesProps {
  items: NoticeMatch[];
  today: IsoDate;
  selectedId: string | null;
  onOpen: (id: string) => void;
}

export default function RecommendedNotices({ items, today, selectedId, onOpen }: RecommendedNoticesProps) {
  return (
    <section aria-labelledby="recommended-title" className="flex flex-col gap-2">
      <h2 id="recommended-title" className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-ink">
        먼저 볼 공고 {items.length}건
        <span className="text-xs font-normal text-muted">조건과 더 많이 맞고 지금 낼 수 있는 순서예요</span>
      </h2>
      <ol className="grid gap-2 md:grid-cols-3">
        {items.map(({ notice, reasons }) => {
          const { label, urgent } = statusBadgeOf(notice, today);
          const selected = notice.id === selectedId;
          return (
            <li key={notice.id}>
              <button
                type="button"
                data-recommended-id={notice.id}
                aria-expanded={selected}
                onClick={() => onOpen(notice.id)}
                className={`flex h-full min-h-11 w-full flex-col gap-1 rounded-md border bg-surface p-2 text-left text-sm hover:border-line-strong ${
                  selected ? "border-ink ring-2 ring-ink" : "border-line"
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="line-clamp-1 font-medium text-ink">{notice.title}</span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
                      urgent ? "bg-danger-tint text-danger" : "bg-ground text-ink-2"
                    }`}
                  >
                    {label}
                  </span>
                </span>
                <span className="text-xs text-ink-2">
                  <span className="sr-only">맞은 조건: </span>
                  {reasons.join(" · ")}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
