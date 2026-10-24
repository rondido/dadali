// 달력 색 안내: 분야별 색과, 진한 색(마감일)·연한 색(시작일)의 뜻
import { AlwaysIcon, EndIcon, StartIcon } from "@/components/icons/ScheduleIcons";
import { CATEGORIES } from "@/domain/category/categories";

export default function CalendarLegend() {
  return (
    <section
      aria-label="색 안내"
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-surface px-4 py-3 text-sm"
    >
      <ul aria-label="분야" className="flex flex-wrap gap-x-4 gap-y-1">
        {CATEGORIES.map((category) => (
          <li key={category.id} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`legend-swatch legend-swatch-end chip-${category.colorToken}`} />
            {category.name}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="legend-swatch legend-swatch-end legend-swatch-neutral">
            <EndIcon className="legend-icon" />
          </span>
          진한 색 마감일
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="legend-swatch legend-swatch-start legend-swatch-neutral">
            <StartIcon className="legend-icon" />
          </span>
          연한 색 시작일
        </span>
        <span className="flex items-center gap-1.5">
          <AlwaysIcon className="legend-icon-plain" />
          상시 모집은 달력 아래 칸반에
        </span>
      </div>
    </section>
  );
}
