// 공고 목록의 한 줄 (기획서 5장 카드 구성을 목록형으로 배치)
// 오른쪽 고정 폭 열에 D-day를 세로로 맞춰 두어 남은 날을 위아래로 훑으며 비교할 수 있게 한다
// 읽는 순서: 머리말(기관) → 공고명 → 대상 조건 레이블, 오른쪽에 언제(D-day). 줄 어디를 눌러도 상세 패널이 열린다 (제목 버튼을 줄 전체로 늘림)
import type { Notice } from "@/domain/notice/notice";
import { targetsOf } from "@/domain/notice/noticeTargets";
import type { BoardCard } from "@/hooks/board/boardColumns";

// 대상을 정하지 않아 통과한 공고에 붙는 태그. 조건과 실제로 맞은 부분이 아니므로 맞음으로 칠하지 않는다
const PASS_THROUGH_REASONS = new Set(["전국"]);

// 레이블이 너무 많으면 줄이 지저분해지므로 앞에서부터 이만큼만 (맞은 것은 항상 보여준다)
const MAX_LABELS = 6;

interface ConditionLabel {
  text: string;
  matched: boolean;
}

// 대상(지역·나이대·업종) 레이블에 맞음 표시를 붙이고, 대상에 없는 맞은 조건(주제·키워드)을 덧붙인다
function conditionLabels(notice: Notice, reasons: string[]): ConditionLabel[] {
  const { regions, ages, industries } = targetsOf(notice);
  const targets = [...regions, ...ages, ...industries];
  const extra = reasons.filter((reason) => !targets.includes(reason));
  const all = [...targets, ...extra].map((text) => ({ text, matched: reasons.includes(text) }));
  return all.filter((label, i) => label.matched || i < MAX_LABELS);
}

interface NoticeRowProps {
  card: BoardCard;
  recommended: boolean; // 조건과 분명히 맞아 먼저 볼 만한 공고
  selected: boolean;
  viewed: boolean; // 이 브라우저에서 열어 본 공고 (제목을 조금 흐리게)
  saved: boolean; // 관심 공고에 담았는지 (담기는 상세에서. 목록에는 표시만)
  onOpen: (id: string) => void;
}

export default function NoticeRow({ card, recommended, selected, viewed, saved, onOpen }: NoticeRowProps) {
  const { match, status, badge, urgent } = card;
  const { notice } = match;
  const reasons = match.reasons.filter((reason) => !PASS_THROUGH_REASONS.has(reason));
  const labels = conditionLabels(notice, reasons);

  return (
    <article
      className={`group relative flex items-center gap-4 px-5 py-5 transition-colors has-[button:focus-visible]:z-10 has-[button:focus-visible]:outline-2 has-[button:focus-visible]:-outline-offset-2 has-[button:focus-visible]:outline-primary sm:gap-6 sm:px-7 sm:py-6 ${
        selected ? "bg-primary-selected" : ""
      }`}
    >
      {/* 머리말(기관) → 공고명 → 대상 조건. 분야는 고르는 데 쓰이지 않아 보여주지 않고, 요약은 길어 잘리므로 상세 패널에서만 보여준다 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* 담은 공고는 기관명 앞에 작은 채운 북마크로만 표시한다 (목록에는 담기 버튼을 두지 않는다) */}
        <p className="flex items-center gap-1.5 text-[13px] text-muted">
          {saved && (
            <>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="size-3.5 shrink-0 text-primary motion-safe:animate-fade-in">
                <path
                  d="M6 3.5h8a.75.75 0 0 1 .75.75v12.1a.35.35 0 0 1-.55.29L10 13.75l-4.2 2.89a.35.35 0 0 1-.55-.29V4.25A.75.75 0 0 1 6 3.5z"
                  fill="currentColor"
                />
              </svg>
              <span className="sr-only">관심 공고: </span>
            </>
          )}
          {notice.org}
        </p>
        <h3
          // 호버는 배경 대신 공고명 색으로(배경을 바꾸면 페이지 바탕과 섞여 보인다), 선택은 진한 틴트 + 파랑 굵은 공고명
          className={`text-[17px] leading-snug tracking-tight transition-colors ${
            selected ? "font-bold text-primary" : `font-semibold group-hover:text-primary ${viewed ? "text-muted" : "text-ink"}`
          }`}
        >
          {viewed && !selected && <span className="sr-only">열어 본 공고: </span>}
          <button
            type="button"
            data-notice-id={notice.id}
            aria-expanded={selected}
            onClick={() => onOpen(notice.id)}
            className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {notice.title}
          </button>
        </h3>

        {/* 대상 조건 레이블: 누구 대상인지(지역·나이대·업종). 내 검색 조건과 맞은 것만 파랗게 칠하고,
            대상에는 없지만 맞은 것(주제·키워드)은 뒤에 덧붙인다 */}
        <ul aria-label="대상 조건" className="mt-2 flex flex-wrap gap-1.5">
          {recommended && (
            <li className="text-trim rounded-sm bg-primary px-2 py-1.5 text-xs font-semibold text-on-primary">먼저 보기</li>
          )}
          {labels.map(({ text, matched }) => (
            <li
              key={text}
              data-matched={matched ? "" : undefined}
              className={`text-trim rounded-sm px-2 py-1.5 text-xs ${matched ? "bg-primary-tint font-semibold text-primary" : "bg-ground text-ink-2"}`}
            >
              {matched && <span className="sr-only">내 조건과 맞음: </span>}
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* 언제: 오른쪽 고정 폭 열에 D-day만 오른쪽으로 맞추고 줄의 세로 가운데에 둔다 (정확한 날짜는 상세 패널에서).
          임박(7일 안)은 빨강. 상시는 구역 이름이 이미 말해 주므로 D-day를 두지 않는다 */}
      {/* 언제: 오른쪽 고정 폭 열에 D-day만 오른쪽으로 맞추고 줄의 세로 가운데에 둔다 (정확한 날짜는 상세 패널에서).
          임박(7일 안)은 빨강. 상시는 구역 이름이 이미 말해 주므로 D-day를 두지 않는다 */}
      {!notice.isAlways && (
        <span
          className={`w-16 shrink-0 text-right tabular-nums sm:w-24 ${
            status === "upcoming" ? "text-[15px] font-medium text-ink-2" : `text-[17px] font-bold ${urgent ? "text-danger" : "text-ink"}`
          }`}
        >
          {badge}
        </span>
      )}
    </article>
  );
}
