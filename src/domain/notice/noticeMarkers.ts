// 공고를 날짜 위 표시(마커)로 바꾸는 규칙 (기획서 5장 칸 표시 규칙)
// 달력·모바일 목록 등 어떤 뷰에서도 같은 규칙을 쓰므로 도메인 계층에 둔다.

// 날짜는 "YYYY-MM-DD" 문자열 (DB date 컬럼 값 그대로, 시간대 변환 없음)
export type IsoDate = string;

// 마커 계산에 필요한 공고 정보만 담는다
export interface NoticeSchedule {
  id: string;
  title: string;
  categoryId: string;
  applyStart: IsoDate | null;
  applyEnd: IsoDate | null;
  isAlways: boolean;
}

export type NoticeMarkerKind = "start" | "end";

export interface NoticeMarker {
  kind: NoticeMarkerKind;
  date: IsoDate;
  notice: NoticeSchedule;
}

// 공고 하나를 시작일·마감일 마커로 바꾼다. 상시 모집은 마커를 만들지 않는다 (F07 상시 모집 띠에서 표시)
export function toNoticeMarkers(notice: NoticeSchedule): NoticeMarker[] {
  if (notice.isAlways) return [];

  const markers: NoticeMarker[] = [];
  // 시작일과 마감일이 같으면 한 칸에 두 번 보이지 않도록 마감 마커만 남긴다
  if (notice.applyStart && notice.applyStart !== notice.applyEnd) {
    markers.push({ kind: "start", date: notice.applyStart, notice });
  }
  if (notice.applyEnd) {
    markers.push({ kind: "end", date: notice.applyEnd, notice });
  }
  return markers;
}

const KIND_ORDER: Record<NoticeMarkerKind, number> = { end: 0, start: 1 };

// 같은 날짜 안의 정렬: 마감 → 시작, 같은 종류는 공고명 순
export function compareNoticeMarkers(a: NoticeMarker, b: NoticeMarker): number {
  return KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.notice.title.localeCompare(b.notice.title, "ko");
}

// 마감일이 오늘보다 앞이면 마감된 공고 (달력에서 흐리게 표시, "접수중" 수에서 제외)
// "YYYY-MM-DD"는 문자열 비교가 날짜 비교와 같다
export function isNoticeClosed(notice: NoticeSchedule, today: IsoDate): boolean {
  return notice.applyEnd !== null && notice.applyEnd < today;
}
