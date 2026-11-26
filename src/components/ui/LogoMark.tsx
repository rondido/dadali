// 다람이 로고 마크: 도토리를 안은 파란 다람쥐 (혜택을 도토리처럼 모아 두는 서비스). 파비콘(app/icon.svg)과 같은 그림이다.
// 정사각형에 가까운 모양이라 크기는 높이(h-*)로 정하고 너비는 비율대로 둔다 (className에 h-* w-auto).
// 서비스명 글자 왼쪽에 나란히 두며, 글자가 이름을 알려 주므로 화면 낭독기에는 읽히지 않게 한다
export default function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="5 3 57 57" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
      {/* 꼬리 */}
      <path
        d="M30 58C46 60 60 50 60 34C60 20 50 10 40 12C31 14 30 26 38 29C43 31 47 27 46 23C50 27 51 34 48 41C45 48 38 52 30 52Z"
        fill="#9DBBFC"
      />
      {/* 몸·귀·머리 */}
      <ellipse cx="26" cy="45" rx="14" ry="14" fill="#4D7BF8" />
      <path d="M14 19C12.5 13 13.5 7.5 16.5 5C20 7 23 11.5 22.5 17Z" fill="#1E4194" />
      <circle cx="22" cy="24" r="12" fill="#4D7BF8" />
      {/* 눈·코 */}
      <circle cx="17" cy="22" r="2.3" fill="#FFFFFF" />
      <circle cx="16.5" cy="22.4" r="1.2" fill="#1E4194" />
      <circle cx="10.6" cy="27" r="1.7" fill="#1E4194" />
      {/* 품에 안은 도토리 */}
      <ellipse cx="21" cy="46.5" rx="5" ry="6" fill="#FFFFFF" />
      <path d="M15 43.5C15 39.5 17.7 37.5 21 37.5C24.3 37.5 27 39.5 27 43.5Z" fill="#1E4194" />
      <path d="M21 37.5V34.5" stroke="#1E4194" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
