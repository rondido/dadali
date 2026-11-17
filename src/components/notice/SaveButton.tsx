// 관심 공고 담기 버튼 (북마크). 상세 패널 아래 버튼 줄에서 공식 사이트 버튼 옆에 쓴다.
// 목록에는 담기 버튼을 두지 않고 담은 공고만 표시한다 (줄마다 반복되는 버튼이 목록을 어지럽혀서)
import { useState } from "react";

interface SaveButtonProps {
  saved: boolean;
  title: string; // 공고명 (화면 낭독기에서 어느 공고의 버튼인지 알 수 있게)
  onToggle: () => void;
}

function Bookmark({ saved }: { saved: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 motion-safe:transition-transform motion-safe:active:scale-90">
      <path
        d="M6 3.5h8a.75.75 0 0 1 .75.75v12.1a.35.35 0 0 1-.55.29L10 13.75l-4.2 2.89a.35.35 0 0 1-.55-.29V4.25A.75.75 0 0 1 6 3.5z"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SaveButton({ saved, title, onToggle }: SaveButtonProps) {
  // 누를 때마다 아이콘을 새로 그려 살짝 커졌다 돌아오게 한다 (처음 그릴 때는 움직이지 않는다)
  const [bumps, setBumps] = useState(0);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `관심 공고에서 빼기: ${title}` : `관심 공고에 담기: ${title}`}
      title={saved ? "관심 공고에서 빼기" : "관심 공고에 담기"}
      onClick={() => {
        setBumps((n) => n + 1);
        onToggle();
      }}
      // 옆 공식 사이트 버튼(높이 48px)과 같은 크기의 정사각형
      className={`flex size-12 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
        saved ? "bg-primary-tint text-primary" : "bg-ground text-ink-2 hover:bg-primary-tint hover:text-primary"
      }`}
    >
      <span key={bumps} className={bumps > 0 ? "motion-safe:animate-bump" : ""}>
        <Bookmark saved={saved} />
      </span>
    </button>
  );
}
