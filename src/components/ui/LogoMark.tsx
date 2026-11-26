// 혜택모아 로고 마크: 더하기(+)가 들어간 파란 하트 (나에게 더해지는 혜택을 모아 보여 주는 서비스). 파비콘(app/icon.svg)과 같은 그림이다.
// sparkle을 켜면 하트 오른쪽 위에 반짝임 두 줄을 더한다 (첫 화면의 큰 로고에만 쓴다)
// 크기는 높이(h-*)로 정하고 너비는 비율대로 둔다 (className에 h-* w-auto).
// 서비스명 글자 왼쪽에 나란히 두며, 글자가 이름을 알려 주므로 화면 낭독기에는 읽히지 않게 한다
const HEART_PATH =
  "M32 15.5C29 11 25 8 19.5 8C10.5 8 4 15 4 24C4 35 13 44 28 55.5C30.3 57.3 33.7 57.3 36 55.5C51 44 60 35 60 24C60 15 53.5 8 44.5 8C39 8 35 11 32 15.5Z";

export default function LogoMark({ className = "", sparkle = false }: { className?: string; sparkle?: boolean }) {
  return (
    <svg viewBox={sparkle ? "2 -12 70 70" : "2 4 60 56"} fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d={HEART_PATH} className="fill-brand" />
      {/* 더하기 */}
      <rect x="36.5" y="22.5" width="15" height="5" rx="2.5" fill="#FFFFFF" />
      <rect x="41.5" y="17.5" width="5" height="15" rx="2.5" fill="#FFFFFF" />
      {sparkle && (
        <g stroke="#60A0F7" strokeWidth="3.4" strokeLinecap="round">
          <path d="M54.5 0L57.5 -8" />
          <path d="M61.5 6L68 1.2" />
        </g>
      )}
    </svg>
  );
}

// 서비스명 글자: "혜택"은 짙은 남색, "모아"는 로고와 같은 파랑. 두 조각이 붙어 있어 화면 낭독기는 "혜택모아"로 읽는다
export function Wordmark() {
  return (
    <span>
      <span className="text-brand-ink">혜택</span>
      <span className="text-brand">모아</span>
    </span>
  );
}
