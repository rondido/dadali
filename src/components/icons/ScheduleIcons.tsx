// 일정 아이콘: 시작(▶), 마감(깃발), 상시(∞). 글자색(currentColor)을 따른다.
// 색을 구분하기 어려운 사용자도 모양으로 시작·마감을 알 수 있게 한다 (기획서 9장 접근성)
interface IconProps {
  className?: string;
}

export function StartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" data-icon="start" className={className}>
      <path d="M5 3.2v9.6L12.5 8z" fill="currentColor" />
    </svg>
  );
}

export function EndIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" data-icon="end" className={className}>
      <path d="M4 2v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.8 2.6h7.6L10.6 5.4l1.8 2.8H4.8z" fill="currentColor" />
    </svg>
  );
}

export function AlwaysIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" data-icon="always" className={className}>
      <path
        d="M8 8c-1.3-1.7-2.4-2.6-3.6-2.6a2.6 2.6 0 0 0 0 5.2C5.6 10.6 6.7 9.7 8 8s2.4-2.6 3.6-2.6a2.6 2.6 0 0 1 0 5.2C10.4 10.6 9.3 9.7 8 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
